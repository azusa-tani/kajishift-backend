/**
 * 予約管理サービス
 */

const prisma = require('../config/database');
const notificationService = require('./notificationService');
const emailService = require('./emailService');
const uploadService = require('./uploadService');
const {
  jstSlotToUtcRangeMs,
  bookingToUtcRangeMs,
  intervalsOverlap,
} = require('../utils/jstSlot');

const createHttpError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const BLOCKING_BOOKING_STATUSES = ['CONFIRMED', 'IN_PROGRESS'];
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** 予約レスポンスの worker に付けるプロフィール画像（File テーブル PROFILE_IMAGE の最新1件） */
const WORKER_PROFILE_FILES = {
  where: { fileType: 'PROFILE_IMAGE' },
  orderBy: { createdAt: 'desc' },
  take: 1,
  select: { filePath: true },
};

/**
 * Prisma の worker.files を API 用の profileImageUrl に変換（files はレスポンスに含めない）
 * @param {object|null|undefined} worker
 */
function serializeBookingWorker(worker) {
  if (!worker) return null;
  const { files, ...rest } = worker;
  const fp = Array.isArray(files) && files[0] && files[0].filePath;
  const profileImageUrl = fp ? uploadService.getFileUrl(fp) : null;
  return { ...rest, profileImageUrl };
}

/**
 * @param {object} booking
 */
function serializeBooking(booking) {
  if (!booking) return booking;
  return { ...booking, worker: serializeBookingWorker(booking.worker) };
}

/** Express の qs やクライアントによりクエリ値が配列になることがあるため先頭要素を採用 */
const firstQueryValue = (value) => {
  if (value === undefined || value === null) return value;
  return Array.isArray(value) ? value[0] : value;
};

/**
 * available などの真偽クエリを正規化（'true', 'True', true, '1' 等）
 */
const parseBooleanQuery = (value) => {
  const v = firstQueryValue(value);
  if (v === true || v === 1) return true;
  if (v === false || v === 0 || v === '' || v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
};

/** YYYY-MM-DD は UTC の日境界として解釈（scheduledDate が UTC 0:00 で保存されている前提） */
const parseDateFilterUtc = (value, endOfDay) => {
  const raw = firstQueryValue(value);
  if (raw === undefined || raw === null || raw === '') return null;
  const str = String(raw).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    return endOfDay
      ? new Date(Date.UTC(y, mo, d, 23, 59, 59, 999))
      : new Date(Date.UTC(y, mo, d, 0, 0, 0, 0));
  }
  const dt = new Date(str);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const pad2 = (n) => String(n).padStart(2, '0');

const getJstDateParts = (ms) => {
  const d = new Date(ms + JST_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    dayKey: DAY_KEYS[d.getUTCDay()],
    minutes: d.getUTCHours() * 60 + d.getUTCMinutes(),
  };
};

const formatJstYmdFromMs = (ms) => {
  const p = getJstDateParts(ms);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
};

const addDaysYmd = (ymd, days) => {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days, 0, 0, 0, 0));
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
};

const enumerateJstYmdRange = (startYmd, endYmd) => {
  const out = [];
  for (let cur = startYmd; cur <= endYmd; cur = addDaysYmd(cur, 1)) {
    out.push(cur);
  }
  return out;
};

const getBookingRange = (booking) => {
  const range = bookingToUtcRangeMs(booking);
  if (!range) {
    throw createHttpError('予約日時または利用時間が不正です', 400);
  }
  const startJst = getJstDateParts(range.startMs);
  const endJst = getJstDateParts(range.endMs);
  return {
    ...range,
    startYmd: formatJstYmdFromMs(range.startMs),
    // 終了ぴったりのスロットを含めないよう、暦日判定は 1ms 手前を見る
    endYmd: formatJstYmdFromMs(Math.max(range.startMs, range.endMs - 1)),
    startDayKey: startJst.dayKey,
    startMinutes: startJst.minutes,
    endMinutes: endJst.minutes,
  };
};

const parseJsonProfileField = (raw) => {
  const s = raw == null ? '' : String(raw).trim();
  if (!s || !s.startsWith('{')) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

const timeToMinutes = (value) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 24 || min < 0 || min > 59 || (h === 24 && min !== 0)) return null;
  return h * 60 + min;
};

const isWithinAvailabilityText = (availabilityText, bookingRange) => {
  const parsed = parseJsonProfileField(availabilityText);
  if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.days)) return true;
  if (bookingRange.startYmd !== bookingRange.endYmd) return true;

  const day = parsed.days.find((d) => d && d.key === bookingRange.startDayKey);
  if (!day) return true;
  if (day.closed === true) return false;

  const start = timeToMinutes(day.start);
  const end = timeToMinutes(day.end);
  if (start == null || end == null || end <= start) return true;

  return bookingRange.startMinutes >= start && bookingRange.endMinutes <= end;
};

const normalizeText = (value) =>
  String(value || '')
    .replace(/\s+/g, '')
    .toLowerCase();

const isWithinServiceAreaText = (serviceAreaText, address) => {
  const addr = normalizeText(address);
  if (!addr) return true;

  const parsed = parseJsonProfileField(serviceAreaText);
  if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.rows) || parsed.rows.length === 0) {
    return true;
  }

  const rows = parsed.rows
    .map((r) => ({
      city: normalizeText(r && r.city),
      ward: normalizeText(r && r.ward),
    }))
    .filter((r) => r.city || r.ward);
  if (rows.length === 0) return true;

  if (rows.some((r) => (r.city && addr.includes(r.city)) || (r.ward && addr.includes(r.ward)))) {
    return true;
  }

  const cityInAddress = addr.match(/[^,、。]*?市/);
  if (cityInAddress) {
    const city = cityInAddress[0];
    return rows.some((r) => r.city && city.includes(r.city));
  }

  return true;
};

const findOverlappingBookings = async (workerIds, bookingRange, excludeBookingId = null) => {
  if (!workerIds.length) return new Set();

  const rows = await prisma.booking.findMany({
    where: {
      workerId: { in: workerIds },
      status: { in: BLOCKING_BOOKING_STATUSES },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      scheduledDate: {
        gte: new Date(bookingRange.startMs - 48 * 60 * 60 * 1000),
        lte: new Date(bookingRange.endMs + 48 * 60 * 60 * 1000),
      },
    },
    select: {
      id: true,
      workerId: true,
      scheduledDate: true,
      duration: true,
      startTime: true,
      status: true,
    },
  });

  const blocked = new Set();
  rows.forEach((booking) => {
    const other = bookingToUtcRangeMs(booking);
    if (other && intervalsOverlap(bookingRange.startMs, bookingRange.endMs, other.startMs, other.endMs)) {
      blocked.add(booking.workerId);
    }
  });
  return blocked;
};

const findUnavailableSlotOverlaps = async (workerIds, bookingRange) => {
  if (!workerIds.length) return new Set();

  const dates = enumerateJstYmdRange(bookingRange.startYmd, bookingRange.endYmd);
  const rows = await prisma.workerUnavailableSlot.findMany({
    where: {
      workerId: { in: workerIds },
      localDate: { in: dates },
    },
    select: {
      workerId: true,
      localDate: true,
      slotIndex: true,
    },
  });

  const blocked = new Set();
  rows.forEach((slot) => {
    const slotRange = jstSlotToUtcRangeMs(slot.localDate, slot.slotIndex);
    if (intervalsOverlap(bookingRange.startMs, bookingRange.endMs, slotRange.startMs, slotRange.endMs)) {
      blocked.add(slot.workerId);
    }
  });
  return blocked;
};

const selectAvailableWorkerFields = {
  id: true,
  name: true,
  bio: true,
  hourlyRate: true,
  serviceAreaText: true,
  availabilityText: true,
  rating: true,
  reviewCount: true,
  approvalStatus: true,
  createdAt: true,
  updatedAt: true,
};

const assertWorkerAssignableToBooking = async (booking, workerId, worker = null) => {
  const targetWorker =
    worker ||
    (await prisma.user.findUnique({
      where: { id: workerId },
      select: {
        id: true,
        role: true,
        status: true,
        approvalStatus: true,
        serviceAreaText: true,
        availabilityText: true,
      },
    }));

  if (!targetWorker) {
    throw new Error('指定されたワーカーが見つかりません');
  }
  if (targetWorker.role !== 'WORKER') {
    throw new Error('指定されたユーザーはワーカーではありません');
  }
  if (targetWorker.status !== 'ACTIVE') {
    throw new Error('指定されたワーカーは利用できません');
  }
  if (targetWorker.approvalStatus !== 'APPROVED') {
    throw new Error('指定されたワーカーはまだ承認されていません');
  }

  const bookingRange = getBookingRange(booking);
  if (!isWithinAvailabilityText(targetWorker.availabilityText, bookingRange)) {
    throw createHttpError('選択したワーカーはこの時間帯に対応できません。別のワーカーを選択してください。', 409);
  }
  if (!isWithinServiceAreaText(targetWorker.serviceAreaText, booking.address)) {
    throw createHttpError('選択したワーカーはこのエリアに対応できません。別のワーカーを選択してください。', 409);
  }

  const [bookingOverlaps, unavailableOverlaps] = await Promise.all([
    findOverlappingBookings([workerId], bookingRange, booking.id || null),
    findUnavailableSlotOverlaps([workerId], bookingRange),
  ]);
  if (bookingOverlaps.has(workerId) || unavailableOverlaps.has(workerId)) {
    throw createHttpError('選択したワーカーはこの時間帯に対応できなくなりました。別のワーカーを選択してください。', 409);
  }

  return true;
};

/**
 * 予約一覧を取得
 * @param {string} userId - ユーザーID
 * @param {string} userRole - ユーザーロール
 * @param {object} filters - フィルター（status, serviceType, startDate, endDate, page, limit）
 */
const getBookings = async (userId, userRole, filters = {}) => {
  const { 
    status, 
    serviceType, 
    startDate, 
    endDate,
    available, // ワーカー未割り当ての予約を取得する場合
    page = 1, 
    limit = 20 
  } = filters;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const skip = (pageNum - 1) * limitNum;

  const statusStrRaw = firstQueryValue(status);
  let statusStr;
  if (statusStrRaw === undefined || statusStrRaw === null || statusStrRaw === '') {
    statusStr = undefined;
  } else {
    statusStr = String(statusStrRaw).trim();
    if (statusStr === '') statusStr = undefined;
  }
  const wantOpenJobs = userRole === 'WORKER' && parseBooleanQuery(available);

  // クエリ条件を構築
  const where = {};

  // ロールに応じてフィルター
  if (userRole === 'CUSTOMER') {
    where.customerId = userId;
  } else if (userRole === 'WORKER') {
    // available=true の場合は、ワーカー未割り当ての予約のみ（新規案件一覧）
    if (wantOpenJobs) {
      where.workerId = { equals: null };
      // ステータス未指定時は PENDING のみ（従来どおり）
      if (!statusStr) {
        where.status = 'PENDING';
      }
    } else {
      // 通常は自分に割り当てられた予約を取得
      where.workerId = userId;
    }
  } else if (userRole === 'ADMIN') {
    // 管理者はすべての予約を取得
  } else {
    throw new Error('無効なユーザーロールです');
  }

  // ステータスフィルター（複数のステータスをカンマ区切りで受け取れる）
  if (statusStr) {
    if (statusStr.includes(',')) {
      const statusArray = statusStr.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
      where.status = { in: statusArray };
    } else {
      where.status = statusStr.toUpperCase();
    }
  }

  // サービス種別フィルター
  const serviceTypeNorm = firstQueryValue(serviceType);
  if (serviceTypeNorm !== undefined && serviceTypeNorm !== null && String(serviceTypeNorm).trim() !== '') {
    where.serviceType = String(serviceTypeNorm).trim();
  }

  // 日付範囲フィルター（YYYY-MM-DD は UTC 日単位。それ以外は従来どおり Date パース）
  if (startDate || endDate) {
    where.scheduledDate = {};
    if (startDate) {
      const gte = parseDateFilterUtc(startDate, false);
      if (gte) where.scheduledDate.gte = gte;
    }
    if (endDate) {
      const lte = parseDateFilterUtc(endDate, true);
      if (lte) where.scheduledDate.lte = lte;
    }
    if (Object.keys(where.scheduledDate).length === 0) {
      delete where.scheduledDate;
    }
  }

  // 予約を取得
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        worker: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            hourlyRate: true,
            rating: true,
            files: WORKER_PROFILE_FILES,
          },
        },
      },
      orderBy: {
        scheduledDate: 'desc'
      },
      skip,
      take: limitNum
    }),
    prisma.booking.count({ where })
  ]);

  return {
    bookings: bookings.map(serializeBooking),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * 予約詳細を取得
 * @param {string} bookingId - 予約ID
 * @param {string} userId - ユーザーID
 * @param {string} userRole - ユーザーロール
 */
const getBookingById = async (bookingId, userId, userRole) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true
        }
      },
      worker: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          hourlyRate: true,
          rating: true,
          bio: true,
          reviewCount: true,
          files: WORKER_PROFILE_FILES,
        },
      },
      review: {
        include: {
          reviewer: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      payment: {
        select: {
          id: true,
          status: true,
          amount: true,
          paymentMethod: true,
        },
      },
    }
  });

  if (!booking) {
    const nf = new Error('予約が見つかりません');
    nf.status = 404;
    throw nf;
  }

  // 権限チェック：顧客またはワーカー、または管理者のみアクセス可能
  if (userRole !== 'ADMIN') {
    if (userRole === 'CUSTOMER' && booking.customerId !== userId) {
      const e = new Error('この予約にアクセスする権限がありません');
      e.status = 403;
      throw e;
    }
    if (userRole === 'WORKER' && booking.workerId !== userId) {
      const e = new Error('この予約にアクセスする権限がありません');
      e.status = 403;
      throw e;
    }
  }

  return serializeBooking(booking);
};

/**
 * 予約条件に合う利用可能ワーカー候補を取得
 * @param {string} bookingId
 * @param {string} userId
 * @param {string} userRole
 */
const getAvailableWorkersForBooking = async (bookingId, userId, userRole) => {
  const booking = await getBookingById(bookingId, userId, userRole);
  const bookingRange = getBookingRange(booking);

  const candidates = await prisma.user.findMany({
    where: {
      role: 'WORKER',
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
    },
    select: selectAvailableWorkerFields,
    orderBy: [
      { rating: 'desc' },
      { reviewCount: 'desc' },
    ],
    take: 100,
  });

  const workerIds = candidates.map((worker) => worker.id);
  const [bookingOverlaps, unavailableOverlaps] = await Promise.all([
    findOverlappingBookings(workerIds, bookingRange, booking.id),
    findUnavailableSlotOverlaps(workerIds, bookingRange),
  ]);

  const workers = candidates
    .filter((worker) => !bookingOverlaps.has(worker.id))
    .filter((worker) => !unavailableOverlaps.has(worker.id))
    .filter((worker) => isWithinAvailabilityText(worker.availabilityText, bookingRange))
    .filter((worker) => isWithinServiceAreaText(worker.serviceAreaText, booking.address))
    .map(({ availabilityText, ...worker }) => worker);

  return {
    bookingId: booking.id,
    workers,
    pagination: {
      page: 1,
      limit: workers.length,
      total: workers.length,
      totalPages: workers.length > 0 ? 1 : 0,
    },
  };
};

/**
 * 予約を作成
 * @param {string} customerId - 顧客ID
 * @param {object} bookingData - 予約データ
 */
const createBooking = async (customerId, bookingData) => {
  const { workerId, serviceType, scheduledDate, startTime, duration, address, notes } = bookingData;

  // 必須フィールドのチェック
  if (!serviceType || !scheduledDate || !startTime || !duration || !address) {
    throw new Error('サービス種類、予約日時、開始時間、時間数、住所は必須です');
  }

  // 予約日時のバリデーション
  const scheduledDateTime = new Date(scheduledDate);
  if (isNaN(scheduledDateTime.getTime())) {
    throw new Error('有効な予約日時を入力してください');
  }

  // 過去の日付でないかチェック
  if (scheduledDateTime < new Date()) {
    throw new Error('過去の日時は予約できません');
  }

  // 時間数のバリデーション
  if (duration <= 0 || duration > 24) {
    throw new Error('時間数は1時間以上24時間以下である必要があります');
  }

  // ワーカーが指定されている場合、ワーカーの存在・空き状況を確認
  if (workerId) {
    await assertWorkerAssignableToBooking(
      {
        customerId,
        workerId,
        serviceType,
        scheduledDate: scheduledDateTime,
        startTime,
        duration,
        address,
      },
      workerId
    );
  }

  // 予約を作成
  const booking = await prisma.booking.create({
    data: {
      customerId,
      workerId: workerId || null,
      serviceType,
      scheduledDate: scheduledDateTime,
      startTime,
      duration,
      address,
      notes: notes || null,
      status: workerId ? 'CONFIRMED' : 'PENDING'
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      worker: workerId ? {
        select: {
          id: true,
          name: true,
          email: true,
          hourlyRate: true,
          files: WORKER_PROFILE_FILES,
        },
      } : undefined
    }
  });

  // 通知を生成（ワーカーが指定されている場合）
  if (workerId) {
    try {
      await notificationService.createNotification(
        workerId,
        'BOOKING_CREATED',
        '新しい予約が作成されました',
        `${booking.customer.name}さんから「${serviceType}」の予約が作成されました。`,
        booking.id,
        'BOOKING'
      );
    } catch (error) {
      // 通知生成エラーは無視（予約作成は成功）
      console.error('通知生成エラー:', error);
    }
  }

  // メール送信（顧客とワーカーに送信）
  try {
    // 顧客に予約確認メールを送信
    await emailService.sendBookingConfirmationEmail(
      booking.customer.email,
      booking.customer.name,
      {
        id: booking.id,
        serviceType,
        scheduledDate,
        startTime,
        duration,
        address,
        workerName: booking.worker ? booking.worker.name : null
      }
    );

    // ワーカーが指定されている場合、ワーカーにもメールを送信
    if (booking.worker) {
      await emailService.sendBookingConfirmationEmail(
        booking.worker.email,
        booking.worker.name,
        {
          id: booking.id,
          serviceType,
          scheduledDate,
          startTime,
          duration,
          address,
          workerName: null // ワーカー自身にはワーカー名を表示しない
        }
      );
    }
  } catch (error) {
    // メール送信エラーは無視（予約作成は成功）
    console.error('メール送信エラー:', error);
  }

  return serializeBooking(booking);
};

/**
 * 予約を更新
 * @param {string} bookingId - 予約ID
 * @param {string} userId - ユーザーID
 * @param {string} userRole - ユーザーロール
 * @param {object} updateData - 更新データ
 */
const updateBooking = async (bookingId, userId, userRole, updateData) => {
  // 予約の存在確認と権限チェック
  const booking = await getBookingById(bookingId, userId, userRole);

  // ステータスチェック：完了またはキャンセル済みの予約は更新不可（ステータス更新を除く）
  const { serviceType, scheduledDate, startTime, duration, address, notes, workerId, status } = updateData;
  
  if (status === undefined && (booking.status === 'COMPLETED' || booking.status === 'CANCELLED')) {
    throw createHttpError('完了またはキャンセル済みの予約は更新できません', 409);
  }

  const updateFields = {};

  if (serviceType !== undefined) {
    updateFields.serviceType = serviceType;
  }

  if (scheduledDate !== undefined) {
    const scheduledDateTime = new Date(scheduledDate);
    if (isNaN(scheduledDateTime.getTime())) {
      throw new Error('有効な予約日時を入力してください');
    }
    if (scheduledDateTime < new Date()) {
      throw new Error('過去の日時は予約できません');
    }
    updateFields.scheduledDate = scheduledDateTime;
  }

  if (startTime !== undefined) {
    updateFields.startTime = startTime;
  }

  if (duration !== undefined) {
    if (duration <= 0 || duration > 24) {
      throw new Error('時間数は1時間以上24時間以下である必要があります');
    }
    updateFields.duration = duration;
  }

  if (address !== undefined) {
    updateFields.address = address;
  }

  if (notes !== undefined) {
    updateFields.notes = notes;
  }

  // ワーカーの変更（顧客のみ可能）
  if (workerId !== undefined && userRole === 'CUSTOMER') {
    if (workerId) {
      await assertWorkerAssignableToBooking(
        {
          ...booking,
          ...updateFields,
          workerId,
        },
        workerId
      );
    }
    updateFields.workerId = workerId || null;
    // ワーカーが設定された場合、ステータスをCONFIRMEDに変更（既にCOMPLETEDの場合は変更しない）
    if (workerId && booking.status === 'PENDING' && !updateFields.status) {
      updateFields.status = 'CONFIRMED';
    }
  }

  // 汎用更新での status 直接変更は admin のみに限定する。
  // customer/worker は accept/reject/complete/cancel などの専用APIを使う。
  if (status !== undefined) {
    if (userRole !== 'ADMIN') {
      throw createHttpError('予約ステータスの変更は専用APIを使用してください', 403);
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new Error('無効なステータスです');
    }
    
    // ステータスの遷移チェック
    if (status === 'COMPLETED' && booking.status !== 'IN_PROGRESS' && booking.status !== 'CONFIRMED') {
      throw new Error('進行中または確定済みの予約のみ完了にできます');
    }
    
    updateFields.status = status;
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: updateFields,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      worker: {
        select: {
          id: true,
          name: true,
          email: true,
          hourlyRate: true,
          files: WORKER_PROFILE_FILES,
        },
      },
    }
  });

  // 変更タイプを判定
  let changeType = 'DETAILS';
  if (status && status !== booking.status) {
    changeType = 'STATUS';
  } else if (scheduledDate !== undefined || startTime !== undefined) {
    changeType = 'DATE';
  }

  // 通知を生成（ステータス変更時）
  if (status && status !== booking.status) {
    try {
      const notifyUserId = userRole === 'CUSTOMER' && updatedBooking.workerId 
        ? updatedBooking.workerId 
        : userRole === 'WORKER' 
        ? updatedBooking.customerId 
        : null;

      if (notifyUserId) {
        const statusMessages = {
          'CONFIRMED': '予約が確定しました',
          'IN_PROGRESS': '予約が開始されました',
          'COMPLETED': '予約が完了しました',
          'CANCELLED': '予約がキャンセルされました'
        };

        await notificationService.createNotification(
          notifyUserId,
          'BOOKING_UPDATE',
          '予約が更新されました',
          statusMessages[status] || '予約のステータスが更新されました',
          updatedBooking.id,
          'BOOKING'
        );
      }
    } catch (error) {
      // 通知生成エラーは無視（予約更新は成功）
      console.error('通知生成エラー:', error);
    }
  }

  // メール送信（変更があった場合）
  if (Object.keys(updateFields).length > 0) {
    try {
      // 顧客にメール送信
      if (updatedBooking.customer && updatedBooking.customer.email) {
        await emailService.sendBookingUpdateEmail(
          updatedBooking.customer.email,
          updatedBooking.customer.name,
          {
            id: updatedBooking.id,
            bookingId: updatedBooking.id,
            serviceType: updatedBooking.serviceType,
            scheduledDate: updatedBooking.scheduledDate,
            startTime: updatedBooking.startTime,
            duration: updatedBooking.duration,
            address: updatedBooking.address,
            status: updatedBooking.status
          },
          changeType
        );
      }

      // ワーカーにメール送信
      if (updatedBooking.worker && updatedBooking.worker.email) {
        await emailService.sendBookingUpdateEmail(
          updatedBooking.worker.email,
          updatedBooking.worker.name,
          {
            id: updatedBooking.id,
            bookingId: updatedBooking.id,
            serviceType: updatedBooking.serviceType,
            scheduledDate: updatedBooking.scheduledDate,
            startTime: updatedBooking.startTime,
            duration: updatedBooking.duration,
            address: updatedBooking.address,
            status: updatedBooking.status
          },
          changeType
        );
      }
    } catch (error) {
      // メール送信エラーは無視（予約更新は成功）
      console.error('メール送信エラー:', error);
    }
  }

  return serializeBooking(updatedBooking);
};

/**
 * 予約をキャンセル
 * @param {string} bookingId - 予約ID
 * @param {string} userId - ユーザーID
 * @param {string} userRole - ユーザーロール
 */
const cancelBooking = async (bookingId, userId, userRole) => {
  // 予約の存在確認と権限チェック
  const booking = await getBookingById(bookingId, userId, userRole);

  // ステータスチェック：完了またはキャンセル済みの予約はキャンセル不可
  if (booking.status === 'COMPLETED') {
    throw new Error('完了済みの予約はキャンセルできません');
  }

  if (booking.status === 'CANCELLED') {
    throw new Error('この予約は既にキャンセルされています');
  }

  const completedPayment = await prisma.payment.findFirst({
    where: {
      bookingId,
      status: 'COMPLETED'
    }
  });

  if (completedPayment) {
    throw new Error('決済済みの予約は管理者による返金手続き後にキャンセルしてください');
  }

  // 予約をキャンセル
  const cancelledBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CANCELLED'
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      worker: {
        select: {
          id: true,
          name: true,
          email: true,
          files: WORKER_PROFILE_FILES,
        },
      },
    }
  });

  // 通知を生成
  try {
    const notifyUserId = userRole === 'CUSTOMER' && cancelledBooking.workerId 
      ? cancelledBooking.workerId 
      : userRole === 'WORKER' 
      ? cancelledBooking.customerId 
      : null;

    if (notifyUserId) {
      await notificationService.createNotification(
        notifyUserId,
        'BOOKING_CANCELLED',
        '予約がキャンセルされました',
        `${cancelledBooking.customer.name}さんの予約がキャンセルされました。`,
        cancelledBooking.id,
        'BOOKING'
      );
    }
  } catch (error) {
    // 通知生成エラーは無視（予約キャンセルは成功）
    console.error('通知生成エラー:', error);
  }

  return serializeBooking(cancelledBooking);
};

/**
 * 予約を承諾（ワーカーのみ）
 * @param {string} bookingId - 予約ID
 * @param {string} userId - ユーザーID（ワーカー）
 */
const acceptBooking = async (bookingId, userId) => {
  // 予約の存在確認
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      worker: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!booking) {
    throw createHttpError('予約が見つかりません', 404);
  }

  // ワーカーのみ承諾可能
  const worker = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true }
  });

  if (!worker || worker.role !== 'WORKER') {
    throw createHttpError('ワーカーのみ予約を承諾できます', 403);
  }

  if (worker.status !== 'ACTIVE') {
    throw createHttpError('アクティブなワーカーのみ予約を承諾できます', 403);
  }

  // ステータスチェック：PENDINGの予約のみ承諾可能
  if (booking.status !== 'PENDING') {
    throw createHttpError('確定待ちの予約のみ承諾できます', 409);
  }

  // 既に他のワーカーが割り当てられている場合はエラー
  if (booking.workerId && booking.workerId !== userId) {
    throw createHttpError('この予約は既に他のワーカーに割り当てられています', 409);
  }

  // 予約を承諾（ワーカーを割り当て、ステータスをCONFIRMEDに変更）
  const acceptedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      workerId: userId,
      status: 'CONFIRMED'
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      },
      worker: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          files: WORKER_PROFILE_FILES,
        },
      },
    }
  });

  // 通知を生成（顧客に通知）
  try {
    await notificationService.createNotification(
      acceptedBooking.customerId,
      'BOOKING_UPDATE',
      '予約が確定しました',
      `${acceptedBooking.worker.name}さんが予約を承諾しました。`,
      acceptedBooking.id,
      'BOOKING'
    );
  } catch (error) {
    console.error('通知生成エラー:', error);
  }

  return serializeBooking(acceptedBooking);
};

/**
 * 予約を拒否（ワーカーのみ）
 * @param {string} bookingId - 予約ID
 * @param {string} userId - ユーザーID（ワーカー）
 * @param {string} reason - 拒否理由（オプション）
 */
const rejectBooking = async (bookingId, userId, reason = null) => {
  // 予約の存在確認
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      worker: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!booking) {
    throw createHttpError('予約が見つかりません', 404);
  }

  // ワーカーのみ拒否可能
  const worker = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true }
  });

  if (!worker || worker.role !== 'WORKER') {
    throw new Error('ワーカーのみ予約を拒否できます');
  }

  // ステータスチェック：PENDINGまたはCONFIRMEDの予約のみ拒否可能
  if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
    throw new Error('確定待ちまたは確定済みの予約のみ拒否できます');
  }

  // 自分が割り当てられている予約のみ拒否可能
  if (booking.workerId && booking.workerId !== userId) {
    throw new Error('自分が割り当てられていない予約は拒否できません');
  }

  // 予約を拒否（ワーカーを解除、ステータスをPENDINGに戻す）
  const rejectedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      workerId: null,
      status: 'PENDING'
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      },
      worker: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          files: WORKER_PROFILE_FILES,
        },
      },
    }
  });

  // 通知を生成（顧客に通知）
  try {
    const rejectMessage = reason 
      ? `${worker.name}さんが予約を拒否しました。理由: ${reason}`
      : `${worker.name}さんが予約を拒否しました。`;
    
    await notificationService.createNotification(
      rejectedBooking.customerId,
      'BOOKING_UPDATE',
      '予約が拒否されました',
      rejectMessage,
      rejectedBooking.id,
      'BOOKING'
    );
  } catch (error) {
    console.error('通知生成エラー:', error);
  }

  return serializeBooking(rejectedBooking);
};

/**
 * 作業完了（ワーカーのみ）
 * @param {string} bookingId - 予約ID
 * @param {string} userId - ユーザーID（ワーカー）
 */
const completeBooking = async (bookingId, userId) => {
  // 予約の存在確認
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      worker: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!booking) {
    throw new Error('予約が見つかりません');
  }

  // ワーカーのみ完了可能
  const worker = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true }
  });

  if (!worker || worker.role !== 'WORKER') {
    throw createHttpError('ワーカーのみ作業を完了できます', 403);
  }

  // 自分が割り当てられている予約のみ完了可能
  if (booking.workerId !== userId) {
    throw createHttpError('自分が割り当てられていない予約は完了できません', 403);
  }

  // ステータスチェック：IN_PROGRESSまたはCONFIRMEDの予約のみ完了可能
  if (booking.status !== 'IN_PROGRESS' && booking.status !== 'CONFIRMED') {
    throw createHttpError('進行中または確定済みの予約のみ完了できます', 409);
  }

  // 予約を完了
  const completedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date()
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      },
      worker: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          files: WORKER_PROFILE_FILES,
        },
      },
    }
  });

  // 通知を生成（顧客に通知）
  try {
    await notificationService.createNotification(
      completedBooking.customerId,
      'BOOKING_UPDATE',
      '作業が完了しました',
      `${completedBooking.worker.name}さんによる作業が完了しました。`,
      completedBooking.id,
      'BOOKING'
    );
  } catch (error) {
    console.error('通知生成エラー:', error);
  }

  return serializeBooking(completedBooking);
};

module.exports = {
  getBookings,
  getBookingById,
  getAvailableWorkersForBooking,
  createBooking,
  updateBooking,
  cancelBooking,
  acceptBooking,
  rejectBooking,
  completeBooking,
  /** 決済 API 等で booking.worker に profileImageUrl を付与する際に利用 */
  serializeBooking,
  WORKER_PROFILE_FILES,
  // テスト用の純粋関数
  _availabilityHelpers: {
    getBookingRange,
    isWithinAvailabilityText,
    isWithinServiceAreaText,
  },
};

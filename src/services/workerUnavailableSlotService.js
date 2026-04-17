/**
 * ワーカー本人の利用不可スロット（JST 暦日 + 30 分 index）
 */

const prisma = require('../config/database');
const {
  assertYmd,
  jstSlotToUtcRangeMs,
  slotOverlapsBooking
} = require('../utils/jstSlot');

const firstQueryValue = (value) => {
  if (value === undefined || value === null) return value;
  return Array.isArray(value) ? value[0] : value;
};

const httpError = (status, message, code) => {
  const e = new Error(message);
  e.status = status;
  if (code) e.code = code;
  return e;
};

const compareYmd = (a, b) => {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

const assertDateRange = (startDate, endDate) => {
  assertYmd(startDate);
  assertYmd(endDate);
  if (compareYmd(startDate, endDate) > 0) {
    throw httpError(400, 'startDate は endDate 以下である必要があります', 'INVALID_RANGE');
  }
};

const normalizeSlotItem = (item) => {
  if (!item || typeof item !== 'object') return null;
  const date = item.date ?? item.localDate;
  const slotIndex = item.slotIndex;
  if (typeof date !== 'string' || !Number.isInteger(slotIndex)) return null;
  return { date: date.trim(), slotIndex };
};

const parseSlotKey = (key) => {
  if (typeof key !== 'string') return null;
  const parts = key.split('|');
  if (parts.length !== 2) return null;
  const slotIndex = parseInt(parts[1], 10);
  if (!Number.isInteger(slotIndex)) return null;
  return { date: parts[0].trim(), slotIndex };
};

const slotToDto = (row) => ({
  id: row.id,
  date: row.localDate,
  slotIndex: row.slotIndex,
  slotKey: `${row.localDate}|${row.slotIndex}`,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

async function fetchBlockingBookings(workerId, rangeStartMs, rangeEndMs) {
  return prisma.booking.findMany({
    where: {
      workerId,
      status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
      scheduledDate: {
        gte: new Date(rangeStartMs - 48 * 60 * 60 * 1000),
        lte: new Date(rangeEndMs + 48 * 60 * 60 * 1000)
      }
    },
    select: {
      id: true,
      scheduledDate: true,
      duration: true,
      startTime: true,
      status: true
    }
  });
}

function assertNoBookingOverlap(workerId, bookings, localDate, slotIndex) {
  for (const b of bookings) {
    if (slotOverlapsBooking(localDate, slotIndex, b)) {
      const e = httpError(
        409,
        '確定または進行中の予約と時間が重なるため、この時間帯は利用不可にできません',
        'BOOKING_OVERLAP'
      );
      e.details = { bookingId: b.id };
      throw e;
    }
  }
}

/**
 * 一覧取得
 */
const listSlots = async (workerId, startDate, endDate) => {
  const sd = firstQueryValue(startDate);
  const ed = firstQueryValue(endDate);
  if (!sd || !ed) {
    throw httpError(400, 'startDate と endDate は必須です（YYYY-MM-DD）', 'MISSING_QUERY');
  }
  assertDateRange(String(sd).trim(), String(ed).trim());

  const rows = await prisma.workerUnavailableSlot.findMany({
    where: {
      workerId,
      localDate: { gte: String(sd).trim(), lte: String(ed).trim() }
    },
    orderBy: [{ localDate: 'asc' }, { slotIndex: 'asc' }]
  });

  return { slots: rows.map(slotToDto) };
};

/**
 * 単一作成（既存ならそのレコードを返す）
 */
const createSlot = async (workerId, date, slotIndex) => {
  assertYmd(date);
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > 47) {
    throw httpError(400, 'slotIndex は 0 以上 47 以下の整数である必要があります', 'INVALID_SLOT_INDEX');
  }

  const existing = await prisma.workerUnavailableSlot.findFirst({
    where: { workerId, localDate: date, slotIndex }
  });
  if (existing) {
    return { slot: slotToDto(existing), created: false };
  }

  const { startMs, endMs } = jstSlotToUtcRangeMs(date, slotIndex);
  const bookings = await fetchBlockingBookings(workerId, startMs, endMs);
  assertNoBookingOverlap(workerId, bookings, date, slotIndex);

  const created = await prisma.workerUnavailableSlot.create({
    data: { workerId, localDate: date, slotIndex }
  });
  return { slot: slotToDto(created), created: true };
};

/**
 * 複数作成（localStorage 移行など）
 * @param {boolean} continueOnError - true のとき予約重複・不正はスキップして続行
 */
const createBatch = async (workerId, items, continueOnError = false) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw httpError(400, 'items は空でない配列である必要があります', 'INVALID_BODY');
  }

  const created = [];
  const skipped = [];
  const dedupe = new Set();

  for (const raw of items) {
    const n = normalizeSlotItem(raw) || (typeof raw === 'string' ? parseSlotKey(raw) : null);
    if (!n) {
      if (!continueOnError) {
        throw httpError(400, '各要素は { date, slotIndex } または "YYYY-MM-DD|index" 形式の文字列です', 'INVALID_ITEM');
      }
      skipped.push({ raw, reason: 'INVALID_ITEM' });
      continue;
    }

    try {
      assertYmd(n.date);
    } catch (err) {
      if (!continueOnError) throw err;
      skipped.push({ date: n.date, slotIndex: n.slotIndex, reason: 'INVALID_DATE' });
      continue;
    }

    if (!Number.isInteger(n.slotIndex) || n.slotIndex < 0 || n.slotIndex > 47) {
      if (!continueOnError) {
        throw httpError(400, 'slotIndex は 0 以上 47 以下の整数である必要があります', 'INVALID_SLOT_INDEX');
      }
      skipped.push({ date: n.date, slotIndex: n.slotIndex, reason: 'INVALID_SLOT_INDEX' });
      continue;
    }

    const key = `${n.date}|${n.slotIndex}`;
    if (dedupe.has(key)) continue;
    dedupe.add(key);

    try {
      const r = await createSlot(workerId, n.date, n.slotIndex);
      if (r.created) created.push(r.slot);
      else skipped.push({ ...r.slot, reason: 'ALREADY_EXISTS' });
    } catch (e) {
      if (continueOnError && (e.code === 'BOOKING_OVERLAP' || e.status === 409)) {
        skipped.push({ date: n.date, slotIndex: n.slotIndex, reason: e.code || 'CONFLICT' });
        continue;
      }
      if (continueOnError && e.status === 400) {
        skipped.push({ date: n.date, slotIndex: n.slotIndex, reason: e.code || 'BAD_REQUEST' });
        continue;
      }
      throw e;
    }
  }

  return { created, skipped };
};

/**
 * 週など範囲内を一括置換（範囲外の利用不可は変更しない）
 */
const syncRange = async (workerId, startDate, endDate, slots) => {
  assertDateRange(startDate, endDate);
  if (!Array.isArray(slots)) {
    throw httpError(400, 'slots は配列である必要があります', 'INVALID_BODY');
  }

  const normalized = [];
  for (const raw of slots) {
    const n = normalizeSlotItem(raw) || (typeof raw === 'string' ? parseSlotKey(raw) : null);
    if (!n) {
      throw httpError(400, 'slots の各要素は { date, slotIndex } または "YYYY-MM-DD|index" です', 'INVALID_ITEM');
    }
    assertYmd(n.date);
    if (!Number.isInteger(n.slotIndex) || n.slotIndex < 0 || n.slotIndex > 47) {
      throw httpError(400, 'slotIndex は 0 以上 47 以下の整数である必要があります', 'INVALID_SLOT_INDEX');
    }
    if (compareYmd(n.date, startDate) < 0 || compareYmd(n.date, endDate) > 0) {
      throw httpError(
        400,
        `slots 内の日付 ${n.date} は ${startDate}〜${endDate} の範囲内である必要があります`,
        'DATE_OUT_OF_SYNC_RANGE'
      );
    }
    normalized.push(n);
  }

  let rangeStartMs;
  let rangeEndMs;
  try {
    rangeStartMs = jstSlotToUtcRangeMs(startDate, 0).startMs;
    rangeEndMs = jstSlotToUtcRangeMs(endDate, 47).endMs;
  } catch (e) {
    throw e;
  }

  const bookings = await fetchBlockingBookings(workerId, rangeStartMs, rangeEndMs);
  for (const n of normalized) {
    assertNoBookingOverlap(workerId, bookings, n.date, n.slotIndex);
  }

  await prisma.$transaction(async (tx) => {
    await tx.workerUnavailableSlot.deleteMany({
      where: {
        workerId,
        localDate: { gte: startDate, lte: endDate }
      }
    });
    if (normalized.length === 0) return;
    await tx.workerUnavailableSlot.createMany({
      data: normalized.map((n) => ({
        workerId,
        localDate: n.date,
        slotIndex: n.slotIndex
      })),
      skipDuplicates: true
    });
  });

  const rows = await prisma.workerUnavailableSlot.findMany({
    where: {
      workerId,
      localDate: { gte: startDate, lte: endDate }
    },
    orderBy: [{ localDate: 'asc' }, { slotIndex: 'asc' }]
  });

  return { slots: rows.map(slotToDto) };
};

const deleteById = async (workerId, id) => {
  const row = await prisma.workerUnavailableSlot.findFirst({
    where: { id, workerId }
  });
  if (!row) {
    throw httpError(404, '利用不可スロットが見つかりません', 'NOT_FOUND');
  }
  await prisma.workerUnavailableSlot.delete({ where: { id: row.id } });
  return { deleted: true, slot: slotToDto(row) };
};

const deleteBySlot = async (workerId, date, slotIndexStr) => {
  const dateStr = firstQueryValue(date);
  const si = firstQueryValue(slotIndexStr);
  if (!dateStr || si === undefined || si === null || si === '') {
    throw httpError(400, 'date と slotIndex クエリは必須です', 'MISSING_QUERY');
  }
  const slotIndex = parseInt(String(si), 10);
  assertYmd(String(dateStr).trim());
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > 47) {
    throw httpError(400, 'slotIndex は 0 以上 47 以下の整数である必要があります', 'INVALID_SLOT_INDEX');
  }

  const row = await prisma.workerUnavailableSlot.findFirst({
    where: { workerId, localDate: String(dateStr).trim(), slotIndex }
  });
  if (!row) {
    throw httpError(404, '利用不可スロットが見つかりません', 'NOT_FOUND');
  }
  await prisma.workerUnavailableSlot.delete({ where: { id: row.id } });
  return { deleted: true, slot: slotToDto(row) };
};

module.exports = {
  listSlots,
  createSlot,
  createBatch,
  syncRange,
  deleteById,
  deleteBySlot,
  parseSlotKey
};

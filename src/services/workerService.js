/**
 * ワーカー管理サービス
 */

const prisma = require('../config/database');

/** service_area_text / availability_text の最大文字数 */
const PROFILE_TEXT_MAX_LEN = 65535;

const TIME_HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const TIME_END = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/;

/**
 * フロントの選択式 UI が保存する JSON（v1）を検証。JSON でない場合は従来の自由記述としてそのまま通す。
 * @param {string} label
 * @param {string} raw
 * @param {'area'|'availability'} kind
 * @returns {string|null}
 */
function validateProfileTextField(label, raw, kind) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (s.length > PROFILE_TEXT_MAX_LEN) {
    throw new Error(`${label}は${PROFILE_TEXT_MAX_LEN}文字以内で入力してください`);
  }
  if (!s.startsWith('{')) {
    return s;
  }
  let o;
  try {
    o = JSON.parse(s);
  } catch {
    throw new Error(`${label}（JSON）の形式が不正です`);
  }
  if (kind === 'area') {
    if (o.v !== 1 || !Array.isArray(o.rows)) {
      throw new Error(`${label}のJSONは { v:1, rows:[] } 形式である必要があります`);
    }
    if (o.rows.length > 50) {
      throw new Error(`${label}は最大50行までです`);
    }
    o.rows.forEach((r, i) => {
      const pref = String(r.pref || '').trim();
      const city = String(r.city || '').trim();
      const ward = String(r.ward || '').trim();
      if (!pref) {
        throw new Error(`${label} ${i + 1}行目: 都道府県（pref）が必要です`);
      }
      if (pref.length > 30 || city.length > 80 || ward.length > 160) {
        throw new Error(`${label} ${i + 1}行目: 文字数が上限を超えています`);
      }
      if (!city && !ward) {
        throw new Error(`${label} ${i + 1}行目: 市区町村（city）または区・町（ward）が必要です`);
      }
    });
    return s;
  }
  if (o.v !== 1 || !Array.isArray(o.days)) {
    throw new Error(`${label}のJSONは { v:1, days:[] } 形式である必要があります`);
  }
  const allowed = new Set(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
  if (o.days.length > 14) {
    throw new Error(`${label}の days が多すぎます`);
  }
  o.days.forEach((d, i) => {
    if (!d || typeof d.key !== 'string' || !allowed.has(d.key)) {
      throw new Error(`${label} ${i + 1}件目: key（mon〜sun）が不正です`);
    }
    if (d.closed != null && typeof d.closed !== 'boolean') {
      throw new Error(`${label} ${i + 1}件目: closed は真偽値である必要があります`);
    }
    if (!d.closed) {
      const st = String(d.start || '').trim();
      const en = String(d.end || '').trim();
      if (!TIME_HHMM.test(st)) {
        throw new Error(`${label}（${d.key}）の開始時刻の形式が不正です（HH:MM）`);
      }
      if (!TIME_END.test(en)) {
        throw new Error(`${label}（${d.key}）の終了時刻の形式が不正です（HH:MM または 24:00）`);
      }
    }
  });
  return s;
}

/**
 * ワーカー一覧を取得（公開）
 * @param {object} filters - フィルター（approvalStatus, keyword, area, minHourlyRate, maxHourlyRate, minRating, page, limit）
 */
const getWorkers = async (filters = {}) => {
  const { 
    approvalStatus, 
    keyword, 
    area, 
    minHourlyRate, 
    maxHourlyRate, 
    minRating,
    page = 1, 
    limit = 20 
  } = filters;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // クエリ条件を構築
  const where = {
    role: 'WORKER',
    status: 'ACTIVE' // アクティブなワーカーのみ
  };

  // 承認ステータスフィルター
  if (approvalStatus) {
    where.approvalStatus = approvalStatus;
  } else {
    // デフォルトでは承認済みのワーカーのみ表示
    where.approvalStatus = 'APPROVED';
  }

  // キーワード検索（名前、自己紹介、対応エリアテキスト）
  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { bio: { contains: keyword, mode: 'insensitive' } },
      { serviceAreaText: { contains: keyword, mode: 'insensitive' } }
    ];
  }

  // エリア検索（住所）
  if (area) {
    where.address = { contains: area, mode: 'insensitive' };
  }

  // 料金範囲フィルター
  if (minHourlyRate !== undefined || maxHourlyRate !== undefined) {
    where.hourlyRate = {};
    if (minHourlyRate !== undefined) {
      where.hourlyRate.gte = parseInt(minHourlyRate);
    }
    if (maxHourlyRate !== undefined) {
      where.hourlyRate.lte = parseInt(maxHourlyRate);
    }
  }

  // 最低評価フィルター
  if (minRating !== undefined) {
    where.rating = { gte: parseFloat(minRating) };
  }

  // ワーカーを取得
  const [workers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        bio: true,
        hourlyRate: true,
        serviceAreaText: true,
        rating: true,
        reviewCount: true,
        approvalStatus: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { rating: 'desc' },
        { reviewCount: 'desc' }
      ],
      skip,
      take: parseInt(limit)
    }),
    prisma.user.count({ where })
  ]);

  return {
    workers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

/**
 * ワーカー詳細を取得（公開）
 * @param {string} workerId - ワーカーID
 */
const getWorkerById = async (workerId) => {
  const worker = await prisma.user.findUnique({
    where: {
      id: workerId,
      role: 'WORKER'
    },
    select: {
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
      updatedAt: true
    }
  });

  if (!worker) {
    throw new Error('ワーカーが見つかりません');
  }

  // レビューを取得（承認済みのワーカーのみ）
  let reviews = [];
  if (worker.approvalStatus === 'APPROVED') {
    reviews = await prisma.review.findMany({
      where: {
        revieweeId: workerId
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true
          }
        },
        booking: {
          select: {
            id: true,
            serviceType: true,
            scheduledDate: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // 最新10件
    });
  }

  return {
    ...worker,
    reviews
  };
};

/**
 * ワーカーのプロフィールを更新
 * @param {string} userId - ユーザーID
 * @param {object} updateData - 更新データ
 */
const updateWorkerProfile = async (userId, updateData) => {
  const {
    bio,
    hourlyRate,
    serviceAreaText,
    availabilityText,
    bankName,
    branchName,
    accountType,
    accountNumber,
    accountName
  } = updateData;

  // ユーザーがワーカーか確認
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, status: true }
  });

  if (!user) {
    throw new Error('ユーザーが見つかりません');
  }

  if (user.role !== 'WORKER') {
    throw new Error('ワーカーのみプロフィールを更新できます');
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('アクティブなワーカーのみプロフィールを更新できます');
  }

  const updateFields = {};

  if (bio !== undefined) {
    updateFields.bio = bio || null;
  }

  if (hourlyRate !== undefined) {
    if (hourlyRate !== null && (isNaN(hourlyRate) || hourlyRate < 0)) {
      throw new Error('時給は0以上の数値である必要があります');
    }
    updateFields.hourlyRate = hourlyRate || null;
  }

  if (serviceAreaText !== undefined) {
    updateFields.serviceAreaText =
      serviceAreaText === null || String(serviceAreaText).trim() === ''
        ? null
        : validateProfileTextField('対応エリア', serviceAreaText, 'area');
  }

  if (availabilityText !== undefined) {
    updateFields.availabilityText =
      availabilityText === null || String(availabilityText).trim() === ''
        ? null
        : validateProfileTextField('利用可能時間', availabilityText, 'availability');
  }

  if (bankName !== undefined) {
    updateFields.bankName = bankName ? String(bankName).trim() || null : null;
  }
  if (branchName !== undefined) {
    updateFields.branchName = branchName ? String(branchName).trim() || null : null;
  }
  if (accountType !== undefined) {
    const t = accountType ? String(accountType).trim() : '';
    if (t && !['ordinary', 'checking', '普通', '当座'].includes(t)) {
      throw new Error('口座種別が不正です');
    }
    const normalized =
      t === '普通' ? 'ordinary' : t === '当座' ? 'checking' : t || null;
    updateFields.accountType = normalized;
  }
  if (accountNumber !== undefined) {
    const n = accountNumber ? String(accountNumber).replace(/\s/g, '') : '';
    if (n && !/^\d{1,16}$/.test(n)) {
      throw new Error('口座番号は数字のみで入力してください');
    }
    updateFields.accountNumber = n || null;
  }
  if (accountName !== undefined) {
    updateFields.accountName = accountName ? String(accountName).trim() || null : null;
  }

  const updatedWorker = await prisma.user.update({
    where: { id: userId },
    data: updateFields,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      address: true,
      bio: true,
      hourlyRate: true,
      serviceAreaText: true,
      availabilityText: true,
      bankName: true,
      branchName: true,
      accountType: true,
      accountNumber: true,
      accountName: true,
      rating: true,
      reviewCount: true,
      approvalStatus: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return updatedWorker;
};

/**
 * ワーカーを検索（高度なフィルタリング）
 * @param {object} filters - フィルター（複数条件の組み合わせ）
 */
const searchWorkers = async (filters = {}) => {
  return await getWorkers(filters);
};

module.exports = {
  getWorkers,
  getWorkerById,
  updateWorkerProfile,
  searchWorkers
};

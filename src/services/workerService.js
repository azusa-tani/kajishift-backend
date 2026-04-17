/**
 * ワーカー管理サービス
 */

const prisma = require('../config/database');

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

  // キーワード検索（名前、自己紹介）
  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { bio: { contains: keyword, mode: 'insensitive' } }
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
    updateFields.serviceAreaText = serviceAreaText ? String(serviceAreaText).trim() || null : null;
  }

  if (availabilityText !== undefined) {
    updateFields.availabilityText = availabilityText ? String(availabilityText).trim() || null : null;
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

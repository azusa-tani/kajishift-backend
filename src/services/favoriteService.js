/**
 * お気に入り管理サービス
 */

const prisma = require('../config/database');

/**
 * お気に入り一覧を取得
 * @param {string} userId - ユーザーID
 * @param {object} filters - フィルター（page, limit）
 */
const getFavorites = async (userId, filters = {}) => {
  const { page = 1, limit = 20 } = filters;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
      where: {
        userId
      },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            hourlyRate: true,
            rating: true,
            reviewCount: true,
            approvalStatus: true,
            status: true,
            address: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.favorite.count({
      where: { userId }
    })
  ]);

  return {
    favorites,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

/**
 * お気に入りを追加
 * @param {string} userId - ユーザーID（依頼者）
 * @param {string} workerId - ワーカーID
 */
const addFavorite = async (userId, workerId) => {
  // ワーカーが存在し、承認されているか確認
  const worker = await prisma.user.findUnique({
    where: {
      id: workerId,
      role: 'WORKER'
    }
  });

  if (!worker) {
    throw new Error('ワーカーが見つかりません');
  }

  if (worker.approvalStatus !== 'APPROVED') {
    throw new Error('承認されていないワーカーをお気に入りに追加できません');
  }

  if (worker.status !== 'ACTIVE') {
    throw new Error('アクティブでないワーカーをお気に入りに追加できません');
  }

  // 既にお気に入りに追加されているか確認
  const existingFavorite = await prisma.favorite.findUnique({
    where: {
      userId_workerId: {
        userId,
        workerId
      }
    }
  });

  if (existingFavorite) {
    throw new Error('既にお気に入りに追加されています');
  }

  // お気に入りを追加
  const favorite = await prisma.favorite.create({
    data: {
      userId,
      workerId
    },
    include: {
      worker: {
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          hourlyRate: true,
          rating: true,
          reviewCount: true,
          approvalStatus: true,
          status: true,
          address: true
        }
      }
    }
  });

  return favorite;
};

/**
 * お気に入りを削除
 * @param {string} favoriteId - お気に入りID
 * @param {string} userId - ユーザーID（権限チェック用）
 */
const removeFavorite = async (favoriteId, userId) => {
  // お気に入りの存在確認と権限チェック
  const favorite = await prisma.favorite.findUnique({
    where: { id: favoriteId }
  });

  if (!favorite) {
    throw new Error('お気に入りが見つかりません');
  }

  if (favorite.userId !== userId) {
    throw new Error('このお気に入りを削除する権限がありません');
  }

  // お気に入りを削除
  await prisma.favorite.delete({
    where: { id: favoriteId }
  });

  return { message: 'お気に入りを削除しました' };
};

/**
 * ワーカーIDでお気に入りを削除
 * @param {string} userId - ユーザーID
 * @param {string} workerId - ワーカーID
 */
const removeFavoriteByWorkerId = async (userId, workerId) => {
  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_workerId: {
        userId,
        workerId
      }
    }
  });

  if (!favorite) {
    throw new Error('お気に入りが見つかりません');
  }

  await prisma.favorite.delete({
    where: { id: favorite.id }
  });

  return { message: 'お気に入りを削除しました' };
};

/**
 * お気に入りかどうかを確認
 * @param {string} userId - ユーザーID
 * @param {string} workerId - ワーカーID
 */
const isFavorite = async (userId, workerId) => {
  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_workerId: {
        userId,
        workerId
      }
    }
  });

  return !!favorite;
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  removeFavoriteByWorkerId,
  isFavorite
};

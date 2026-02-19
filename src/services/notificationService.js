/**
 * 通知管理サービス
 */

const prisma = require('../config/database');
const socketService = require('../config/socket');

/**
 * 通知一覧を取得
 * @param {string} userId - ユーザーID
 * @param {object} filters - フィルター（isRead, type, page, limit）
 */
const getNotifications = async (userId, filters = {}) => {
  const { isRead, type, page = 1, limit = 20 } = filters;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // クエリ条件を構築
  const where = {
    userId
  };

  // 既読/未読フィルター
  if (isRead !== undefined) {
    where.isRead = isRead === 'true' || isRead === true;
  }

  // タイプフィルター
  if (type) {
    where.type = type;
  }

  // 通知を取得
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.notification.count({ where })
  ]);

  return {
    notifications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

/**
 * 通知を作成
 * @param {string} userId - ユーザーID
 * @param {string} type - 通知タイプ
 * @param {string} title - 通知タイトル
 * @param {string} content - 通知内容
 * @param {string} relatedId - 関連するエンティティのID（オプション）
 * @param {string} relatedType - 関連するエンティティのタイプ（オプション）
 */
const createNotification = async (userId, type, title, content, relatedId = null, relatedType = null) => {
  // 必須フィールドのチェック
  if (!userId || !type || !title || !content) {
    throw new Error('ユーザーID、通知タイプ、タイトル、内容は必須です');
  }

  // 通知タイプのバリデーション
  const validTypes = [
    'MESSAGE',
    'BOOKING_UPDATE',
    'BOOKING_CREATED',
    'BOOKING_CANCELLED',
    'REVIEW',
    'PAYMENT',
    'PAYMENT_FAILED',
    'SYSTEM',
    'WORKER_APPROVED',
    'WORKER_REJECTED'
  ];
  if (!validTypes.includes(type)) {
    throw new Error('無効な通知タイプです');
  }

  // 通知を作成
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      content,
      relatedId: relatedId || null,
      relatedType: relatedType || null
    }
  });

  // リアルタイム通知を送信
  try {
    socketService.sendNotificationToUser(userId, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      isRead: notification.isRead,
      relatedId: notification.relatedId,
      relatedType: notification.relatedType,
      createdAt: notification.createdAt
    });
  } catch (error) {
    // Socket.ioエラーは無視（通知作成は成功）
    console.error('リアルタイム通知送信エラー:', error);
  }

  return notification;
};

/**
 * 通知を既読にする
 * @param {string} notificationId - 通知ID
 * @param {string} userId - ユーザーID
 */
const markAsRead = async (notificationId, userId) => {
  // 通知の存在確認と権限チェック
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId }
  });

  if (!notification) {
    throw new Error('通知が見つかりません');
  }

  // 権限チェック：自分の通知のみ既読にできる
  if (notification.userId !== userId) {
    throw new Error('この通知にアクセスする権限がありません');
  }

  // 既に既読の場合はそのまま返す
  if (notification.isRead) {
    return notification;
  }

  // 通知を既読にする
  const updatedNotification = await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true
    }
  });

  // 未読通知数を更新
  try {
    socketService.sendUnreadCount(userId);
  } catch (error) {
    console.error('未読通知数更新エラー:', error);
  }

  return updatedNotification;
};

/**
 * すべての通知を既読にする
 * @param {string} userId - ユーザーID
 */
const markAllAsRead = async (userId) => {
  // 未読の通知をすべて既読にする
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true
    }
  });

  // 未読通知数を更新
  try {
    socketService.sendUnreadCount(userId);
  } catch (error) {
    console.error('未読通知数更新エラー:', error);
  }

  return {
    count: result.count
  };
};

/**
 * 通知を削除
 * @param {string} notificationId - 通知ID
 * @param {string} userId - ユーザーID
 */
const deleteNotification = async (notificationId, userId) => {
  // 通知の存在確認と権限チェック
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId }
  });

  if (!notification) {
    throw new Error('通知が見つかりません');
  }

  // 権限チェック：自分の通知のみ削除できる
  if (notification.userId !== userId) {
    throw new Error('この通知を削除する権限がありません');
  }

  // 通知を削除
  await prisma.notification.delete({
    where: { id: notificationId }
  });

  return { message: '通知を削除しました' };
};

/**
 * 未読通知数を取得
 * @param {string} userId - ユーザーID
 */
const getUnreadCount = async (userId) => {
  const count = await prisma.notification.count({
    where: {
      userId,
      isRead: false
    }
  });

  return { count };
};

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};

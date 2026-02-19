/**
 * メッセージ管理サービス
 */

const prisma = require('../config/database');
const bookingService = require('./bookingService');
const notificationService = require('./notificationService');
const socketService = require('../config/socket');

/**
 * 予約に関連するメッセージ一覧を取得
 * @param {string} bookingId - 予約ID
 * @param {string} userId - ユーザーID
 * @param {string} userRole - ユーザーロール
 * @param {object} filters - フィルター（page, limit）
 */
const getMessagesByBookingId = async (bookingId, userId, userRole, filters = {}) => {
  const { page = 1, limit = 50 } = filters;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // 予約の存在確認と権限チェック
  const booking = await bookingService.getBookingById(bookingId, userId, userRole);

  // メッセージを取得
  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: {
        bookingId: bookingId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.message.count({
      where: {
        bookingId: bookingId
      }
    })
  ]);

  return {
    messages,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

/**
 * メッセージを送信
 * @param {string} bookingId - 予約ID
 * @param {string} senderId - 送信者ID
 * @param {string} content - メッセージ内容
 */
const sendMessage = async (bookingId, senderId, content) => {
  // 必須フィールドのチェック
  if (!content || content.trim().length === 0) {
    throw new Error('メッセージ内容は必須です');
  }

  if (content.length > 1000) {
    throw new Error('メッセージは1000文字以内で入力してください');
  }

  // 予約の存在確認
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      worker: true
    }
  });

  if (!booking) {
    throw new Error('予約が見つかりません');
  }

  // 送信者の権限チェック：予約に関連する顧客またはワーカーのみ送信可能
  if (booking.customerId !== senderId && booking.workerId !== senderId) {
    throw new Error('この予約に関連するメッセージを送信する権限がありません');
  }

  // 受信者を決定（送信者が顧客ならワーカー、ワーカーなら顧客）
  let receiverId;
  if (booking.customerId === senderId) {
    if (!booking.workerId) {
      throw new Error('ワーカーが選択されていない予約にはメッセージを送信できません');
    }
    receiverId = booking.workerId;
  } else {
    receiverId = booking.customerId;
  }

  // メッセージを作成
  const message = await prisma.message.create({
    data: {
      bookingId,
      senderId,
      receiverId,
      content: content.trim()
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      receiver: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  // 通知を生成
  try {
    await notificationService.createNotification(
      receiverId,
      'MESSAGE',
      '新しいメッセージが届きました',
      `${message.sender.name}さんからメッセージが届きました: ${content.trim().substring(0, 50)}${content.trim().length > 50 ? '...' : ''}`,
      message.id,
      'MESSAGE'
    );
  } catch (error) {
    // 通知生成エラーは無視（メッセージ送信は成功）
    console.error('通知生成エラー:', error);
  }

  // リアルタイムメッセージを送信
  try {
    socketService.sendMessage(receiverId, {
      id: message.id,
      bookingId: message.bookingId,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      isRead: message.isRead,
      sender: message.sender,
      receiver: message.receiver,
      createdAt: message.createdAt
    });
  } catch (error) {
    // Socket.ioエラーは無視（メッセージ送信は成功）
    console.error('リアルタイムメッセージ送信エラー:', error);
  }

  return message;
};

module.exports = {
  getMessagesByBookingId,
  sendMessage
};

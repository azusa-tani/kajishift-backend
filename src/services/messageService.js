/**
 * メッセージ管理サービス
 */

const prisma = require('../config/database');
const bookingService = require('./bookingService');
const notificationService = require('./notificationService');
const socketService = require('../config/socket');

const createHttpError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const normalizeFileType = (fileType) => {
  if (fileType === undefined || fileType === null || fileType === '') return 'text';
  const normalized = String(fileType).trim().toLowerCase();
  if (normalized === 'text' || normalized === 'image') return normalized;
  throw createHttpError('fileType は text または image を指定してください', 400);
};

const isImageContent = (content) => {
  if (!content || typeof content !== 'string') return false;
  const value = content.trim();
  return (
    /^https?:\/\/\S+\.(png|jpe?g|gif|webp|bmp|svg)(\?\S*)?$/i.test(value) ||
    /^\/uploads\/\S+\.(png|jpe?g|gif|webp|bmp|svg)(\?\S*)?$/i.test(value)
  );
};

const serializeMessage = (message) => {
  if (!message) return message;
  const fileType = isImageContent(message.content) ? 'image' : 'text';
  return {
    ...message,
    fileType,
    ...(fileType === 'image' ? { imageUrl: message.content } : {}),
  };
};

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
    messages: messages.map(serializeMessage),
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
 * @param {string|object} payload - メッセージ内容、または { content, fileType }
 */
const sendMessage = async (bookingId, senderId, payload) => {
  const content = typeof payload === 'object' && payload !== null ? payload.content : payload;
  const fileType = normalizeFileType(typeof payload === 'object' && payload !== null ? payload.fileType : undefined);

  // 必須フィールドのチェック
  if (!content || String(content).trim().length === 0) {
    throw new Error('メッセージ内容は必須です');
  }

  const trimmedContent = String(content).trim();

  if (trimmedContent.length > 1000) {
    throw new Error('メッセージは1000文字以内で入力してください');
  }

  if (fileType === 'image' && !isImageContent(trimmedContent)) {
    throw createHttpError('画像メッセージのcontentにはアップロード済み画像URLを指定してください', 400);
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
    throw createHttpError('予約が見つかりません', 404);
  }

  // 送信者の権限チェック：予約に関連する顧客またはワーカーのみ送信可能
  if (booking.customerId !== senderId && booking.workerId !== senderId) {
    throw createHttpError('この予約に関連するメッセージを送信する権限がありません', 403);
  }

  // 受信者を決定（送信者が顧客ならワーカー、ワーカーなら顧客）
  let receiverId;
  if (booking.customerId === senderId) {
    if (!booking.workerId) {
      throw createHttpError('ワーカーが選択されていない予約にはメッセージを送信できません', 409);
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
      content: trimmedContent
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
      `${message.sender.name}さんからメッセージが届きました: ${fileType === 'image' ? '画像' : `${trimmedContent.substring(0, 50)}${trimmedContent.length > 50 ? '...' : ''}`}`,
      message.id,
      'MESSAGE'
    );
  } catch (error) {
    // 通知生成エラーは無視（メッセージ送信は成功）
    console.error('通知生成エラー:', error);
  }

  // リアルタイムメッセージを送信
  try {
    const socketMessage = serializeMessage(message);
    socketService.sendMessage(receiverId, {
      id: socketMessage.id,
      bookingId: socketMessage.bookingId,
      senderId: socketMessage.senderId,
      receiverId: socketMessage.receiverId,
      content: socketMessage.content,
      fileType: socketMessage.fileType,
      imageUrl: socketMessage.imageUrl,
      isRead: socketMessage.isRead,
      sender: socketMessage.sender,
      receiver: socketMessage.receiver,
      createdAt: socketMessage.createdAt
    });
  } catch (error) {
    // Socket.ioエラーは無視（メッセージ送信は成功）
    console.error('リアルタイムメッセージ送信エラー:', error);
  }

  return serializeMessage(message);
};

module.exports = {
  getMessagesByBookingId,
  sendMessage,
  _messageAttachmentHelpers: {
    normalizeFileType,
    isImageContent,
    serializeMessage,
  },
};

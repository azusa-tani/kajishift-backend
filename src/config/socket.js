/**
 * Socket.io設定とリアルタイム通知管理
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('./database');
const logger = require('./logger');

let io = null;

/**
 * Socket.ioサーバーを初期化
 * @param {object} httpServer - HTTPサーバーインスタンス
 */
const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5500',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // 認証ミドルウェア
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('認証トークンが必要です'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // ユーザーが存在するか確認
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, status: true }
      });

      if (!user) {
        return next(new Error('ユーザーが見つかりません'));
      }

      if (user.status !== 'ACTIVE') {
        return next(new Error('アクティブなユーザーのみ接続できます'));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      next();
    } catch (error) {
      logger.error('Socket認証エラー:', error);
      next(new Error('認証に失敗しました'));
    }
  });

  // 接続時の処理
  io.on('connection', (socket) => {
    const userId = socket.userId;
    logger.info(`Socket接続: ユーザーID ${userId}`);

    // ユーザー専用ルームに参加
    socket.join(`user:${userId}`);

    // 接続確認
    socket.emit('connected', {
      message: '接続が確立されました',
      userId
    });

    // 未読通知数を送信
    sendUnreadCount(userId);

    // 切断時の処理
    socket.on('disconnect', (reason) => {
      logger.info(`Socket切断: ユーザーID ${userId}, 理由: ${reason}`);
    });

    // エラーハンドリング
    socket.on('error', (error) => {
      logger.error(`Socketエラー (ユーザーID ${userId}):`, error);
    });
  });

  logger.info('✅ Socket.ioサーバーが初期化されました');
  return io;
};

/**
 * 特定のユーザーに通知を送信
 * @param {string} userId - ユーザーID
 * @param {object} notification - 通知データ
 */
const sendNotificationToUser = (userId, notification) => {
  if (!io) {
    logger.warn('Socket.ioサーバーが初期化されていません');
    return;
  }

  io.to(`user:${userId}`).emit('notification', {
    type: 'notification',
    data: notification
  });

  // 未読通知数も更新
  sendUnreadCount(userId);
};

/**
 * 複数のユーザーに通知を送信
 * @param {Array<string>} userIds - ユーザーIDの配列
 * @param {object} notification - 通知データ
 */
const sendNotificationToUsers = (userIds, notification) => {
  if (!io) {
    logger.warn('Socket.ioサーバーが初期化されていません');
    return;
  }

  userIds.forEach(userId => {
    sendNotificationToUser(userId, notification);
  });
};

/**
 * 特定のロールの全ユーザーに通知を送信
 * @param {string} role - ロール（CUSTOMER, WORKER, ADMIN）
 * @param {object} notification - 通知データ
 */
const sendNotificationToRole = async (role, notification) => {
  if (!io) {
    logger.warn('Socket.ioサーバーが初期化されていません');
    return;
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        role,
        status: 'ACTIVE'
      },
      select: { id: true }
    });

    users.forEach(user => {
      sendNotificationToUser(user.id, notification);
    });
  } catch (error) {
    logger.error('ロール別通知送信エラー:', error);
  }
};

/**
 * 未読通知数を送信
 * @param {string} userId - ユーザーID
 */
const sendUnreadCount = async (userId) => {
  if (!io) {
    return;
  }

  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });

    io.to(`user:${userId}`).emit('unread-count', {
      type: 'unread-count',
      count
    });
  } catch (error) {
    logger.error('未読通知数取得エラー:', error);
  }
};

/**
 * メッセージをリアルタイムで送信
 * @param {string} receiverId - 受信者ID
 * @param {object} message - メッセージデータ
 */
const sendMessage = (receiverId, message) => {
  if (!io) {
    logger.warn('Socket.ioサーバーが初期化されていません');
    return;
  }

  io.to(`user:${receiverId}`).emit('message', {
    type: 'message',
    data: message
  });

  // 通知も送信
  sendNotificationToUser(receiverId, {
    type: 'MESSAGE',
    title: '新しいメッセージ',
    content: message.content,
    relatedId: message.id,
    relatedType: 'MESSAGE'
  });
};

/**
 * 接続中のユーザー数を取得
 */
const getConnectedUsersCount = () => {
  if (!io) {
    return 0;
  }
  return io.sockets.sockets.size;
};

/**
 * Socket.ioインスタンスを取得
 */
const getIO = () => {
  return io;
};

module.exports = {
  initializeSocket,
  sendNotificationToUser,
  sendNotificationToUsers,
  sendNotificationToRole,
  sendUnreadCount,
  sendMessage,
  getConnectedUsersCount,
  getIO
};

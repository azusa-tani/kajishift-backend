/**
 * メッセージ管理コントローラー
 */

const messageService = require('../services/messageService');

/**
 * 予約に関連するメッセージ一覧を取得
 * GET /api/messages/:bookingId
 */
const getMessages = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const filters = {
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await messageService.getMessagesByBookingId(bookingId, userId, userRole, filters);

    res.json({
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * メッセージを送信
 * POST /api/messages
 */
const sendMessage = async (req, res, next) => {
  try {
    const { bookingId, content } = req.body;
    const senderId = req.user.id;

    if (!bookingId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '予約IDは必須です'
      });
    }

    const message = await messageService.sendMessage(bookingId, senderId, content);

    res.status(201).json({
      message: 'メッセージを送信しました',
      data: message
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  sendMessage
};

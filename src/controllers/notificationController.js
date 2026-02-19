/**
 * 通知管理コントローラー
 */

const notificationService = require('../services/notificationService');

/**
 * 通知一覧を取得
 * GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const filters = {
      isRead: req.query.isRead,
      type: req.query.type,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await notificationService.getNotifications(userId, filters);

    res.json({
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 通知を既読にする
 * PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await notificationService.markAsRead(id, userId);

    res.json({
      message: '通知を既読にしました',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * すべての通知を既読にする
 * PUT /api/notifications/read-all
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await notificationService.markAllAsRead(userId);

    res.json({
      message: `${result.count}件の通知を既読にしました`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 通知を削除
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await notificationService.deleteNotification(id, userId);

    res.json({
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 未読通知数を取得
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await notificationService.getUnreadCount(userId);

    res.json({
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};

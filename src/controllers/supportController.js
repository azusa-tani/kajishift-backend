/**
 * サポート管理コントローラー
 */

const supportService = require('../services/supportService');

/**
 * 問い合わせ一覧を取得
 * GET /api/support
 */
const getSupportTickets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const filters = {
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await supportService.getSupportTickets(userId, userRole, filters);

    res.json({
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 問い合わせを作成
 * POST /api/support
 */
const createSupportTicket = async (req, res, next) => {
  try {
    const { subject, content } = req.body;
    const userId = req.user.id;

    if (!subject) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '件名は必須です'
      });
    }

    if (!content) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '内容は必須です'
      });
    }

    const ticket = await supportService.createSupportTicket(userId, subject, content);

    res.status(201).json({
      message: '問い合わせを作成しました',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 問い合わせ詳細を取得
 * GET /api/support/:id
 */
const getSupportTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const ticket = await supportService.getSupportTicketById(id, userId, userRole);

    res.json({
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * サポートチケットを更新（管理者のみ）
 * PUT /api/admin/support/:id
 */
const updateSupportTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const updateData = req.body;

    const ticket = await supportService.updateSupportTicket(id, adminId, updateData);

    res.json({
      message: '問い合わせを更新しました',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * サポートチケットを削除（管理者のみ）
 * DELETE /api/admin/support/:id
 */
const deleteSupportTicket = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await supportService.deleteSupportTicket(id);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSupportTickets,
  createSupportTicket,
  getSupportTicketById,
  updateSupportTicket,
  deleteSupportTicket
};

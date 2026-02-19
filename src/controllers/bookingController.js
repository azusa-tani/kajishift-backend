/**
 * 予約管理コントローラー
 */

const bookingService = require('../services/bookingService');

/**
 * 予約一覧を取得
 * GET /api/bookings
 */
const getBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const filters = {
      status: req.query.status,
      serviceType: req.query.serviceType,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      available: req.query.available, // ワーカー未割り当ての予約を取得
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await bookingService.getBookings(userId, userRole, filters);

    res.json({
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 予約詳細を取得
 * GET /api/bookings/:id
 */
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const booking = await bookingService.getBookingById(id, userId, userRole);

    res.json({
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 予約を作成
 * POST /api/bookings
 */
const createBooking = async (req, res, next) => {
  try {
    // 顧客のみ予約を作成可能
    if (req.user.role !== 'CUSTOMER') {
      return res.status(403).json({
        error: 'Forbidden',
        message: '予約を作成できるのは顧客のみです'
      });
    }

    const customerId = req.user.id;
    const bookingData = req.body;

    const booking = await bookingService.createBooking(customerId, bookingData);

    res.status(201).json({
      message: '予約が作成されました',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 予約を更新
 * PUT /api/bookings/:id
 */
const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const updateData = req.body;

    const booking = await bookingService.updateBooking(id, userId, userRole, updateData);

    res.json({
      message: '予約を更新しました',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 予約をキャンセル
 * DELETE /api/bookings/:id
 */
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const booking = await bookingService.cancelBooking(id, userId, userRole);

    res.json({
      message: '予約をキャンセルしました',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 予約を承諾（ワーカーのみ）
 * POST /api/bookings/:id/accept
 */
const acceptBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await bookingService.acceptBooking(id, userId);

    res.json({
      message: '予約を承諾しました',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 予約を拒否（ワーカーのみ）
 * POST /api/bookings/:id/reject
 */
const rejectBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    const booking = await bookingService.rejectBooking(id, userId, reason);

    res.json({
      message: '予約を拒否しました',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 作業完了（ワーカーのみ）
 * POST /api/bookings/:id/complete
 */
const completeBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await bookingService.completeBooking(id, userId);

    res.json({
      message: '作業を完了しました',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
  acceptBooking,
  rejectBooking,
  completeBooking
};

/**
 * 管理者コントローラー
 */

const adminService = require('../services/adminService');
const exportService = require('../services/exportService');

/**
 * ユーザー一覧を取得（管理者のみ）
 * GET /api/admin/users
 */
const getUsers = async (req, res, next) => {
  try {
    const filters = {
      role: req.query.role,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await adminService.getUsers(filters);

    res.json({
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ワーカー一覧を取得（管理者のみ）
 * GET /api/admin/workers
 */
const getWorkers = async (req, res, next) => {
  try {
    const filters = {
      approvalStatus: req.query.approvalStatus,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await adminService.getWorkers(filters);

    res.json({
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ワーカーを承認（管理者のみ）
 * PUT /api/admin/workers/:id/approve
 */
const approveWorker = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approvalStatus } = req.body;
    const adminId = req.user.id;

    if (!approvalStatus) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '承認ステータスは必須です'
      });
    }

    const worker = await adminService.approveWorker(id, adminId, approvalStatus);

    res.json({
      message: approvalStatus === 'APPROVED' ? 'ワーカーを承認しました' : 'ワーカーを却下しました',
      data: worker
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 予約レポートを取得（管理者のみ）
 * GET /api/admin/reports/bookings
 */
const getBookingReport = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await adminService.getBookingReport(filters);

    res.json({
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 売上レポートを取得（管理者のみ）
 * GET /api/admin/reports/revenue
 */
const getRevenueReport = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await adminService.getRevenueReport(filters);

    res.json({
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ユーザー統計レポートを取得（管理者のみ）
 * GET /api/admin/reports/users
 */
const getUserReport = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await adminService.getUserReport(filters);

    res.json({
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ワーカー統計レポートを取得（管理者のみ）
 * GET /api/admin/reports/workers
 */
const getWorkerReport = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await adminService.getWorkerReport(filters);

    res.json({
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 予約レポートをCSV形式でエクスポート（管理者のみ）
 * GET /api/admin/reports/bookings/export/csv
 */
const exportBookingReportCSV = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const buffer = await exportService.exportBookingReportCSV(filters);
    const filename = `booking-report-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * 予約レポートをExcel形式でエクスポート（管理者のみ）
 * GET /api/admin/reports/bookings/export/excel
 */
const exportBookingReportExcel = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const buffer = await exportService.exportBookingReportExcel(filters);
    const filename = `booking-report-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * 売上レポートをCSV形式でエクスポート（管理者のみ）
 * GET /api/admin/reports/revenue/export/csv
 */
const exportRevenueReportCSV = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const buffer = await exportService.exportRevenueReportCSV(filters);
    const filename = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * 売上レポートをExcel形式でエクスポート（管理者のみ）
 * GET /api/admin/reports/revenue/export/excel
 */
const exportRevenueReportExcel = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const buffer = await exportService.exportRevenueReportExcel(filters);
    const filename = `revenue-report-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * ユーザー統計レポートをCSV形式でエクスポート（管理者のみ）
 * GET /api/admin/reports/users/export/csv
 */
const exportUserReportCSV = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const buffer = await exportService.exportUserReportCSV(filters);
    const filename = `user-report-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * ユーザー統計レポートをExcel形式でエクスポート（管理者のみ）
 * GET /api/admin/reports/users/export/excel
 */
const exportUserReportExcel = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const buffer = await exportService.exportUserReportExcel(filters);
    const filename = `user-report-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * ワーカー統計レポートをCSV形式でエクスポート（管理者のみ）
 * GET /api/admin/reports/workers/export/csv
 */
const exportWorkerReportCSV = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const buffer = await exportService.exportWorkerReportCSV(filters);
    const filename = `worker-report-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * ワーカー統計レポートをExcel形式でエクスポート（管理者のみ）
 * GET /api/admin/reports/workers/export/excel
 */
const exportWorkerReportExcel = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const buffer = await exportService.exportWorkerReportExcel(filters);
    const filename = `worker-report-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * システム通知を作成・送信（管理者のみ）
 * POST /api/admin/notifications/system
 */
const createSystemNotification = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const { title, content, targetRole, targetUserIds, priority, sendEmail } = req.body;

    // 必須フィールドのチェック
    if (!title || !content) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'タイトルと内容は必須です'
      });
    }

    const result = await adminService.createSystemNotification(adminId, {
      title,
      content,
      targetRole: targetRole || null,
      targetUserIds: targetUserIds || null,
      priority: priority || 'normal',
      sendEmail: sendEmail !== false // デフォルトはtrue
    });

    res.json({
      message: result.message,
      data: {
        sentCount: result.sentCount,
        totalUsers: result.totalUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * グラフ用データを取得（管理者のみ）
 * GET /api/admin/reports/chart/:reportType
 */
const getChartData = async (req, res, next) => {
  try {
    const { reportType } = req.params;
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      groupBy: req.query.groupBy || 'day'
    };

    const result = await adminService.getChartData(reportType, filters);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 比較レポートを取得（管理者のみ）
 * GET /api/admin/reports/comparison/:reportType
 */
const getComparisonReport = async (req, res, next) => {
  try {
    const { reportType } = req.params;
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      compareType: req.query.compareType || 'month'
    };

    const result = await adminService.getComparisonReport(reportType, filters);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * カスタムレポートを取得（管理者のみ）
 * POST /api/admin/reports/custom
 */
const getCustomReport = async (req, res, next) => {
  try {
    const filters = {
      reportTypes: req.body.reportTypes,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      groupBy: req.body.groupBy || 'day',
      metrics: req.body.metrics || []
    };

    const result = await adminService.getCustomReport(filters);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * ユーザー情報を更新（管理者のみ）
 * PUT /api/admin/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const user = await adminService.updateUser(id, updateData);

    res.json({
      message: 'ユーザー情報を更新しました',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ユーザーを削除（管理者のみ）
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await adminService.deleteUser(id);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * ワーカー情報を更新（管理者のみ）
 * PUT /api/admin/workers/:id
 */
const updateWorker = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const worker = await adminService.updateWorker(id, updateData);

    res.json({
      message: 'ワーカー情報を更新しました',
      data: worker
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ワーカーを削除（管理者のみ）
 * DELETE /api/admin/workers/:id
 */
const deleteWorker = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await adminService.deleteWorker(id);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * システム設定を取得（管理者のみ）
 * GET /api/admin/settings
 */
const getSystemSettings = async (req, res, next) => {
  try {
    const category = req.query.category || null;
    const settings = await adminService.getSystemSettings(category);

    res.json({
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * システム設定を更新（管理者のみ）
 * PUT /api/admin/settings
 */
const updateSystemSettings = async (req, res, next) => {
  try {
    const settings = req.body;
    const updatedSettings = await adminService.updateSystemSettings(settings);

    res.json({
      message: 'システム設定を更新しました',
      data: updatedSettings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * サービスメニュー一覧を取得（管理者のみ）
 * GET /api/admin/services
 */
const getServiceMenus = async (req, res, next) => {
  try {
    const services = await adminService.getServiceMenus();

    res.json({
      data: services
    });
  } catch (error) {
    next(error);
  }
};

/**
 * サービスメニューを作成（管理者のみ）
 * POST /api/admin/services
 */
const createServiceMenu = async (req, res, next) => {
  try {
    const service = await adminService.createServiceMenu(req.body);

    res.status(201).json({
      message: 'サービスメニューを作成しました',
      data: service
    });
  } catch (error) {
    next(error);
  }
};

/**
 * サービスメニューを更新（管理者のみ）
 * PUT /api/admin/services/:id
 */
const updateServiceMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await adminService.updateServiceMenu(id, req.body);

    res.json({
      message: 'サービスメニューを更新しました',
      data: service
    });
  } catch (error) {
    next(error);
  }
};

/**
 * サービスメニューを削除（管理者のみ）
 * DELETE /api/admin/services/:id
 */
const deleteServiceMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await adminService.deleteServiceMenu(id);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * 対応エリア一覧を取得（管理者のみ）
 * GET /api/admin/areas
 */
const getAreas = async (req, res, next) => {
  try {
    const areas = await adminService.getAreas();

    res.json({
      data: areas
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 対応エリアを作成（管理者のみ）
 * POST /api/admin/areas
 */
const createArea = async (req, res, next) => {
  try {
    const area = await adminService.createArea(req.body);

    res.status(201).json({
      message: '対応エリアを作成しました',
      data: area
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 対応エリアを更新（管理者のみ）
 * PUT /api/admin/areas/:id
 */
const updateArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const area = await adminService.updateArea(id, req.body);

    res.json({
      message: '対応エリアを更新しました',
      data: area
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 対応エリアを削除（管理者のみ）
 * DELETE /api/admin/areas/:id
 */
const deleteArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await adminService.deleteArea(id);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getWorkers,
  approveWorker,
  updateUser,
  deleteUser,
  updateWorker,
  deleteWorker,
  getBookingReport,
  getRevenueReport,
  getUserReport,
  getWorkerReport,
  exportBookingReportCSV,
  exportBookingReportExcel,
  exportRevenueReportCSV,
  exportRevenueReportExcel,
  exportUserReportCSV,
  exportUserReportExcel,
  exportWorkerReportCSV,
  exportWorkerReportExcel,
  createSystemNotification,
  getChartData,
  getComparisonReport,
  getCustomReport,
  getSystemSettings,
  updateSystemSettings,
  getServiceMenus,
  createServiceMenu,
  updateServiceMenu,
  deleteServiceMenu,
  getAreas,
  createArea,
  updateArea,
  deleteArea
};

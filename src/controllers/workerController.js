/**
 * ワーカー管理コントローラー
 */

const workerService = require('../services/workerService');

/**
 * ワーカー一覧を取得（公開）
 * GET /api/workers
 */
const getWorkers = async (req, res, next) => {
  try {
    const filters = {
      approvalStatus: req.query.status || req.query.approvalStatus,
      keyword: req.query.keyword,
      area: req.query.area,
      minHourlyRate: req.query.minHourlyRate,
      maxHourlyRate: req.query.maxHourlyRate,
      minRating: req.query.minRating,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await workerService.getWorkers(filters);

    res.json({
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ワーカー詳細を取得（公開）
 * GET /api/workers/:id
 */
const getWorkerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const worker = await workerService.getWorkerById(id);

    res.json({
      data: worker
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ワーカーのプロフィールを更新（認証必須）
 * PUT /api/workers/me
 */
const updateWorkerProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    const worker = await workerService.updateWorkerProfile(userId, updateData);

    res.json({
      message: 'ワーカープロフィールを更新しました',
      data: worker
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkers,
  getWorkerById,
  updateWorkerProfile
};

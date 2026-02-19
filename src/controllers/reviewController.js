/**
 * レビュー管理コントローラー
 */

const reviewService = require('../services/reviewService');

/**
 * レビューを投稿
 * POST /api/reviews
 */
const createReview = async (req, res, next) => {
  try {
    // 依頼者のみレビューを投稿可能
    if (req.user.role !== 'CUSTOMER') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'レビューを投稿できるのは依頼者のみです'
      });
    }

    const reviewerId = req.user.id;
    const reviewData = req.body;

    const review = await reviewService.createReview(reviewerId, reviewData);

    res.status(201).json({
      message: 'レビューを投稿しました',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ワーカーのレビュー一覧を取得（公開）
 * GET /api/reviews/:workerId
 */
const getWorkerReviews = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const filters = {
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await reviewService.getWorkerReviews(workerId, filters);

    res.json({
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getWorkerReviews
};

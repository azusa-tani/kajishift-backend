/**
 * お気に入りコントローラー
 */

const favoriteService = require('../services/favoriteService');

/**
 * お気に入り一覧を取得（認証必須）
 * GET /api/favorites
 */
const getFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const filters = {
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await favoriteService.getFavorites(userId, filters);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * お気に入りを追加（認証必須）
 * POST /api/favorites
 */
const addFavorite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { workerId } = req.body;

    if (!workerId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'ワーカーIDは必須です'
      });
    }

    const favorite = await favoriteService.addFavorite(userId, workerId);
    res.status(201).json({
      message: 'お気に入りに追加しました',
      data: favorite
    });
  } catch (error) {
    next(error);
  }
};

/**
 * お気に入りを削除（認証必須）
 * DELETE /api/favorites/:id
 */
const removeFavorite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await favoriteService.removeFavorite(id, userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * ワーカーIDでお気に入りを削除（認証必須）
 * DELETE /api/favorites/worker/:workerId
 */
const removeFavoriteByWorkerId = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { workerId } = req.params;

    const result = await favoriteService.removeFavoriteByWorkerId(userId, workerId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * お気に入りかどうかを確認（認証必須）
 * GET /api/favorites/check/:workerId
 */
const checkFavorite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { workerId } = req.params;

    const isFav = await favoriteService.isFavorite(userId, workerId);
    res.json({
      isFavorite: isFav
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  removeFavoriteByWorkerId,
  checkFavorite
};

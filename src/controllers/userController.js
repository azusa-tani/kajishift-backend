/**
 * ユーザー管理コントローラー
 */

const userService = require('../services/userService');

/**
 * 自分の情報を取得
 * GET /api/users/me
 */
const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await userService.getUserById(userId);

    res.json({
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 自分の情報を更新
 * PUT /api/users/me
 */
const updateMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    const user = await userService.updateMe(userId, updateData);

    res.json({
      message: 'ユーザー情報を更新しました',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ユーザー詳細を取得
 * GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    // パスワードなどの機密情報を除外した情報のみ返す
    res.json({
      data: user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
  updateMe,
  getUserById
};

/**
 * お気に入りルート
 * @swagger
 * tags:
 *   - name: お気に入り
 *     description: お気に入り管理API
 */

const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticate } = require('../middleware/auth');

// すべてのルートで認証が必要
router.use(authenticate);

/**
 * @swagger
 * /favorites:
 *   get:
 *     summary: お気に入り一覧を取得（認証必須）
 *     tags: [お気に入り]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: ページ番号
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 1ページあたりの件数
 *     responses:
 *       200:
 *         description: お気に入り一覧
 */
router.get('/', favoriteController.getFavorites);

/**
 * @swagger
 * /favorites:
 *   post:
 *     summary: お気に入りを追加（認証必須）
 *     tags: [お気に入り]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workerId
 *             properties:
 *               workerId:
 *                 type: string
 *                 description: ワーカーID
 *     responses:
 *       201:
 *         description: お気に入りに追加しました
 *       400:
 *         description: バリデーションエラー
 */
router.post('/', favoriteController.addFavorite);

/**
 * @swagger
 * /favorites/{id}:
 *   delete:
 *     summary: お気に入りを削除（認証必須）
 *     tags: [お気に入り]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: お気に入りID
 *     responses:
 *       200:
 *         description: お気に入りを削除しました
 *       404:
 *         description: お気に入りが見つかりません
 */
router.delete('/:id', favoriteController.removeFavorite);

/**
 * @swagger
 * /favorites/worker/{workerId}:
 *   delete:
 *     summary: ワーカーIDでお気に入りを削除（認証必須）
 *     tags: [お気に入り]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ワーカーID
 *     responses:
 *       200:
 *         description: お気に入りを削除しました
 *       404:
 *         description: お気に入りが見つかりません
 */
router.delete('/worker/:workerId', favoriteController.removeFavoriteByWorkerId);

/**
 * @swagger
 * /favorites/check/{workerId}:
 *   get:
 *     summary: お気に入りかどうかを確認（認証必須）
 *     tags: [お気に入り]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ワーカーID
 *     responses:
 *       200:
 *         description: お気に入りかどうか
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFavorite:
 *                   type: boolean
 */
router.get('/check/:workerId', favoriteController.checkFavorite);

module.exports = router;

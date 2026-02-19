/**
 * レビュー管理ルート
 * @swagger
 * tags:
 *   - name: レビュー
 *     description: レビュー管理API
 */

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: レビュー投稿
 *     tags: [レビュー]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - rating
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: レビュー投稿成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 依頼者のみレビュー投稿可能
 */
router.post('/', authenticate, reviewController.createReview);

/**
 * @swagger
 * /reviews/{workerId}:
 *   get:
 *     summary: ワーカーのレビュー一覧取得（公開）
 *     tags: [レビュー]
 *     parameters:
 *       - in: path
 *         name: workerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: レビュー一覧取得成功
 */
router.get('/:workerId', reviewController.getWorkerReviews);

module.exports = router;

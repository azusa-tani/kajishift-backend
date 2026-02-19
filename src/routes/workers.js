/**
 * ワーカー管理ルート
 * @swagger
 * tags:
 *   - name: ワーカー
 *     description: ワーカー管理API
 */

const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * /workers:
 *   get:
 *     summary: ワーカー一覧取得・検索（公開）
 *     tags: [ワーカー]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: キーワード検索（名前、自己紹介）
 *       - in: query
 *         name: area
 *         schema:
 *           type: string
 *         description: エリア検索（住所）
 *       - in: query
 *         name: minHourlyRate
 *         schema:
 *           type: integer
 *         description: 最低時給（円）
 *       - in: query
 *         name: maxHourlyRate
 *         schema:
 *           type: integer
 *         description: 最高時給（円）
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *           format: float
 *         description: 最低評価（0-5）
 *       - in: query
 *         name: approvalStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: 承認ステータス（デフォルトはAPPROVED）
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
 *         description: ワーカー一覧取得成功
 */
router.get('/', workerController.getWorkers);

/**
 * @swagger
 * /workers/{id}:
 *   get:
 *     summary: ワーカー詳細取得（公開）
 *     tags: [ワーカー]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: ワーカー詳細取得成功
 *       404:
 *         description: ワーカーが見つかりません
 */
router.get('/:id', workerController.getWorkerById);

/**
 * @swagger
 * /workers/me:
 *   put:
 *     summary: ワーカープロフィール更新
 *     tags: [ワーカー]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *               hourlyRate:
 *                 type: integer
 *     responses:
 *       200:
 *         description: プロフィール更新成功
 *       401:
 *         description: 認証エラー
 */
router.put('/me', authenticate, workerController.updateWorkerProfile);

module.exports = router;

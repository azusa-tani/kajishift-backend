/**
 * サポート管理ルート
 * @swagger
 * tags:
 *   - name: サポート
 *     description: サポート問い合わせAPI
 */

const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { authenticate } = require('../middleware/auth');

// すべてのルートで認証が必要
router.use(authenticate);

/**
 * @swagger
 * /support:
 *   get:
 *     summary: 問い合わせ一覧取得
 *     tags: [サポート]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, CLOSED]
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
 *         description: 問い合わせ一覧取得成功
 *       401:
 *         description: 認証エラー
 */
router.get('/', supportController.getSupportTickets);

/**
 * @swagger
 * /support:
 *   post:
 *     summary: 問い合わせ作成
 *     tags: [サポート]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - content
 *             properties:
 *               subject:
 *                 type: string
 *                 maxLength: 200
 *               content:
 *                 type: string
 *                 maxLength: 5000
 *     responses:
 *       201:
 *         description: 問い合わせ作成成功
 *       401:
 *         description: 認証エラー
 */
router.post('/', supportController.createSupportTicket);

/**
 * @swagger
 * /support/{id}:
 *   get:
 *     summary: 問い合わせ詳細取得
 *     tags: [サポート]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 問い合わせ詳細取得成功
 *       401:
 *         description: 認証エラー
 *       404:
 *         description: 問い合わせが見つかりません
 */
router.get('/:id', supportController.getSupportTicketById);

module.exports = router;

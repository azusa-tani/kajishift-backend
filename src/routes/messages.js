/**
 * メッセージ管理ルート
 * @swagger
 * tags:
 *   - name: チャット
 *     description: チャットメッセージAPI
 */

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

// すべてのルートで認証が必要
router.use(authenticate);

/**
 * @swagger
 * /messages/{bookingId}:
 *   get:
 *     summary: メッセージ一覧取得
 *     tags: [チャット]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
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
 *           default: 50
 *     responses:
 *       200:
 *         description: メッセージ一覧取得成功
 *       401:
 *         description: 認証エラー
 */
router.get('/:bookingId', messageController.getMessages);

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: メッセージ送信
 *     tags: [チャット]
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
 *               - content
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *               content:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: メッセージ送信成功
 *       401:
 *         description: 認証エラー
 */
router.post('/', messageController.sendMessage);

module.exports = router;

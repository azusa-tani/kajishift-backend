/**
 * 決済管理ルート
 * @swagger
 * tags:
 *   - name: 決済
 *     description: 決済管理API
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

// すべてのルートで認証が必要
router.use(authenticate);

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: 決済履歴取得
 *     tags: [決済]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, REFUNDED]
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
 *         description: 決済履歴取得成功
 *       401:
 *         description: 認証エラー
 */
router.get('/', paymentController.getPayments);

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: 決済処理
 *     tags: [決済]
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
 *               - paymentMethod
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, bank_transfer, cash]
 *               transactionId:
 *                 type: string
 *     responses:
 *       201:
 *         description: 決済処理成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 顧客のみ決済可能
 */
router.post('/', paymentController.processPayment);

/**
 * @swagger
 * /payments/{id}/receipt:
 *   get:
 *     summary: 領収書ダウンロード
 *     tags: [決済]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 決済ID
 *     responses:
 *       200:
 *         description: 領収書PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 権限エラー
 *       404:
 *         description: 決済が見つかりません
 */
router.get('/:id/receipt', paymentController.downloadReceipt);

module.exports = router;

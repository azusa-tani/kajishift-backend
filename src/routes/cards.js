/**
 * カード管理ルート
 * @swagger
 * tags:
 *   - name: カード管理
 *     description: クレジットカード管理API
 */

const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');
const { authenticate } = require('../middleware/auth');

// すべてのルートで認証が必要
router.use(authenticate);

/**
 * @swagger
 * /cards:
 *   get:
 *     summary: カード一覧取得
 *     tags: [カード管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: カード一覧取得成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 顧客のみカード管理可能
 */
router.get('/', cardController.getCards);

/**
 * @swagger
 * /cards:
 *   post:
 *     summary: カード追加
 *     tags: [カード管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cardNumber
 *               - expiryMonth
 *               - expiryYear
 *               - cardholderName
 *             properties:
 *               cardNumber:
 *                 type: string
 *                 description: カード番号
 *               expiryMonth:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 description: 有効期限（月）
 *               expiryYear:
 *                 type: integer
 *                 description: 有効期限（年）
 *               cardholderName:
 *                 type: string
 *                 description: カード名義人
 *               securityCode:
 *                 type: string
 *                 description: セキュリティコード（バリデーションのみ、保存しない）
 *               isDefault:
 *                 type: boolean
 *                 description: デフォルトカードにするかどうか
 *     responses:
 *       201:
 *         description: カード追加成功
 *       400:
 *         description: バリデーションエラー
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 顧客のみカード追加可能
 */
router.post('/', cardController.addCard);

/**
 * @swagger
 * /cards/{id}:
 *   put:
 *     summary: カード更新
 *     tags: [カード管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expiryMonth:
 *                 type: integer
 *               expiryYear:
 *                 type: integer
 *               cardholderName:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: カード更新成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 権限エラー
 *       404:
 *         description: カードが見つかりません
 */
router.put('/:id', cardController.updateCard);

/**
 * @swagger
 * /cards/{id}:
 *   delete:
 *     summary: カード削除
 *     tags: [カード管理]
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
 *         description: カード削除成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 権限エラー
 *       404:
 *         description: カードが見つかりません
 */
router.delete('/:id', cardController.deleteCard);

module.exports = router;

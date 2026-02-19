/**
 * ユーザー管理ルート
 * @swagger
 * tags:
 *   - name: ユーザー
 *     description: ユーザー管理API
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: 自分の情報取得
 *     tags: [ユーザー]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ユーザー情報取得成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: 認証エラー
 */
router.get('/me', authenticate, userController.getMe);

/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: 自分の情報更新
 *     tags: [ユーザー]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *       401:
 *         description: 認証エラー
 */
router.put('/me', authenticate, userController.updateMe);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: ユーザー詳細取得
 *     tags: [ユーザー]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ユーザーID
 *     responses:
 *       200:
 *         description: ユーザー情報取得成功
 *       401:
 *         description: 認証エラー
 *       404:
 *         description: ユーザーが見つかりません
 */
router.get('/:id', authenticate, userController.getUserById);

module.exports = router;

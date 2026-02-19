/**
 * 認証ルート
 * @swagger
 * tags:
 *   - name: 認証
 *     description: 認証関連のAPI
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/security');
const { uploadSingle } = require('../middleware/upload');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: ユーザー登録
 *     tags: [認証]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               name:
 *                 type: string
 *                 example: 山田 太郎
 *               phone:
 *                 type: string
 *                 example: 090-1234-5678
 *               role:
 *                 type: string
 *                 enum: [CUSTOMER, WORKER, ADMIN]
 *                 example: CUSTOMER
 *     responses:
 *       201:
 *         description: ユーザー登録成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *       400:
 *         description: バリデーションエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 登録API（multipart/form-data対応）
router.post('/register', authLimiter, uploadSingle('idDocument'), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: ログイン
 *     tags: [認証]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: ログイン成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *       401:
 *         description: 認証エラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', authLimiter, authController.login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: 現在のユーザー情報取得
 *     tags: [認証]
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: パスワードリセットメール送信
 *     tags: [認証]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: パスワードリセットメール送信成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: パスワードリセットメールを送信しました
 *       400:
 *         description: バリデーションエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: パスワードリセット
 *     tags: [認証]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: パスワードリセットトークン
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: 新しいパスワード
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: パスワードリセット成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: パスワードをリセットしました
 *       400:
 *         description: バリデーションエラーまたは無効なトークン
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/reset-password', authController.resetPassword);

module.exports = router;

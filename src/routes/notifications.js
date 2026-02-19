/**
 * 通知管理ルート
 * @swagger
 * tags:
 *   - name: 通知
 *     description: 通知管理API
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

// すべてのルートで認証が必要
router.use(authenticate);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: 通知一覧取得
 *     tags: [通知]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: 既読/未読でフィルター（true=既読、false=未読）
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [MESSAGE, BOOKING_UPDATE, BOOKING_CREATED, BOOKING_CANCELLED, REVIEW, PAYMENT, PAYMENT_FAILED, SYSTEM, WORKER_APPROVED, WORKER_REJECTED]
 *         description: 通知タイプでフィルター
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
 *         description: 通知一覧取得成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: 認証エラー
 */
router.get('/', notificationController.getNotifications);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: 未読通知数取得
 *     tags: [通知]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 未読通知数取得成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       description: 未読通知数
 *       401:
 *         description: 認証エラー
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @swagger
 * /notifications/read-all:
 *   put:
 *     summary: すべての通知を既読にする
 *     tags: [通知]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: すべての通知を既読にしました
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
 *                     count:
 *                       type: integer
 *                       description: 既読にした通知数
 *       401:
 *         description: 認証エラー
 */
router.put('/read-all', notificationController.markAllAsRead);

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: 通知を既読にする
 *     tags: [通知]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 通知ID
 *     responses:
 *       200:
 *         description: 通知を既読にしました
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       401:
 *         description: 認証エラー
 *       404:
 *         description: 通知が見つかりません
 */
router.put('/:id/read', notificationController.markAsRead);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: 通知を削除
 *     tags: [通知]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 通知ID
 *     responses:
 *       200:
 *         description: 通知を削除しました
 *       401:
 *         description: 認証エラー
 *       404:
 *         description: 通知が見つかりません
 */
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;

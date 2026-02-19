/**
 * 予約管理ルート
 * @swagger
 * tags:
 *   - name: 予約
 *     description: 予約管理API
 */

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middleware/auth');

// すべてのルートで認証が必要
router.use(authenticate);

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: 予約一覧取得・検索
 *     tags: [予約]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED]
 *         description: ステータスでフィルター
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *         description: "サービス種別でフィルター（例: 掃除・清掃、料理、洗濯、買い物代行）"
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: "開始日（ISO形式、この日以降の予約を取得）"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: "終了日（ISO形式、この日以前の予約を取得）"
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
 *         description: 予約一覧取得成功
 *       401:
 *         description: 認証エラー
 */
router.get('/', bookingController.getBookings);

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: 予約作成
 *     tags: [予約]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceType
 *               - scheduledDate
 *               - startTime
 *               - duration
 *               - address
 *             properties:
 *               workerId:
 *                 type: string
 *                 format: uuid
 *               serviceType:
 *                 type: string
 *                 example: 掃除・清掃
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               startTime:
 *                 type: string
 *                 example: "10:00"
 *               duration:
 *                 type: integer
 *                 example: 3
 *               address:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: 予約作成成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 顧客のみ予約作成可能
 */
router.post('/', bookingController.createBooking);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: 予約詳細取得
 *     tags: [予約]
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
 *         description: 予約詳細取得成功
 *       401:
 *         description: 認証エラー
 *       404:
 *         description: 予約が見つかりません
 */
router.get('/:id', bookingController.getBookingById);

/**
 * @swagger
 * /bookings/{id}:
 *   put:
 *     summary: 予約更新
 *     tags: [予約]
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
 *               serviceType:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               startTime:
 *                 type: string
 *               duration:
 *                 type: integer
 *               address:
 *                 type: string
 *               notes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: 予約更新成功
 *       401:
 *         description: 認証エラー
 */
router.put('/:id', bookingController.updateBooking);

/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: 予約キャンセル
 *     tags: [予約]
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
 *         description: 予約キャンセル成功
 *       401:
 *         description: 認証エラー
 */
router.delete('/:id', bookingController.cancelBooking);

/**
 * @swagger
 * /bookings/{id}/accept:
 *   post:
 *     summary: 予約を承諾（ワーカーのみ）
 *     tags: [予約]
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
 *         description: 予約承諾成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: ワーカーのみ予約を承諾可能
 *       404:
 *         description: 予約が見つかりません
 */
router.post('/:id/accept', bookingController.acceptBooking);

/**
 * @swagger
 * /bookings/{id}/reject:
 *   post:
 *     summary: 予約を拒否（ワーカーのみ）
 *     tags: [予約]
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
 *               reason:
 *                 type: string
 *                 description: 拒否理由（オプション）
 *     responses:
 *       200:
 *         description: 予約拒否成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: ワーカーのみ予約を拒否可能
 *       404:
 *         description: 予約が見つかりません
 */
router.post('/:id/reject', bookingController.rejectBooking);

/**
 * @swagger
 * /bookings/{id}/complete:
 *   post:
 *     summary: 作業完了（ワーカーのみ）
 *     tags: [予約]
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
 *         description: 作業完了成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: ワーカーのみ作業を完了可能
 *       404:
 *         description: 予約が見つかりません
 */
router.post('/:id/complete', bookingController.completeBooking);

module.exports = router;

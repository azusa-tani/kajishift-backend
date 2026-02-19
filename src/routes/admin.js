/**
 * 管理者ルート
 * @swagger
 * tags:
 *   - name: 管理者
 *     description: 管理者専用API
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const supportController = require('../controllers/supportController');
const { authenticate, authorize } = require('../middleware/auth');

// すべてのルートで認証が必要
router.use(authenticate);

// 管理者のみアクセス可能
router.use(authorize('ADMIN'));

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: ユーザー管理（管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [CUSTOMER, WORKER, ADMIN]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED]
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
 *         description: ユーザー一覧取得成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.get('/users', adminController.getUsers);

/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     summary: ユーザー情報更新（管理者のみ）
 *     tags: [管理者]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED]
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: ユーザー情報更新成功
 *       400:
 *         description: バリデーションエラー
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 *       404:
 *         description: ユーザーが見つかりません
 */
router.put('/users/:id', adminController.updateUser);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: ユーザー削除（管理者のみ）
 *     tags: [管理者]
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
 *         description: ユーザー削除成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 *       404:
 *         description: ユーザーが見つかりません
 */
router.delete('/users/:id', adminController.deleteUser);

/**
 * @swagger
 * /admin/workers:
 *   get:
 *     summary: ワーカー管理（管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: approvalStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED]
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
 *         description: ワーカー一覧取得成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.get('/workers', adminController.getWorkers);

/**
 * @swagger
 * /admin/workers/{id}/approve:
 *   put:
 *     summary: ワーカー承認（管理者のみ）
 *     tags: [管理者]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approvalStatus
 *             properties:
 *               approvalStatus:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: ワーカー承認成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.put('/workers/:id/approve', adminController.approveWorker);

/**
 * @swagger
 * /admin/workers/{id}:
 *   put:
 *     summary: ワーカー情報更新（管理者のみ）
 *     tags: [管理者]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED]
 *               bio:
 *                 type: string
 *               hourlyRate:
 *                 type: integer
 *               approvalStatus:
 *                 type: string
 *                 enum: [PENDING, APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: ワーカー情報更新成功
 *       400:
 *         description: バリデーションエラー
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 *       404:
 *         description: ワーカーが見つかりません
 */
router.put('/workers/:id', adminController.updateWorker);

/**
 * @swagger
 * /admin/workers/{id}:
 *   delete:
 *     summary: ワーカー削除（管理者のみ）
 *     tags: [管理者]
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
 *         description: ワーカー削除成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 *       404:
 *         description: ワーカーが見つかりません
 */
router.delete('/workers/:id', adminController.deleteWorker);

/**
 * @swagger
 * /admin/reports/bookings:
 *   get:
 *     summary: 予約レポート取得（管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日（YYYY-MM-DD形式）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 終了日（YYYY-MM-DD形式）
 *     responses:
 *       200:
 *         description: 予約レポート取得成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         confirmed:
 *                           type: integer
 *                         inProgress:
 *                           type: integer
 *                         completed:
 *                           type: integer
 *                         cancelled:
 *                           type: integer
 *                     byDate:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     byServiceType:
 *                       type: object
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.get('/reports/bookings', adminController.getBookingReport);

/**
 * @swagger
 * /admin/reports/revenue:
 *   get:
 *     summary: 売上レポート取得（管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日（YYYY-MM-DD形式）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 終了日（YYYY-MM-DD形式）
 *     responses:
 *       200:
 *         description: 売上レポート取得成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalRevenue:
 *                           type: integer
 *                         totalBookings:
 *                           type: integer
 *                         averageRevenue:
 *                           type: integer
 *                         completedPayments:
 *                           type: integer
 *                     byDate:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           revenue:
 *                             type: integer
 *                     byMonth:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           revenue:
 *                             type: integer
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.get('/reports/revenue', adminController.getRevenueReport);

/**
 * @swagger
 * /admin/reports/users:
 *   get:
 *     summary: ユーザー統計レポート取得（管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日（YYYY-MM-DD形式）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 終了日（YYYY-MM-DD形式）
 *     responses:
 *       200:
 *         description: ユーザー統計レポート取得成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         customers:
 *                           type: integer
 *                         workers:
 *                           type: integer
 *                         admins:
 *                           type: integer
 *                         active:
 *                           type: integer
 *                         inactive:
 *                           type: integer
 *                         suspended:
 *                           type: integer
 *                     byDate:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     byRole:
 *                       type: object
 *                     byStatus:
 *                       type: object
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.get('/reports/users', adminController.getUserReport);

/**
 * @swagger
 * /admin/reports/workers:
 *   get:
 *     summary: ワーカー統計レポート取得（管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日（YYYY-MM-DD形式）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 終了日（YYYY-MM-DD形式）
 *     responses:
 *       200:
 *         description: ワーカー統計レポート取得成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         approved:
 *                           type: integer
 *                         rejected:
 *                           type: integer
 *                         active:
 *                           type: integer
 *                         inactive:
 *                           type: integer
 *                         suspended:
 *                           type: integer
 *                         averageRating:
 *                           type: number
 *                         averageHourlyRate:
 *                           type: integer
 *                     byDate:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     byApprovalStatus:
 *                       type: object
 *                     byStatus:
 *                       type: object
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.get('/reports/workers', adminController.getWorkerReport);

/**
 * @swagger
 * /admin/reports/bookings/export/csv:
 *   get:
 *     summary: 予約レポートをCSV形式でエクスポート（管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日（YYYY-MM-DD）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 終了日（YYYY-MM-DD）
 *     responses:
 *       200:
 *         description: CSVファイル
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.get('/reports/bookings/export/csv', adminController.exportBookingReportCSV);

/**
 * @swagger
 * /admin/reports/bookings/export/excel:
 *   get:
 *     summary: 予約レポートをExcel形式でエクスポート（管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日（YYYY-MM-DD）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 終了日（YYYY-MM-DD）
 *     responses:
 *       200:
 *         description: Excelファイル
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.get('/reports/bookings/export/excel', adminController.exportBookingReportExcel);

/**
 * @swagger
 * /admin/reports/revenue/export/csv:
 *   get:
 *     summary: 売上レポートをCSV形式でエクスポート（管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日（YYYY-MM-DD）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 終了日（YYYY-MM-DD）
 *     responses:
 *       200:
 *         description: CSVファイル
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.get('/reports/revenue/export/csv', adminController.exportRevenueReportCSV);

/**
 * @swagger
 * /admin/reports/revenue/export/excel:
 *   get:
 *     summary: 売上レポートをExcel形式でエクスポート（管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日（YYYY-MM-DD）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 終了日（YYYY-MM-DD）
 *     responses:
 *       200:
 *         description: Excelファイル
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.get('/reports/revenue/export/excel', adminController.exportRevenueReportExcel);

/**
 * @swagger
 * /admin/reports/users/export/csv:
 *   get:
 *     summary: ユーザー統計レポートをCSV形式でエクスポート（管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日（YYYY-MM-DD）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 終了日（YYYY-MM-DD）
 *     responses:
 *       200:
 *         description: CSVファイル
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.get('/reports/users/export/csv', adminController.exportUserReportCSV);

/**
 * @swagger
 * /admin/reports/users/export/excel:
 *   get:
 *     summary: ユーザー統計レポートをExcel形式でエクスポート（管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日（YYYY-MM-DD）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 終了日（YYYY-MM-DD）
 *     responses:
 *       200:
 *         description: Excelファイル
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.get('/reports/users/export/excel', adminController.exportUserReportExcel);

/**
 * @swagger
 * /admin/reports/workers/export/csv:
 *   get:
 *     summary: ワーカー統計レポートをCSV形式でエクスポート（管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日（YYYY-MM-DD）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 終了日（YYYY-MM-DD）
 *     responses:
 *       200:
 *         description: CSVファイル
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.get('/reports/workers/export/csv', adminController.exportWorkerReportCSV);

/**
 * @swagger
 * /admin/reports/workers/export/excel:
 *   get:
 *     summary: ワーカー統計レポートをExcel形式でエクスポート（管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日（YYYY-MM-DD）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 終了日（YYYY-MM-DD）
 *     responses:
 *       200:
 *         description: Excelファイル
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.get('/reports/workers/export/excel', adminController.exportWorkerReportExcel);

/**
 * @swagger
 * /admin/notifications/system:
 *   post:
 *     summary: システム通知を作成・送信（管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: 通知タイトル
 *                 example: メンテナンスのお知らせ
 *               content:
 *                 type: string
 *                 description: 通知内容
 *                 example: 2026年2月15日 2:00-4:00の間、メンテナンスを実施いたします。
 *               targetRole:
 *                 type: string
 *                 enum: [CUSTOMER, WORKER, ADMIN]
 *                 description: 送信対象のロール（指定しない場合は全ユーザー）
 *                 example: CUSTOMER
 *               targetUserIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 送信対象のユーザーIDリスト（指定しない場合は全ユーザーまたはロール指定）
 *                 example: ["user-id-1", "user-id-2"]
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high]
 *                 default: normal
 *                 description: 優先度
 *                 example: high
 *               sendEmail:
 *                 type: boolean
 *                 default: true
 *                 description: メール送信するかどうか
 *                 example: true
 *     responses:
 *       200:
 *         description: システム通知を作成しました
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: システム通知を作成しました
 *                 data:
 *                   type: object
 *                   properties:
 *                     sentCount:
 *                       type: number
 *                       description: 送信した通知数
 *                       example: 150
 *                     totalUsers:
 *                       type: number
 *                       description: 対象ユーザー数
 *                       example: 150
 *       400:
 *         description: バリデーションエラー
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.post('/notifications/system', adminController.createSystemNotification);

/**
 * @swagger
 * /admin/reports/chart/{reportType}:
 *   get:
 *     summary: グラフ用データを取得（チャート表示用、管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [bookings, revenue, users, workers]
 *         description: レポートタイプ
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日（ISO形式）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 終了日（ISO形式）
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month, year]
 *           default: day
 *         description: グループ化単位
 *     responses:
 *       200:
 *         description: グラフ用データ
 */
router.get('/reports/chart/:reportType', adminController.getChartData);

/**
 * @swagger
 * /admin/reports/comparison/{reportType}:
 *   get:
 *     summary: 比較レポートを取得（前月比、前年比、管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [bookings, revenue, users, workers]
 *         description: レポートタイプ
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 開始日（ISO形式）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 終了日（ISO形式）
 *       - in: query
 *         name: compareType
 *         schema:
 *           type: string
 *           enum: [month, year, period]
 *           default: month
 *         description: 比較タイプ（month=前月比、year=前年比、period=前期間）
 *     responses:
 *       200:
 *         description: 比較レポート
 */
router.get('/reports/comparison/:reportType', adminController.getComparisonReport);

/**
 * @swagger
 * /admin/reports/custom:
 *   post:
 *     summary: カスタムレポートを取得（複数条件の組み合わせ、管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportTypes
 *             properties:
 *               reportTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [bookings, revenue, users, workers]
 *                 description: レポートタイプの配列
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: 開始日（ISO形式）
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: 終了日（ISO形式）
 *               groupBy:
 *                 type: string
 *                 enum: [hour, day, week, month, year]
 *                 default: day
 *                 description: グループ化単位
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [averageBookingValue, conversionRate, activeWorkers]
 *                 description: 計算するメトリクス
 *     responses:
 *       200:
 *         description: カスタムレポート
 */
router.post('/reports/custom', adminController.getCustomReport);

/**
 * @swagger
 * /admin/debug/users:
 *   get:
 *     summary: ユーザー状態確認（デバッグ用、管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ユーザー統計情報
 */
/**
 * @swagger
 * /admin/support/{id}:
 *   put:
 *     summary: サポートチケット更新（管理者のみ）
 *     tags: [管理者]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [OPEN, IN_PROGRESS, CLOSED]
 *               adminResponse:
 *                 type: string
 *                 maxLength: 5000
 *               adminId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: サポートチケット更新成功
 *       400:
 *         description: バリデーションエラー
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 *       404:
 *         description: 問い合わせが見つかりません
 */
router.put('/support/:id', supportController.updateSupportTicket);

/**
 * @swagger
 * /admin/support/{id}:
 *   delete:
 *     summary: サポートチケット削除（管理者のみ）
 *     tags: [管理者]
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
 *         description: サポートチケット削除成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 *       404:
 *         description: 問い合わせが見つかりません
 */
router.delete('/support/:id', supportController.deleteSupportTicket);

/**
 * @swagger
 * /admin/settings:
 *   get:
 *     summary: システム設定取得（管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: カテゴリでフィルター
 *     responses:
 *       200:
 *         description: システム設定取得成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.get('/settings', adminController.getSystemSettings);

/**
 * @swagger
 * /admin/settings:
 *   put:
 *     summary: システム設定更新（管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties:
 *               type: string
 *     responses:
 *       200:
 *         description: システム設定更新成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.put('/settings', adminController.updateSystemSettings);

/**
 * @swagger
 * /admin/services:
 *   get:
 *     summary: サービスメニュー一覧取得（管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: サービスメニュー一覧取得成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.get('/services', adminController.getServiceMenus);

/**
 * @swagger
 * /admin/services:
 *   post:
 *     summary: サービスメニュー作成（管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               basePrice:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: サービスメニュー作成成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.post('/services', adminController.createServiceMenu);

/**
 * @swagger
 * /admin/services/{id}:
 *   put:
 *     summary: サービスメニュー更新（管理者のみ）
 *     tags: [管理者]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               basePrice:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: サービスメニュー更新成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 *       404:
 *         description: サービスメニューが見つかりません
 */
router.put('/services/:id', adminController.updateServiceMenu);

/**
 * @swagger
 * /admin/services/{id}:
 *   delete:
 *     summary: サービスメニュー削除（管理者のみ）
 *     tags: [管理者]
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
 *         description: サービスメニュー削除成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 *       404:
 *         description: サービスメニューが見つかりません
 */
router.delete('/services/:id', adminController.deleteServiceMenu);

/**
 * @swagger
 * /admin/areas:
 *   get:
 *     summary: 対応エリア一覧取得（管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 対応エリア一覧取得成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.get('/areas', adminController.getAreas);

/**
 * @swagger
 * /admin/areas:
 *   post:
 *     summary: 対応エリア作成（管理者のみ）
 *     tags: [管理者]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               prefecture:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 対応エリア作成成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 */
router.post('/areas', adminController.createArea);

/**
 * @swagger
 * /admin/areas/{id}:
 *   put:
 *     summary: 対応エリア更新（管理者のみ）
 *     tags: [管理者]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               prefecture:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 対応エリア更新成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 *       404:
 *         description: 対応エリアが見つかりません
 */
router.put('/areas/:id', adminController.updateArea);

/**
 * @swagger
 * /admin/areas/{id}:
 *   delete:
 *     summary: 対応エリア削除（管理者のみ）
 *     tags: [管理者]
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
 *         description: 対応エリア削除成功
 *       401:
 *         description: 認証エラー
 *       403:
 *         description: 管理者のみアクセス可能
 *       404:
 *         description: 対応エリアが見つかりません
 */
router.delete('/areas/:id', adminController.deleteArea);

router.get('/debug/users', async (req, res, next) => {
  try {
    const prisma = require('../config/database');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    const stats = {
      total: users.length,
      byStatus: {
        ACTIVE: users.filter(u => u.status === 'ACTIVE').length,
        INACTIVE: users.filter(u => u.status === 'INACTIVE').length,
        SUSPENDED: users.filter(u => u.status === 'SUSPENDED').length
      },
      byRole: {
        CUSTOMER: users.filter(u => u.role === 'CUSTOMER').length,
        WORKER: users.filter(u => u.role === 'WORKER').length,
        ADMIN: users.filter(u => u.role === 'ADMIN').length
      },
      byStatusAndRole: {
        ACTIVE: {
          CUSTOMER: users.filter(u => u.status === 'ACTIVE' && u.role === 'CUSTOMER').length,
          WORKER: users.filter(u => u.status === 'ACTIVE' && u.role === 'WORKER').length,
          ADMIN: users.filter(u => u.status === 'ACTIVE' && u.role === 'ADMIN').length
        }
      }
    };
    
    res.json({
      message: 'ユーザー統計情報',
      stats,
      users: users.slice(0, 20) // 最初の20件のみ表示（パフォーマンスのため）
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

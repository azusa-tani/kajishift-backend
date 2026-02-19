/**
 * ファイルアップロード管理ルート
 * @swagger
 * tags:
 *   - name: ファイルアップロード
 *     description: ファイルアップロード管理API
 */

const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// すべてのルートで認証が必要
router.use(authenticate);

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: ファイルアップロード
 *     tags: [ファイルアップロード]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: アップロードするファイル
 *               fileType:
 *                 type: string
 *                 enum: [PROFILE_IMAGE, ID_DOCUMENT, GENERAL]
 *                 description: ファイルタイプ（オプション）
 *     responses:
 *       201:
 *         description: ファイルアップロード成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/File'
 *       400:
 *         description: バリデーションエラー
 *       401:
 *         description: 認証エラー
 */
router.post('/', uploadSingle('file'), uploadController.uploadFile);

/**
 * @swagger
 * /upload:
 *   get:
 *     summary: ファイル一覧取得
 *     tags: [ファイルアップロード]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fileType
 *         schema:
 *           type: string
 *           enum: [PROFILE_IMAGE, ID_DOCUMENT, GENERAL]
 *         description: ファイルタイプでフィルター
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
 *         description: ファイル一覧取得成功
 *       401:
 *         description: 認証エラー
 */
router.get('/', uploadController.getUserFiles);

/**
 * @swagger
 * /upload/{id}:
 *   get:
 *     summary: ファイル情報取得
 *     tags: [ファイルアップロード]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ファイルID
 *     responses:
 *       200:
 *         description: ファイル情報取得成功
 *       401:
 *         description: 認証エラー
 *       404:
 *         description: ファイルが見つかりません
 */
router.get('/:id', uploadController.getFile);

/**
 * @swagger
 * /upload/{id}/download:
 *   get:
 *     summary: ファイルダウンロード
 *     tags: [ファイルアップロード]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ファイルID
 *     responses:
 *       200:
 *         description: ファイルダウンロード成功
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: 認証エラー
 *       404:
 *         description: ファイルが見つかりません
 */
router.get('/:id/download', uploadController.downloadFile);

/**
 * @swagger
 * /upload/{id}:
 *   delete:
 *     summary: ファイル削除
 *     tags: [ファイルアップロード]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ファイルID
 *     responses:
 *       200:
 *         description: ファイル削除成功
 *       401:
 *         description: 認証エラー
 *       404:
 *         description: ファイルが見つかりません
 */
router.delete('/:id', uploadController.deleteFile);

module.exports = router;

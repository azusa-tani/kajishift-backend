/**
 * ファイルアップロード管理コントローラー
 */

const uploadService = require('../services/uploadService');
const path = require('path');
const fs = require('fs');

/**
 * ファイルをアップロード
 * POST /api/upload
 */
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'ファイルが選択されていません'
      });
    }

    const userId = req.user.id;
    const file = req.file;
    
    // ファイルタイプを決定
    let fileType = 'GENERAL';
    if (req.body.fileType) {
      fileType = req.body.fileType;
    } else if (file.fieldname === 'profileImage') {
      fileType = 'PROFILE_IMAGE';
    } else if (file.fieldname === 'idDocument') {
      fileType = 'ID_DOCUMENT';
    }

    // ファイルパスを相対パスに変換（uploadsディレクトリ以降）
    let relativePath = file.path;
    const uploadsIndex = file.path.indexOf('uploads');
    if (uploadsIndex !== -1) {
      relativePath = file.path.substring(uploadsIndex);
    }
    
    // ファイル情報を保存
    const fileInfo = await uploadService.saveFileInfo(
      userId,
      relativePath,
      file.originalname,
      file.mimetype,
      file.size,
      fileType
    );

    // ファイルURLを生成
    const fileUrl = uploadService.getFileUrl(file.path);

    res.status(201).json({
      message: 'ファイルをアップロードしました',
      data: {
        ...fileInfo,
        url: fileUrl
      }
    });
  } catch (error) {
    // アップロードされたファイルを削除（エラー時）
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('ファイル削除エラー:', unlinkError);
      }
    }
    next(error);
  }
};

/**
 * ファイル情報を取得
 * GET /api/upload/:id
 */
const getFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const fileInfo = await uploadService.getFileInfo(id, userId);
    const fileUrl = uploadService.getFileUrl(fileInfo.filePath);

    res.json({
      data: {
        ...fileInfo,
        url: fileUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ファイルを取得（ダウンロード）
 * GET /api/upload/:id/download
 */
const downloadFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const fileInfo = await uploadService.getFileInfo(id, userId);
    // ファイルパスが相対パスの場合、絶対パスに変換
    const fullPath = path.isAbsolute(fileInfo.filePath) 
      ? fileInfo.filePath 
      : path.join(__dirname, '../../', fileInfo.filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'ファイルが見つかりません'
      });
    }

    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.originalName}"`);
    
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * ユーザーのファイル一覧を取得
 * GET /api/upload
 */
const getUserFiles = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const filters = {
      fileType: req.query.fileType,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await uploadService.getUserFiles(userId, filters);

    // 各ファイルにURLを追加
    const filesWithUrl = result.files.map(file => ({
      ...file,
      url: uploadService.getFileUrl(file.filePath)
    }));

    res.json({
      data: {
        files: filesWithUrl,
        pagination: result.pagination
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ファイルを削除
 * DELETE /api/upload/:id
 */
const deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await uploadService.deleteFile(id, userId);

    res.json({
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadFile,
  getFile,
  downloadFile,
  getUserFiles,
  deleteFile
};

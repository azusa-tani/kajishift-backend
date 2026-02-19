/**
 * ファイルアップロードミドルウェア
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// アップロードディレクトリを作成（存在しない場合）
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ストレージ設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // ファイルタイプに応じてサブディレクトリを分ける
    let subDir = 'general';
    if (file.fieldname === 'profileImage') {
      subDir = 'profiles';
    } else if (file.fieldname === 'idDocument') {
      subDir = 'documents';
    }
    
    const dir = path.join(uploadDir, subDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // ファイル名を安全にする（ユーザーID + タイムスタンプ + 元の拡張子）
    // 登録時はユーザーIDがないため、一時的なIDを使用
    const userId = req.user?.id || `temp_${Date.now()}`;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const safeName = `${userId}_${timestamp}${ext}`;
    cb(null, safeName);
  }
});

// ファイルタイプのバリデーション
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = {
    'profileImage': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    'idDocument': ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
  };

  const allowedTypes = allowedMimeTypes[file.fieldname] || ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`許可されていないファイルタイプです。許可されているタイプ: ${allowedTypes.join(', ')}`), false);
  }
};

// Multer設定
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB制限
  }
});

/**
 * 単一ファイルアップロードミドルウェア
 * @param {string} fieldName - フィールド名（'profileImage', 'idDocument'など）
 */
const uploadSingle = (fieldName = 'file') => {
  return upload.single(fieldName);
};

/**
 * 複数ファイルアップロードミドルウェア
 * @param {string} fieldName - フィールド名
 * @param {number} maxCount - 最大ファイル数
 */
const uploadMultiple = (fieldName = 'files', maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  upload
};

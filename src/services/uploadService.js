/**
 * ファイルアップロード管理サービス
 */

const prisma = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * ファイル情報を保存
 * @param {string} userId - ユーザーID
 * @param {string} filePath - ファイルパス
 * @param {string} originalName - 元のファイル名
 * @param {string} mimeType - MIMEタイプ
 * @param {number} fileSize - ファイルサイズ（バイト）
 * @param {string} fileType - ファイルタイプ（PROFILE_IMAGE, ID_DOCUMENT, GENERAL）
 */
const saveFileInfo = async (userId, filePath, originalName, mimeType, fileSize, fileType = 'GENERAL') => {
  // ファイル情報を作成
  const file = await prisma.file.create({
    data: {
      userId,
      filePath,
      originalName,
      mimeType,
      fileSize,
      fileType
    }
  });

  return file;
};

/**
 * ファイル情報を取得
 * @param {string} fileId - ファイルID
 * @param {string} userId - ユーザーID（権限チェック用）
 */
const getFileInfo = async (fileId, userId) => {
  const file = await prisma.file.findUnique({
    where: { id: fileId }
  });

  if (!file) {
    throw new Error('ファイルが見つかりません');
  }

  // 権限チェック：自分のファイルまたは管理者のみアクセス可能
  if (file.userId !== userId) {
    // 管理者チェック（必要に応じて実装）
    // ここでは簡易的に自分のファイルのみアクセス可能とする
    throw new Error('このファイルにアクセスする権限がありません');
  }

  return file;
};

/**
 * ユーザーのファイル一覧を取得
 * @param {string} userId - ユーザーID
 * @param {object} filters - フィルター（fileType, page, limit）
 */
const getUserFiles = async (userId, filters = {}) => {
  const { fileType, page = 1, limit = 20 } = filters;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { userId };
  if (fileType) {
    where.fileType = fileType;
  }

  const [files, total] = await Promise.all([
    prisma.file.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.file.count({ where })
  ]);

  return {
    files,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

/**
 * ファイルを削除
 * @param {string} fileId - ファイルID
 * @param {string} userId - ユーザーID
 */
const deleteFile = async (fileId, userId) => {
  // ファイル情報を取得
  const file = await getFileInfo(fileId, userId);

  // 物理ファイルを削除
  const fullPath = path.join(__dirname, '../../', file.filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }

  // データベースから削除
  await prisma.file.delete({
    where: { id: fileId }
  });

  return { message: 'ファイルを削除しました' };
};

/**
 * ファイルパスからURLを生成
 * @param {string} filePath - ファイルパス（絶対パスまたは相対パス）
 */
const getFileUrl = (filePath) => {
  // 本番環境では、クラウドストレージのURLを使用
  if (process.env.NODE_ENV === 'production' && process.env.CLOUD_STORAGE_URL) {
    return `${process.env.CLOUD_STORAGE_URL}/${filePath}`;
  }
  
  // 開発環境では、相対パスからURLを生成
  // 絶対パスの場合、uploadsディレクトリ以降のパスを取得
  let relativePath = filePath;
  if (path.isAbsolute(filePath)) {
    const uploadsIndex = filePath.indexOf('uploads');
    if (uploadsIndex !== -1) {
      relativePath = filePath.substring(uploadsIndex);
    }
  }
  
  // パス区切りを統一（/に変換）
  relativePath = relativePath.replace(/\\/g, '/');
  
  // 先頭の/を追加（まだない場合）
  if (!relativePath.startsWith('/')) {
    relativePath = '/' + relativePath;
  }
  
  return relativePath;
};

module.exports = {
  saveFileInfo,
  getFileInfo,
  getUserFiles,
  deleteFile,
  getFileUrl
};

/**
 * 認証コントローラー
 */

const authService = require('../services/authService');
const uploadService = require('../services/uploadService');
const path = require('path');

/**
 * ユーザー登録
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    // multipart/form-dataまたはJSON形式の両方に対応
    let email, password, name, phone, role, address;
    let bio, hourlyRate, bankName, branchName, accountType, accountNumber, accountName;
    let idDocumentUrl = null;

    if (req.body && typeof req.body === 'object') {
      // JSON形式の場合
      if (req.body.email) {
        email = req.body.email;
        password = req.body.password;
        name = req.body.name;
        phone = req.body.phone;
        role = req.body.role;
        address = req.body.address;
        bio = req.body.bio;
        hourlyRate = req.body.hourlyRate;
        bankName = req.body.bankName;
        branchName = req.body.branchName;
        accountType = req.body.accountType;
        accountNumber = req.body.accountNumber;
        accountName = req.body.accountName;
        idDocumentUrl = req.body.idDocumentUrl;
      } else {
        // multipart/form-dataの場合
        email = req.body.email;
        password = req.body.password;
        name = req.body.name;
        phone = req.body.phone;
        role = req.body.role;
        address = req.body.address;
        bio = req.body.bio;
        hourlyRate = req.body.hourlyRate ? parseInt(req.body.hourlyRate) : null;
        bankName = req.body.bankName;
        branchName = req.body.branchName;
        accountType = req.body.accountType;
        accountNumber = req.body.accountNumber;
        accountName = req.body.accountName;
      }
    }

    // 必須フィールドのチェック
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'メールアドレス、パスワード、名前は必須です'
      });
    }

    // ファイルがアップロードされた場合、ファイル情報を保存
    if (req.file && role === 'WORKER') {
      try {
        // ファイルパスを相対パスに変換
        let relativePath = req.file.path;
        const uploadsIndex = req.file.path.indexOf('uploads');
        if (uploadsIndex !== -1) {
          relativePath = req.file.path.substring(uploadsIndex);
        }

        // 一時的なユーザーID（登録前なので、一時的なIDを使用）
        // 実際には、登録後にファイル情報を更新する必要がある
        // ここでは、ファイルパスを直接保存する方式を採用
        idDocumentUrl = relativePath;
      } catch (fileError) {
        console.error('ファイル処理エラー:', fileError);
        // ファイル処理エラーは無視（登録は続行）
      }
    }

    const result = await authService.register({
      email,
      password,
      name,
      phone,
      role,
      address,
      // ワーカー用フィールド
      bio,
      hourlyRate,
      bankName,
      branchName,
      accountType,
      accountNumber,
      accountName,
      idDocumentUrl
    });

    // 登録成功後、ファイル情報をデータベースに保存（ワーカーの場合）
    if (req.file && role === 'WORKER' && result.user) {
      try {
        let relativePath = req.file.path;
        const uploadsIndex = req.file.path.indexOf('uploads');
        if (uploadsIndex !== -1) {
          relativePath = req.file.path.substring(uploadsIndex);
        }

        await uploadService.saveFileInfo(
          result.user.id,
          relativePath,
          req.file.originalname,
          req.file.mimetype,
          req.file.size,
          'ID_DOCUMENT'
        );
      } catch (fileError) {
        console.error('ファイル情報保存エラー:', fileError);
        // エラーは無視（登録は成功している）
      }
    }

    res.status(201).json({
      message: 'ユーザー登録が完了しました',
      data: result
    });
  } catch (error) {
    // エラー時はアップロードされたファイルを削除
    if (req.file && req.file.path) {
      try {
        const fs = require('fs');
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('ファイル削除エラー:', unlinkError);
      }
    }
    next(error);
  }
};

/**
 * ユーザーログイン
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'メールアドレスとパスワードを入力してください'
      });
    }

    const result = await authService.login(email, password);

    res.json({
      message: 'ログインに成功しました',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 現在のユーザー情報を取得
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await authService.getCurrentUser(userId);

    res.json({
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * パスワードリセットメールを送信
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'メールアドレスを入力してください'
      });
    }

    const result = await authService.forgotPassword(email);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * パスワードをリセット
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'トークンと新しいパスワードが必要です'
      });
    }

    const result = await authService.resetPassword(token, newPassword);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword
};

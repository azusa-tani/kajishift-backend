/**
 * 認証サービス
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/database');
const { validateEmail, validatePassword } = require('../utils/validators');
const emailService = require('./emailService');

/**
 * ユーザー登録
 */
const register = async (userData) => {
  const { 
    email, 
    password, 
    name, 
    phone, 
    role = 'CUSTOMER', 
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
  } = userData;

  // バリデーション
  if (!validateEmail(email)) {
    throw new Error('有効なメールアドレスを入力してください');
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.message);
  }

  // メールアドレスの重複チェック
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error('このメールアドレスは既に登録されています');
  }

  // パスワードをハッシュ化
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // ユーザー作成データを構築
  const userDataToCreate = {
    email,
    password: hashedPassword,
    name,
    phone,
    role,
    address,
    status: 'ACTIVE'
  };

  // ワーカーの場合、追加フィールドを設定
  if (role === 'WORKER') {
    userDataToCreate.bio = bio || null;
    userDataToCreate.hourlyRate = hourlyRate ? parseInt(hourlyRate) : null;
    userDataToCreate.bankName = bankName || null;
    userDataToCreate.branchName = branchName || null;
    userDataToCreate.accountType = accountType || null;
    userDataToCreate.accountNumber = accountNumber || null;
    userDataToCreate.accountName = accountName || null;
    userDataToCreate.idDocumentUrl = idDocumentUrl || null;
    // ワーカーは承認待ち状態で作成
    userDataToCreate.approvalStatus = 'PENDING';
  }

  // ユーザーを作成
  const user = await prisma.user.create({
    data: userDataToCreate,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      approvalStatus: true,
      createdAt: true
    }
  });

  // JWTトークンを生成
  const token = generateToken(user);

  return {
    user,
    token
  };
};

/**
 * ユーザーログイン
 */
const login = async (email, password) => {
  // バリデーション
  if (!validateEmail(email)) {
    throw new Error('有効なメールアドレスを入力してください');
  }

  if (!password) {
    throw new Error('パスワードを入力してください');
  }

  // ユーザーを検索
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error('メールアドレスまたはパスワードが正しくありません');
  }

  // アカウントステータスのチェック
  if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
    throw new Error('このアカウントは利用できません');
  }

  // パスワードの検証
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('メールアドレスまたはパスワードが正しくありません');
  }

  // JWTトークンを生成
  const token = generateToken(user);

  // パスワードを除いたユーザー情報を返す
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token
  };
};

/**
 * JWTトークンを生成
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn
  });
};

/**
 * 現在のユーザー情報を取得
 */
const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      address: true,
      bio: true,
      hourlyRate: true,
      rating: true,
      reviewCount: true,
      approvalStatus: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new Error('ユーザーが見つかりません');
  }

  return user;
};

/**
 * パスワードリセットメールを送信
 * @param {string} email - メールアドレス
 */
const forgotPassword = async (email) => {
  // バリデーション
  if (!validateEmail(email)) {
    throw new Error('有効なメールアドレスを入力してください');
  }

  // ユーザーを検索
  const user = await prisma.user.findUnique({
    where: { email }
  });

  // セキュリティのため、ユーザーが存在しない場合でも成功メッセージを返す
  if (!user) {
    // 実際にはメールを送信しないが、エラーは返さない（セキュリティ対策）
    return { message: 'パスワードリセットメールを送信しました' };
  }

  // 既存のトークンを削除（ある場合）
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id }
  });

  // 新しいトークンを生成
  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24時間有効

  // トークンをデータベースに保存
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt
    }
  });

  // メールを送信
  try {
    await emailService.sendPasswordResetEmail(user.email, token, user.name);
  } catch (error) {
    // メール送信に失敗した場合、トークンを削除
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    });
    throw new Error('メールの送信に失敗しました。しばらくしてから再度お試しください。');
  }

  return { message: 'パスワードリセットメールを送信しました' };
};

/**
 * パスワードをリセット
 * @param {string} token - パスワードリセットトークン
 * @param {string} newPassword - 新しいパスワード
 */
const resetPassword = async (token, newPassword) => {
  // バリデーション
  if (!token) {
    throw new Error('トークンが必要です');
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.message);
  }

  // トークンを検索
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!resetToken) {
    throw new Error('無効なトークンです');
  }

  // 有効期限のチェック
  if (new Date() > resetToken.expiresAt) {
    // 期限切れのトークンを削除
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id }
    });
    throw new Error('トークンの有効期限が切れています。再度パスワードリセットをリクエストしてください。');
  }

  // パスワードをハッシュ化
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  // パスワードを更新
  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { password: hashedPassword }
  });

  // 使用済みのトークンを削除
  await prisma.passwordResetToken.delete({
    where: { id: resetToken.id }
  });

  return { message: 'パスワードをリセットしました' };
};

module.exports = {
  register,
  login,
  getCurrentUser,
  forgotPassword,
  resetPassword
};

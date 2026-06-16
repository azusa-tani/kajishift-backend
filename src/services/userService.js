/**
 * ユーザー管理サービス
 */

const prisma = require('../config/database');
const bcrypt = require('bcrypt');
const { validateEmail, validatePassword } = require('../utils/validators');

const httpError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const BANK_ACCOUNT_FIELDS = [
  'bankName',
  'branchName',
  'accountType',
  'accountNumber',
  'accountName',
  'accountHolder'
];

const normalizeUserResponse = (user) => {
  if (!user) return user;
  const { password, ...safeUser } = user;
  let notificationPrefs = safeUser.notificationPrefs;
  if (notificationPrefs != null) {
    try {
      notificationPrefs = normalizeNotificationPrefs(notificationPrefs);
    } catch {
      notificationPrefs = normalizeNotificationPrefs(null);
    }
  } else {
    notificationPrefs = normalizeNotificationPrefs(null);
  }
  return { ...safeUser, notificationPrefs };
};

const withoutBankAccountFields = (user) => {
  if (!user) return user;
  const safeUser = { ...user };
  for (const field of BANK_ACCOUNT_FIELDS) {
    delete safeUser[field];
  }
  return safeUser;
};

/**
 * 通知プリファレンス（JSON v1）を正規化
 * @param {unknown} raw
 * @returns {{ v: 1, emailBookings: boolean, emailMessages: boolean, emailSystem: boolean }}
 */
function normalizeNotificationPrefs(raw) {
  const defaults = { v: 1, emailBookings: true, emailMessages: true, emailSystem: true };
  if (raw == null) {
    return { ...defaults };
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('通知設定の形式が不正です');
  }
  const o = raw;
  if (o.v !== 1) {
    throw new Error('通知設定のバージョンが不正です');
  }
  const out = { v: 1 };
  for (const k of ['emailBookings', 'emailMessages', 'emailSystem']) {
    if (o[k] !== undefined) {
      if (typeof o[k] !== 'boolean') {
        throw new Error(`通知設定「${k}」は真偽値である必要があります`);
      }
      out[k] = o[k];
    } else {
      out[k] = defaults[k];
    }
  }
  return out;
}

/**
 * ユーザー情報を取得
 */
const getUserById = async (userId) => {
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
      serviceAreaText: true,
      availabilityText: true,
      bankName: true,
      branchName: true,
      accountType: true,
      accountNumber: true,
      accountName: true,
      notificationPrefs: true,
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

  return normalizeUserResponse(user);
};

/**
 * リクエストユーザーの権限に応じてユーザー詳細を取得
 */
const getUserByIdForRequester = async (targetUserId, requester) => {
  if (!requester || !requester.id || !requester.role) {
    throw httpError('ユーザー情報を取得する権限がありません', 403);
  }

  const isSelf = requester.id === targetUserId;
  const isAdmin = requester.role === 'ADMIN';
  if (!isSelf && !isAdmin) {
    throw httpError('他のユーザー情報を取得する権限がありません', 403);
  }

  const user = await getUserById(targetUserId);
  return isSelf ? user : withoutBankAccountFields(user);
};

/**
 * 自分の情報を更新
 */
const updateMe = async (userId, updateData) => {
  const { name, email, phone, address, notificationPrefs } = updateData;

  const updateFields = {};

  if (name !== undefined) {
    if (!name || name.trim().length === 0) {
      throw new Error('名前は必須です');
    }
    updateFields.name = name.trim();
  }

  if (email !== undefined) {
    const trimmed = email == null ? '' : String(email).trim();
    if (!trimmed) {
      throw new Error('メールアドレスは必須です');
    }
    if (!validateEmail(trimmed)) {
      throw new Error('メールアドレスの形式が正しくありません');
    }
    const taken = await prisma.user.findFirst({
      where: { email: trimmed, id: { not: userId } }
    });
    if (taken) {
      throw new Error('このメールアドレスは既に使用されています');
    }
    updateFields.email = trimmed;
  }

  if (phone !== undefined) {
    updateFields.phone = phone || null;
  }

  if (address !== undefined) {
    updateFields.address = address || null;
  }

  if (notificationPrefs !== undefined) {
    if (notificationPrefs === null) {
      updateFields.notificationPrefs = null;
    } else {
      updateFields.notificationPrefs = normalizeNotificationPrefs(notificationPrefs);
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return getUserById(userId);
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateFields
  });

  return getUserById(userId);
};

/**
 * ログイン中のユーザーが現在のパスワードを確認したうえでパスワードを変更
 * @param {string} userId
 * @param {{ currentPassword: string, newPassword: string }} payload
 */
const changePassword = async (userId, payload) => {
  const currentPassword = payload.currentPassword;
  const newPassword = payload.newPassword;
  if (!currentPassword || !newPassword) {
    throw new Error('現在のパスワードと新しいパスワードを入力してください');
  }
  const pwCheck = validatePassword(newPassword);
  if (!pwCheck.valid) {
    throw new Error(pwCheck.message);
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true }
  });
  if (!user) {
    throw new Error('ユーザーが見つかりません');
  }
  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) {
    throw new Error('現在のパスワードが正しくありません');
  }
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });
  return { message: 'パスワードを変更しました' };
};

module.exports = {
  getUserById,
  getUserByIdForRequester,
  updateMe,
  changePassword
};

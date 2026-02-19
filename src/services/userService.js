/**
 * ユーザー管理サービス
 */

const prisma = require('../config/database');
const bcrypt = require('bcrypt');
const { validateEmail, validatePassword } = require('../utils/validators');

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
 * 自分の情報を更新
 */
const updateMe = async (userId, updateData) => {
  const { name, phone, address, password } = updateData;

  const updateFields = {};

  if (name !== undefined) {
    if (!name || name.trim().length === 0) {
      throw new Error('名前は必須です');
    }
    updateFields.name = name.trim();
  }

  if (phone !== undefined) {
    updateFields.phone = phone || null;
  }

  if (address !== undefined) {
    updateFields.address = address || null;
  }

  if (password !== undefined) {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    updateFields.password = await bcrypt.hash(password, saltRounds);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateFields,
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

  return user;
};

/**
 * ワーカーのプロフィールを更新
 */
const updateWorkerProfile = async (userId, updateData) => {
  const { bio, hourlyRate } = updateData;

  // ユーザーがワーカーか確認
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (!user) {
    throw new Error('ユーザーが見つかりません');
  }

  if (user.role !== 'WORKER') {
    throw new Error('ワーカーのみプロフィールを更新できます');
  }

  const updateFields = {};

  if (bio !== undefined) {
    updateFields.bio = bio || null;
  }

  if (hourlyRate !== undefined) {
    if (hourlyRate !== null && (isNaN(hourlyRate) || hourlyRate < 0)) {
      throw new Error('時給は0以上の数値である必要があります');
    }
    updateFields.hourlyRate = hourlyRate || null;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateFields,
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

  return updatedUser;
};

module.exports = {
  getUserById,
  updateMe,
  updateWorkerProfile
};

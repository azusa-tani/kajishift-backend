/**
 * カード管理サービス
 */

const prisma = require('../config/database');

/**
 * カード一覧を取得
 * @param {string} userId - ユーザーID
 */
const getCards = async (userId) => {
  const cards = await prisma.creditCard.findMany({
    where: {
      userId,
      isActive: true
    },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  return cards;
};

/**
 * カードを追加
 * @param {string} userId - ユーザーID
 * @param {object} cardData - カードデータ
 */
const addCard = async (userId, cardData) => {
  const { last4, brand, expiryMonth, expiryYear, cardholderName, token } = cardData;

  // 必須フィールドのチェック
  if (!last4 || !brand || !expiryMonth || !expiryYear || !cardholderName) {
    throw new Error('カード情報が不完全です');
  }

  // 有効期限のバリデーション
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
    throw new Error('有効期限が切れています');
  }

  // デフォルトカードを設定する場合、他のカードのデフォルトフラグを解除
  let isDefault = cardData.isDefault || false;
  if (isDefault) {
    await prisma.creditCard.updateMany({
      where: {
        userId,
        isDefault: true
      },
      data: {
        isDefault: false
      }
    });
  } else {
    // 最初のカードは自動的にデフォルトにする
    const existingCards = await prisma.creditCard.count({
      where: {
        userId,
        isActive: true
      }
    });
    if (existingCards === 0) {
      isDefault = true;
    }
  }

  // カードを作成
  const card = await prisma.creditCard.create({
    data: {
      userId,
      last4,
      brand,
      expiryMonth: parseInt(expiryMonth),
      expiryYear: parseInt(expiryYear),
      cardholderName,
      isDefault,
      token: token || null
    }
  });

  return card;
};

/**
 * カードを更新
 * @param {string} cardId - カードID
 * @param {string} userId - ユーザーID（権限チェック用）
 * @param {object} updateData - 更新データ
 */
const updateCard = async (cardId, userId, updateData) => {
  // カードの存在確認と権限チェック
  const card = await prisma.creditCard.findUnique({
    where: { id: cardId }
  });

  if (!card) {
    throw new Error('カードが見つかりません');
  }

  if (card.userId !== userId) {
    throw new Error('このカードを更新する権限がありません');
  }

  // デフォルトカードを設定する場合、他のカードのデフォルトフラグを解除
  if (updateData.isDefault === true) {
    await prisma.creditCard.updateMany({
      where: {
        userId,
        id: { not: cardId },
        isDefault: true
      },
      data: {
        isDefault: false
      }
    });
  }

  // カードを更新
  const updatedCard = await prisma.creditCard.update({
    where: { id: cardId },
    data: {
      ...(updateData.expiryMonth && { expiryMonth: parseInt(updateData.expiryMonth) }),
      ...(updateData.expiryYear && { expiryYear: parseInt(updateData.expiryYear) }),
      ...(updateData.cardholderName && { cardholderName: updateData.cardholderName }),
      ...(updateData.isDefault !== undefined && { isDefault: updateData.isDefault }),
      ...(updateData.isActive !== undefined && { isActive: updateData.isActive })
    }
  });

  return updatedCard;
};

/**
 * カードを削除
 * @param {string} cardId - カードID
 * @param {string} userId - ユーザーID（権限チェック用）
 */
const deleteCard = async (cardId, userId) => {
  // カードの存在確認と権限チェック
  const card = await prisma.creditCard.findUnique({
    where: { id: cardId }
  });

  if (!card) {
    throw new Error('カードが見つかりません');
  }

  if (card.userId !== userId) {
    throw new Error('このカードを削除する権限がありません');
  }

  // カードを削除（物理削除ではなく論理削除）
  await prisma.creditCard.update({
    where: { id: cardId },
    data: {
      isActive: false
    }
  });

  // 削除したカードがデフォルトだった場合、他のカードをデフォルトにする
  if (card.isDefault) {
    const firstCard = await prisma.creditCard.findFirst({
      where: {
        userId,
        isActive: true,
        id: { not: cardId }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (firstCard) {
      await prisma.creditCard.update({
        where: { id: firstCard.id },
        data: { isDefault: true }
      });
    }
  }

  return { message: 'カードを削除しました' };
};

/**
 * カード番号からブランドを判定
 * @param {string} cardNumber - カード番号（数字のみ）
 * @returns {string} カードブランド
 */
const detectCardBrand = (cardNumber) => {
  const number = cardNumber.replace(/\s/g, '');
  
  if (/^4/.test(number)) {
    return 'visa';
  } else if (/^5[1-5]/.test(number)) {
    return 'mastercard';
  } else if (/^3[47]/.test(number)) {
    return 'amex';
  } else if (/^35/.test(number)) {
    return 'jcb';
  } else if (/^6011|^65/.test(number)) {
    return 'discover';
  } else {
    return 'unknown';
  }
};

/**
 * カード番号の下4桁を取得
 * @param {string} cardNumber - カード番号
 * @returns {string} 下4桁
 */
const getLast4 = (cardNumber) => {
  const number = cardNumber.replace(/\s/g, '');
  return number.slice(-4);
};

module.exports = {
  getCards,
  addCard,
  updateCard,
  deleteCard,
  detectCardBrand,
  getLast4
};

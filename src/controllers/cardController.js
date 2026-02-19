/**
 * カード管理コントローラー
 */

const cardService = require('../services/cardService');

/**
 * カード一覧を取得
 * GET /api/cards
 */
const getCards = async (req, res, next) => {
  try {
    // 顧客のみカードを管理可能
    if (req.user.role !== 'CUSTOMER') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'カードを管理できるのは顧客のみです'
      });
    }

    const userId = req.user.id;
    const cards = await cardService.getCards(userId);

    res.json({
      data: cards
    });
  } catch (error) {
    next(error);
  }
};

/**
 * カードを追加
 * POST /api/cards
 */
const addCard = async (req, res, next) => {
  try {
    // 顧客のみカードを追加可能
    if (req.user.role !== 'CUSTOMER') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'カードを追加できるのは顧客のみです'
      });
    }

    const userId = req.user.id;
    const { cardNumber, expiryMonth, expiryYear, cardholderName, securityCode, isDefault } = req.body;

    // 必須フィールドのチェック
    if (!cardNumber || !expiryMonth || !expiryYear || !cardholderName) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'カード番号、有効期限、カード名義人は必須です'
      });
    }

    // カード番号のバリデーション（数字のみ、13-19桁）
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleanCardNumber)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'カード番号が無効です'
      });
    }

    // セキュリティコードのバリデーション（実際の実装では使用しないが、バリデーションのみ）
    if (securityCode && !/^\d{3,4}$/.test(securityCode)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'セキュリティコードが無効です'
      });
    }

    // カードブランドを判定
    const brand = cardService.detectCardBrand(cleanCardNumber);
    const last4 = cardService.getLast4(cleanCardNumber);

    // カードを追加
    const card = await cardService.addCard(userId, {
      last4,
      brand,
      expiryMonth: parseInt(expiryMonth),
      expiryYear: parseInt(expiryYear),
      cardholderName,
      isDefault: isDefault || false,
      token: null // 実際の実装では外部決済システムのトークンを使用
    });

    res.status(201).json({
      message: 'カードを追加しました',
      data: card
    });
  } catch (error) {
    next(error);
  }
};

/**
 * カードを更新
 * PUT /api/cards/:id
 */
const updateCard = async (req, res, next) => {
  try {
    // 顧客のみカードを更新可能
    if (req.user.role !== 'CUSTOMER') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'カードを更新できるのは顧客のみです'
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const card = await cardService.updateCard(id, userId, updateData);

    res.json({
      message: 'カードを更新しました',
      data: card
    });
  } catch (error) {
    next(error);
  }
};

/**
 * カードを削除
 * DELETE /api/cards/:id
 */
const deleteCard = async (req, res, next) => {
  try {
    // 顧客のみカードを削除可能
    if (req.user.role !== 'CUSTOMER') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'カードを削除できるのは顧客のみです'
      });
    }

    const { id } = req.params;
    const userId = req.user.id;

    await cardService.deleteCard(id, userId);

    res.json({
      message: 'カードを削除しました'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCards,
  addCard,
  updateCard,
  deleteCard
};

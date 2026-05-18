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

const createSetupIntent = async (req, res, next) => {
  try {
    if (req.user.role !== 'CUSTOMER') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'カードを管理できるのは顧客のみです'
      });
    }

    const result = await cardService.createSetupIntent(req.user.id);

    res.status(201).json({
      message: 'カード登録Intentを作成しました',
      data: result
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

    if (req.body.cardNumber || req.body.securityCode) {
      return res.status(410).json({
        error: 'Gone',
        message: 'カード番号をAPIへ直接送信する方式は廃止されました。Stripe PaymentMethodを使用してください。'
      });
    }

    const userId = req.user.id;
    const { paymentMethodId, isDefault } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Stripe PaymentMethod IDは必須です'
      });
    }

    // カードを追加
    const card = await cardService.addCardFromPaymentMethod(userId, paymentMethodId, isDefault || false);

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
  createSetupIntent,
  addCard,
  updateCard,
  deleteCard
};

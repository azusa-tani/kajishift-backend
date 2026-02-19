/**
 * 決済管理コントローラー
 */

const paymentService = require('../services/paymentService');
const receiptService = require('../services/receiptService');

/**
 * 決済履歴を取得
 * GET /api/payments
 */
const getPayments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const filters = {
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await paymentService.getPayments(userId, userRole, filters);

    res.json({
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 決済を処理
 * POST /api/payments
 */
const processPayment = async (req, res, next) => {
  try {
    // 顧客のみ決済可能
    if (req.user.role !== 'CUSTOMER') {
      return res.status(403).json({
        error: 'Forbidden',
        message: '決済を実行できるのは顧客のみです'
      });
    }

    const { bookingId, paymentMethod, transactionId } = req.body;
    const userId = req.user.id;

    if (!bookingId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '予約IDは必須です'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '決済方法は必須です'
      });
    }

    const payment = await paymentService.processPayment(bookingId, userId, paymentMethod, transactionId);

    res.status(201).json({
      message: '決済が完了しました',
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 領収書をダウンロード
 * GET /api/payments/:id/receipt
 */
const downloadReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 領収書PDFを生成
    const pdfBuffer = await receiptService.generateReceiptPDF(id, userId);

    // PDFレスポンスを返す
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${id.substring(0, 8)}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayments,
  processPayment,
  downloadReceipt
};

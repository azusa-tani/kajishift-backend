const { getOperationStatus, isOperationBlocked } = require('../config/operationMode');

const OPERATION_LABELS = {
  registerUser: 'ユーザー登録',
  createBooking: '新規予約',
  bookingWrite: '予約更新',
  createPaymentIntent: '決済',
  createSetupIntent: 'カード登録準備',
  cardWrite: 'カード管理',
  createReview: 'レビュー投稿',
  createSupportTicket: '問い合わせ作成',
  sendMessage: 'メッセージ送信',
  uploadFile: 'ファイルアップロード',
  deleteFile: 'ファイル削除',
  favoriteWrite: 'お気に入り管理',
  profileWrite: 'プロフィール更新',
  notificationWrite: '通知更新',
  workerAvailabilityWrite: '利用不可枠更新',
  adminWrite: '管理者更新'
};

const requireOperation = (operation) => {
  return async (req, res, next) => {
    try {
      if (!(await isOperationBlocked(operation))) {
        return next();
      }

      const status = await getOperationStatus();
      if (status.resumeAt) {
        const retryAfterSeconds = Math.max(
          0,
          Math.ceil((new Date(status.resumeAt).getTime() - Date.now()) / 1000)
        );
        if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
          res.set('Retry-After', String(retryAfterSeconds));
        }
      }

      return res.status(503).json({
        error: 'Service Temporarily Unavailable',
        message: status.message,
        code: 'OPERATION_PAUSED',
        operation,
        operationLabel: OPERATION_LABELS[operation] || operation,
        mode: status.mode,
        reason: status.reason,
        trigger: status.trigger,
        severity: status.severity,
        resumeAt: status.resumeAt
      });
    } catch (error) {
      return next(error);
    }
  };
};

const requireOperationForMethods = (operation, methods = ['POST', 'PUT', 'PATCH', 'DELETE']) => {
  const guard = requireOperation(operation);
  return (req, res, next) => {
    if (!methods.includes(req.method)) {
      return next();
    }
    return guard(req, res, next);
  };
};

module.exports = {
  requireOperation,
  requireOperationForMethods
};

const { getOperationStatus, setOperationMode, VALID_OPERATION_MODES } = require('../config/operationMode');
const paymentReconciliationService = require('../services/paymentReconciliationService');
const opsAutoPauseService = require('../services/opsAutoPauseService');

const getStatus = async (req, res, next) => {
  try {
    const status = await getOperationStatus();
    res.json({
      data: {
        operation: status,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

const setMode = async (req, res, next) => {
  try {
    const { mode, reason, message, resumeAt, severity = 'warning' } = req.body || {};
    if (!VALID_OPERATION_MODES.includes(mode)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `modeは次のいずれかにしてください: ${VALID_OPERATION_MODES.join(', ')}`
      });
    }

    const status = await setOperationMode({
      mode,
      reason: reason || message || 'admin operation mode change',
      message,
      resumeAt,
      severity,
      trigger: 'manual:admin_api',
      createdBy: req.user ? req.user.id : null,
      metadata: {
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.json({
      message: '運用モードを更新しました',
      data: status
    });
  } catch (error) {
    next(error);
  }
};

const runReconciliation = async (req, res, next) => {
  try {
    const result = await paymentReconciliationService.runPaymentReconciliation();
    res.json({
      message: '決済整合性チェックを実行しました',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const evaluateCircuitBreakers = async (req, res, next) => {
  try {
    const result = await opsAutoPauseService.evaluateCircuitBreakers();
    res.json({
      message: 'サーキットブレーカー評価を実行しました',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStatus,
  setMode,
  runReconciliation,
  evaluateCircuitBreakers
};

/**
 * エラーハンドリングミドルウェア
 */

const logger = require('../config/logger');
const opsAutoPauseService = require('../services/opsAutoPauseService');

const shouldRecordApi5xx = (req, status) => {
  if (status < 500) return false;
  const path = req.originalUrl || req.url || '';
  return !path.startsWith('/api/public/status') && !path.startsWith('/api/health');
};

const errorHandler = (err, req, res, next) => {
  // エラーログを記録
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });

  // バリデーションエラー
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.errors
    });
  }

  // JWT認証エラー
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Token expired'
    });
  }

  // デフォルトエラー
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (shouldRecordApi5xx(req, status)) {
    opsAutoPauseService.recordOpsEvent({
      type: 'api_5xx_error',
      severity: 'critical',
      source: 'error_handler',
      fingerprint: `api_5xx_error:${req.method}:${req.route ? req.route.path : req.path}`,
      message: `API 5xxエラーを検知しました: ${message}`,
      metadata: {
        method: req.method,
        url: req.originalUrl || req.url,
        status,
        code: err.code || null
      }
    }).then(() => opsAutoPauseService.evaluateMaintenanceCircuitBreaker()).catch((eventError) => {
      logger.error('Failed to record API 5xx ops event', { error: eventError.message });
    });
  }

  res.status(status).json({
    error: message,
    ...(err.code && { code: err.code }),
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;

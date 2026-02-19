/**
 * リクエストロギングミドルウェア
 */

const logger = require('../config/logger');

/**
 * HTTPリクエストロギングミドルウェア
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // レスポンス終了時にログを記録
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    };

    // ステータスコードに応じてログレベルを変更
    if (res.statusCode >= 500) {
      logger.error('HTTP Request', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};

module.exports = requestLogger;

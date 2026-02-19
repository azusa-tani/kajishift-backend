/**
 * セキュリティミドルウェア
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Helmet設定（セキュリティヘッダー）
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false // Swagger UI用
});

// 一般的なAPIレート制限（15分間に100リクエスト）
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100リクエスト
  message: {
    error: 'Too Many Requests',
    message: 'リクエストが多すぎます。しばらくしてから再度お試しください。'
  },
  standardHeaders: true, // `RateLimit-*` ヘッダーを返す
  legacyHeaders: false // `X-RateLimit-*` ヘッダーを無効化
});

// 認証エンドポイント用の厳格なレート制限（15分間に5リクエスト）
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 5, // 最大5リクエスト
  message: {
    error: 'Too Many Requests',
    message: '認証リクエストが多すぎます。しばらくしてから再度お試しください。'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // 成功したリクエストはカウントしない
});

// パスワードリセット用のレート制限（1時間に3リクエスト）
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 3, // 最大3リクエスト
  message: {
    error: 'Too Many Requests',
    message: 'パスワードリセットリクエストが多すぎます。1時間後に再度お試しください。'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  helmetMiddleware,
  generalLimiter,
  authLimiter,
  passwordResetLimiter
};

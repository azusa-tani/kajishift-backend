/**
 * セキュリティミドルウェア
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const isProduction = process.env.NODE_ENV === 'production';

/** DISABLE_RATE_LIMIT=1|true のとき全レート制限をスキップ（ローカル負荷試験・緊急時） */
function isRateLimitGloballyDisabled() {
  const v = String(process.env.DISABLE_RATE_LIMIT || '').toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

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

// 一般的な API レート制限
// 本番: 既定 15 分 / 100 件（RATE_LIMIT_MAX で上書き可）
// 非本番: 既定 15 分 / 20000 件（開発テストで 429 を避ける）
const generalWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const generalMaxProd = Number(process.env.RATE_LIMIT_MAX) || 100;
const generalMaxDev = Number(process.env.RATE_LIMIT_MAX_DEV) || 20000;

const generalLimiter = rateLimit({
  windowMs: generalWindowMs,
  max: isProduction ? generalMaxProd : generalMaxDev,
  message: {
    error: 'Too Many Requests',
    message: 'リクエストが多すぎます。しばらくしてから再度お試しください。'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isRateLimitGloballyDisabled()
});

// 認証エンドポイント用（ログイン試行のブルートフォース対策）
// 本番: 15 分 / 5 件（成功は skipSuccessfulRequests でカウント除外）
// 非本番: 15 分 / 200 件（開発の再ログインで 429 を避ける）
const authMaxProd = Number(process.env.RATE_LIMIT_AUTH_MAX) || 5;
const authMaxDev = Number(process.env.RATE_LIMIT_AUTH_MAX_DEV) || 200;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? authMaxProd : authMaxDev,
  message: {
    error: 'Too Many Requests',
    message: '認証リクエストが多すぎます。しばらくしてから再度お試しください。'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => isRateLimitGloballyDisabled()
});

// パスワードリセット用（本番厳しめ／非本番は緩め）
const passwordResetMaxProd = Number(process.env.RATE_LIMIT_PASSWORD_RESET_MAX) || 3;
const passwordResetMaxDev = Number(process.env.RATE_LIMIT_PASSWORD_RESET_MAX_DEV) || 100;

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? passwordResetMaxProd : passwordResetMaxDev,
  message: {
    error: 'Too Many Requests',
    message: 'パスワードリセットリクエストが多すぎます。1時間後に再度お試しください。'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isRateLimitGloballyDisabled()
});

module.exports = {
  helmetMiddleware,
  generalLimiter,
  authLimiter,
  passwordResetLimiter
};

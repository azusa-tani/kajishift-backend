const express = require('express');
const http = require('http');
const cors = require('cors');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

// 環境変数のバリデーション
const { validateEnv } = require('./config/env');
try {
  validateEnv();
} catch (error) {
  console.error('❌ 環境変数エラー:', error.message);
  process.exit(1);
}

// ロガーの初期化
const logger = require('./config/logger');
logger.info('🚀 KAJISHIFT API Server 起動中...');

const app = express();
const PORT = process.env.PORT || 3000;

// Swagger設定
const swaggerSpec = require('./config/swagger');

// セキュリティミドルウェア
const {
  helmetMiddleware,
  generalLimiter,
  authLimiter,
  passwordResetLimiter
} = require('./middleware/security');

// リクエストロギングミドルウェア
const requestLogger = require('./middleware/requestLogger');

// セキュリティヘッダー（Helmet）
app.use(helmetMiddleware);

// レスポンス圧縮
app.use(compression());

// trust proxy設定（Renderなどのプロキシ経由のリクエストに対応）
app.set('trust proxy', true);

// CORS設定
// CORS_ORIGINが複数のURLをカンマ区切りで指定されている場合は配列に変換
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5500'];

app.use(cors({
  origin: (origin, callback) => {
    // オリジンが未指定（同一オリジンリクエスト）または許可リストに含まれている場合
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  credentials: true
}));

// ボディパーサー
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// リクエストロギング
app.use(requestLogger);

// 一般的なレート制限（すべてのルートに適用）
app.use('/api', generalLimiter);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'KAJISHIFT API Documentation'
}));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: ヘルスチェック
 *     tags: [その他]
 *     responses:
 *       200:
 *         description: サーバーが正常に動作しています
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: KAJISHIFT API is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'KAJISHIFT API is running',
    timestamp: new Date().toISOString()
  });
});

// 静的ファイルの配信（アップロードされたファイル用）
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ルート
app.use('/api/auth', require('./routes/auth'));

// その他のルート
app.use('/api/users', require('./routes/users'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/workers', require('./routes/workers'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/support', require('./routes/support'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/cards', require('./routes/cards'));

// 404ハンドラー
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// エラーハンドラー
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// HTTPサーバーを作成（Socket.io用）
const server = http.createServer(app);

// Socket.ioを初期化
const { initializeSocket } = require('./config/socket');
initializeSocket(server);

// サーバー起動
server.listen(PORT, () => {
  logger.info(`🚀 KAJISHIFT API Server running on http://localhost:${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  logger.info(`🔌 WebSocket (Socket.io) が有効です`);
  
  // 開発環境ではコンソールにも出力
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🚀 KAJISHIFT API Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`🔌 WebSocket (Socket.io) が有効です`);
  }
});

// 未処理のエラーをキャッチ
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

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

// リバースプロキシ（Railway / Render / Vercel 経由）でクライアント IP を正しく認識する
// 数値 1 = 先頭のプロキシ 1 ホップを信頼（express-rate-limit の IP 判定と整合）
app.set('trust proxy', 1);

// CORS設定
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://kajishift-frontend.vercel.app',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

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

/**
 * @swagger
 * /health/db:
 *   get:
 *     summary: データベース診断エンドポイント
 *     tags: [その他]
 *     responses:
 *       200:
 *         description: データベースの状態情報
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 database:
 *                   type: object
 *                 tables:
 *                   type: array
 *                 migrations:
 *                   type: object
 */
app.get('/api/health/db', async (req, res) => {
  const prisma = require('./config/database');
  const { PrismaClient } = require('@prisma/client');
  
  try {
    // データベース接続確認
    await prisma.$connect();
    
    // テーブル一覧を取得（PostgreSQL）
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    // マイグレーション履歴を取得
    let migrations = [];
    try {
      migrations = await prisma.$queryRaw`
        SELECT migration_name, finished_at, applied_steps_count
        FROM _prisma_migrations
        ORDER BY finished_at DESC;
      `;
    } catch (err) {
      // _prisma_migrationsテーブルが存在しない場合
      migrations = { error: 'Migration table not found', message: err.message };
    }
    
    // usersテーブルの存在確認とレコード数
    let userCount = null;
    let usersTableExists = false;
    let adminUser = null;
    try {
      userCount = await prisma.user.count();
      usersTableExists = true;
      
      // 管理者ユーザーの情報を取得
      try {
        adminUser = await prisma.user.findUnique({
          where: { email: 'admin@kajishift.com' },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true
          }
        });
        // 管理者ユーザーが見つからない場合
        if (!adminUser) {
          adminUser = { error: 'Admin user not found', email: 'admin@kajishift.com' };
        }
      } catch (err) {
        // エラーが発生した場合
        adminUser = { error: err.message, stack: err.stack };
      }
    } catch (err) {
      usersTableExists = false;
    }
    
    res.json({
      status: 'OK',
      database: {
        connected: true,
        usersTableExists: usersTableExists,
        userCount: userCount,
        adminUser: adminUser
      },
      tables: tables.map(t => t.table_name),
      migrations: migrations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// 静的ファイルの配信（アップロードされたファイル用）
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ルート
app.use('/api/auth', require('./routes/auth'));

const { authenticate, authorize } = require('./middleware/auth');
// ワーカー本人の利用不可（/workers/:id より前に登録して確実にマッチさせる）
app.use(
  '/api/workers/me/unavailable-slots',
  authenticate,
  authorize('WORKER'),
  require('./routes/workerUnavailableSlots')
);

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

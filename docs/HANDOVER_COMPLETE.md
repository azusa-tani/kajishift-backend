# KAJISHIFT バックエンドAPI 完全引継ぎドキュメント（統合版）

> **注意**: このドキュメントは、HANDOVER.md、HANDOVER_PROMPT.md、HANDOVER_PROMPT_ADDITIONAL_FEATURES.md、HANDOVER_PROMPT_REPORTS_AND_EMAIL.mdを統合した完全版です。古いファイルは削除済みです。

## 📋 プロジェクト概要

家事代行マッチングサービス「KAJISHIFT」のバックエンドAPIサーバーです。
- **技術スタック**: Node.js + Express.js + Prisma ORM + PostgreSQL
- **プロジェクトパス**: `C:\Users\谷口 梓\Desktop\kajishift-backend`
- **最終更新**: 2026年2月13日（お気に入り機能・検索機能強化完了時点）
- **プロジェクト状態**: 全60エンドポイント実装完了、Swaggerドキュメント生成完了、本番環境準備完了、リアルタイム通知機能実装完了、お気に入り機能実装完了、検索・フィルタリング機能強化完了

## 📦 現在の依存関係

### 本番依存関係
- `express`: ^4.18.2
- `cors`: ^2.8.5
- `dotenv`: ^16.3.1
- `bcrypt`: ^5.1.1
- `jsonwebtoken`: ^9.0.2
- `@prisma/client`: ^5.7.1
- `swagger-jsdoc`: ^6.2.8
- `swagger-ui-express`: ^5.0.0
- `multer`: ^2.0.2
- `nodemailer`: ^6.10.1 ✨ 新規追加（メール送信機能用）
- `uuid`: ^9.0.1 ✨ 新規追加（パスワードリセットトークン生成用）
- `helmet`: ^7.1.0 ✨ 新規追加（セキュリティヘッダー用）
- `express-rate-limit`: ^7.1.5 ✨ 新規追加（レート制限用）
- `express-validator`: ^7.0.1 ✨ 新規追加（入力値検証用）
- `winston`: ^3.11.0 ✨ 新規追加（ロギング用）
- `compression`: ^1.7.4 ✨ 新規追加（レスポンス圧縮用）
- `csv-writer`: ^1.6.0 ✨ 新規追加（CSVエクスポート用）
- `exceljs`: ^4.4.0 ✨ 新規追加（Excelエクスポート用）

### 開発依存関係
- `nodemon`: ^3.0.2
- `prisma`: ^5.7.1

## ✅ 実装完了状況

### データベース
- ✅ PostgreSQLデータベースセットアップ完了（Dockerコンテナ: `kajishift-postgres`、ポート5433）
- ✅ Prismaマイグレーション実行済み（全テーブル作成済み）
- ✅ `.env`ファイル設定済み

### 実装済みAPI（合計60エンドポイント）

#### 認証API（5個）
- ✅ `POST /api/auth/register` - ユーザー登録
- ✅ `POST /api/auth/login` - ログイン
- ✅ `GET /api/auth/me` - 現在のユーザー情報取得（認証必須）
- ✅ `POST /api/auth/forgot-password` - パスワードリセットメール送信（公開）✨ 新規実装
- ✅ `POST /api/auth/reset-password` - パスワードリセット（公開、トークン必要）✨ 新規実装

#### ユーザー管理API（3個）
- ✅ `GET /api/users/me` - 自分の情報取得（認証必須）
- ✅ `PUT /api/users/me` - 自分の情報更新（認証必須）
- ✅ `GET /api/users/:id` - ユーザー詳細取得（認証必須）

#### 予約管理API（5個）
- ✅ `GET /api/bookings` - 予約一覧取得・検索（認証必須、ページネーション対応、検索機能強化）✨ 機能拡張
- ✅ `POST /api/bookings` - 予約作成（認証必須、顧客のみ）
- ✅ `GET /api/bookings/:id` - 予約詳細取得（認証必須）
- ✅ `PUT /api/bookings/:id` - 予約更新（認証必須、ステータス更新可能）
- ✅ `DELETE /api/bookings/:id` - 予約キャンセル（認証必須）

#### ワーカー管理API（3個）
- ✅ `GET /api/workers` - ワーカー一覧取得・検索（公開、ページネーション対応、検索機能強化）✨ 機能拡張
- ✅ `GET /api/workers/:id` - ワーカー詳細取得（公開、レビュー情報含む）
- ✅ `PUT /api/workers/me` - ワーカープロフィール更新（認証必須）

#### レビューAPI（2個）
- ✅ `POST /api/reviews` - レビュー投稿（認証必須、依頼者のみ）
- ✅ `GET /api/reviews/:workerId` - ワーカーのレビュー一覧取得（公開、ページネーション対応）

#### チャットAPI（2個）
- ✅ `GET /api/messages/:bookingId` - メッセージ一覧取得（認証必須、ページネーション対応）
- ✅ `POST /api/messages` - メッセージ送信（認証必須）

#### 決済API（2個）
- ✅ `GET /api/payments` - 決済履歴取得（認証必須、ページネーション対応）
- ✅ `POST /api/payments` - 決済処理（認証必須、顧客のみ）

#### サポートAPI（3個）
- ✅ `GET /api/support` - 問い合わせ一覧取得（認証必須、ページネーション対応）
- ✅ `POST /api/support` - 問い合わせ作成（認証必須）
- ✅ `GET /api/support/:id` - 問い合わせ詳細取得（認証必須）

#### 管理者API（19個）
- ✅ `GET /api/admin/users` - ユーザー管理（管理者のみ、ページネーション対応）
- ✅ `GET /api/admin/workers` - ワーカー管理（管理者のみ、ページネーション対応）
- ✅ `PUT /api/admin/workers/:id/approve` - ワーカー承認（管理者のみ）
- ✅ `GET /api/admin/reports/bookings` - 予約レポート（管理者のみ）✨ 新規実装
- ✅ `GET /api/admin/reports/revenue` - 売上レポート（管理者のみ）✨ 新規実装
- ✅ `GET /api/admin/reports/users` - ユーザー統計レポート（管理者のみ）✨ 新規実装
- ✅ `GET /api/admin/reports/workers` - ワーカー統計レポート（管理者のみ）✨ 新規実装
- ✅ `GET /api/admin/reports/bookings/export/csv` - 予約レポートCSVエクスポート（管理者のみ）✨ 新規実装
- ✅ `GET /api/admin/reports/bookings/export/excel` - 予約レポートExcelエクスポート（管理者のみ）✨ 新規実装
- ✅ `GET /api/admin/reports/revenue/export/csv` - 売上レポートCSVエクスポート（管理者のみ）✨ 新規実装
- ✅ `GET /api/admin/reports/revenue/export/excel` - 売上レポートExcelエクスポート（管理者のみ）✨ 新規実装
- ✅ `GET /api/admin/reports/users/export/csv` - ユーザー統計レポートCSVエクスポート（管理者のみ）✨ 新規実装
- ✅ `GET /api/admin/reports/users/export/excel` - ユーザー統計レポートExcelエクスポート（管理者のみ）✨ 新規実装
- ✅ `GET /api/admin/reports/workers/export/csv` - ワーカー統計レポートCSVエクスポート（管理者のみ）✨ 新規実装
- ✅ `GET /api/admin/reports/workers/export/excel` - ワーカー統計レポートExcelエクスポート（管理者のみ）✨ 新規実装
- ✅ `POST /api/admin/notifications/system` - システム通知作成・送信（管理者のみ）✨ 新規実装
- ✅ `GET /api/admin/reports/chart/:reportType` - グラフ用データ取得（管理者のみ）✨ 新規実装
- ✅ `GET /api/admin/reports/comparison/:reportType` - 比較レポート取得（管理者のみ）✨ 新規実装
- ✅ `POST /api/admin/reports/custom` - カスタムレポート取得（管理者のみ）✨ 新規実装

#### 通知API（5個）✨ 新規実装
- ✅ `GET /api/notifications` - 通知一覧取得（認証必須、ページネーション対応）
- ✅ `GET /api/notifications/unread-count` - 未読通知数取得（認証必須）
- ✅ `PUT /api/notifications/read-all` - すべての通知を既読にする（認証必須）
- ✅ `PUT /api/notifications/:id/read` - 通知を既読にする（認証必須）
- ✅ `DELETE /api/notifications/:id` - 通知を削除（認証必須）

#### ファイルアップロードAPI（5個）✨ 新規実装
- ✅ `POST /api/upload` - ファイルアップロード（認証必須）
- ✅ `GET /api/upload` - ファイル一覧取得（認証必須、ページネーション対応）
- ✅ `GET /api/upload/:id` - ファイル情報取得（認証必須）
- ✅ `GET /api/upload/:id/download` - ファイルダウンロード（認証必須）
- ✅ `DELETE /api/upload/:id` - ファイル削除（認証必須）

#### お気に入りAPI（5個）✨ 新規実装
- ✅ `GET /api/favorites` - お気に入り一覧取得（認証必須、ページネーション対応）
- ✅ `POST /api/favorites` - お気に入り追加（認証必須）
- ✅ `DELETE /api/favorites/:id` - お気に入り削除（認証必須）
- ✅ `DELETE /api/favorites/worker/:workerId` - ワーカーIDでお気に入り削除（認証必須）
- ✅ `GET /api/favorites/check/:workerId` - お気に入りかどうかを確認（認証必須）

#### その他（1個）
- ✅ `GET /api/health` - ヘルスチェック

### APIドキュメント
- ✅ Swagger/OpenAPIドキュメント生成完了
- ✅ アクセスURL: `http://localhost:3000/api-docs`
- ✅ 全60エンドポイントのドキュメント化完了

## 📁 プロジェクト構造

```
kajishift-backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Prismaクライアント設定
│   │   ├── swagger.js           # Swagger設定
│   │   ├── env.js               # 環境変数バリデーション ✨ 新規追加
│   │   └── logger.js            # ロギング設定（Winston） ✨ 新規追加
│   ├── controllers/
│   │   ├── authController.js     # 認証コントローラー
│   │   ├── userController.js     # ユーザー管理コントローラー
│   │   ├── bookingController.js  # 予約管理コントローラー
│   │   ├── workerController.js   # ワーカー管理コントローラー
│   │   ├── reviewController.js  # レビュー管理コントローラー
│   │   ├── messageController.js # メッセージ管理コントローラー
│   │   ├── paymentController.js # 決済管理コントローラー
│   │   ├── supportController.js # サポート管理コントローラー
│   │   ├── adminController.js  # 管理者コントローラー
│   │   ├── notificationController.js # 通知管理コントローラー
│   │   └── uploadController.js # ファイルアップロードコントローラー
│   ├── middleware/
│   │   ├── auth.js               # JWT認証ミドルウェア
│   │   ├── errorHandler.js       # エラーハンドリング
│   │   ├── upload.js             # ファイルアップロードミドルウェア
│   │   ├── security.js           # セキュリティミドルウェア（Helmet、Rate Limit） ✨ 新規追加
│   │   └── requestLogger.js      # リクエストロギングミドルウェア ✨ 新規追加
│   ├── routes/
│   │   ├── auth.js               # 認証ルート
│   │   ├── users.js              # ユーザー管理ルート
│   │   ├── bookings.js            # 予約管理ルート
│   │   ├── workers.js             # ワーカー管理ルート
│   │   ├── reviews.js             # レビュー管理ルート
│   │   ├── messages.js            # メッセージ管理ルート
│   │   ├── payments.js            # 決済管理ルート
│   │   ├── support.js             # サポート管理ルート
│   │   ├── admin.js               # 管理者ルート
│   │   ├── notifications.js       # 通知管理ルート
│   │   └── upload.js              # ファイルアップロードルート
│   ├── services/
│   │   ├── authService.js         # 認証ビジネスロジック（パスワードリセット機能含む）
│   │   ├── userService.js         # ユーザー管理ビジネスロジック
│   │   ├── bookingService.js      # 予約管理ビジネスロジック
│   │   ├── workerService.js       # ワーカー管理ビジネスロジック
│   │   ├── reviewService.js       # レビュー管理ビジネスロジック
│   │   ├── messageService.js      # メッセージ管理ビジネスロジック
│   │   ├── paymentService.js      # 決済管理ビジネスロジック
│   │   ├── supportService.js     # サポート管理ビジネスロジック
│   │   ├── adminService.js        # 管理者ビジネスロジック（レポート機能含む）
│   │   ├── notificationService.js # 通知管理ビジネスロジック
│   │   ├── uploadService.js       # ファイルアップロードビジネスロジック
│   │   └── emailService.js        # メール送信ビジネスロジック ✨ 新規追加
│   ├── utils/
│   │   └── validators.js         # バリデーション関数
│   └── index.js                  # メインエントリーポイント
├── prisma/
│   └── schema.prisma             # Prismaスキーマ
├── uploads/                       # アップロードされたファイル（.gitignoreに追加済み）
├── logs/                          # ログファイル（.gitignoreに追加済み） ✨ 新規追加
├── docs/
│   ├── api-design.md             # API設計ドキュメント
│   ├── DATABASE_SETUP.md         # データベースセットアップガイド
│   ├── DEPLOYMENT.md              # デプロイメントガイド
│   ├── FRONTEND_INTEGRATION.md   # フロントエンド連携ガイド
│   ├── HANDOVER_COMPLETE.md       # 完全引継ぎドキュメント（このファイル）
│   ├── HANDOVER_PROMPT.md         # 引継ぎプロンプト
│   ├── INSTALL_PDFKIT.md         # PDF生成ライブラリインストールガイド
│   ├── INTEGRATION_STATUS.md     # 連携状況
│   ├── README_SEED.md            # テストデータ作成方法
│   ├── REMAINING_TASKS.md        # 残りのタスク一覧
│   └── TEST_PROCEDURE.md         # テスト手順書
├── scripts/
│   ├── seed.bat                  # テストデータ作成スクリプト（Windows）
│   ├── setup-database.ps1        # データベースセットアップスクリプト（Windows）
│   └── setup-database.sh         # データベースセットアップスクリプト（Linux/Mac）
├── tests/
│   ├── test-api.js               # APIテストスクリプト
│   ├── test-api.ps1              # APIテストスクリプト（PowerShell）
│   ├── test-socket.js            # Socket.ioテストスクリプト
│   └── check-database.js         # データベース確認スクリプト
├── ecosystem.config.js           # PM2設定ファイル ✨ 新規追加
├── .env.example                  # 環境変数テンプレート ✨ 新規追加
├── .env                          # 環境変数
└── package.json                  # 依存関係
```

## 🔧 環境設定

### データベース接続
- **Dockerコンテナ**: `kajishift-postgres`（ポート5433）
- **データベース名**: `kajishift`
- **接続URL**: `postgresql://postgres:password@localhost:5433/kajishift?schema=public`

### 環境変数（.env）

`.env.example`をコピーして`.env`ファイルを作成し、以下の設定を行ってください：

```env
# サーバー設定
PORT=3000
NODE_ENV=development

# データベース
DATABASE_URL="postgresql://postgres:password@localhost:5433/kajishift?schema=public"

# JWT認証
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# パスワードハッシュ
BCRYPT_ROUNDS=10

# CORS設定
CORS_ORIGIN=http://localhost:5500

# メール送信設定（SMTP）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@kajishift.com
FRONTEND_URL=http://localhost:5500

# ロギング設定
LOG_LEVEL=debug

# レート制限設定
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**重要**: 
- `DATABASE_URL` は実際のPostgreSQL接続情報に変更してください
- `JWT_SECRET` は本番環境では強力なランダム文字列（32文字以上）に変更してください
- `SMTP_USER` と `SMTP_PASS` は実際のSMTP認証情報に変更してください（Gmailを使用する場合はアプリパスワードが必要）

## 🚀 よく使うコマンド

```bash
# サーバー起動（開発モード、自動再起動）
npm run dev

# サーバー起動（本番モード）
npm start

# APIテスト実行
npm run test:api

# Prisma Studio起動（データベースGUI）
npm run prisma:studio

# Prismaクライアント生成
npm run prisma:generate

# マイグレーション実行
npm run prisma:migrate

# データベースセットアップ（一括実行）
npm run db:setup
```

## 🎨 コードスタイルとパターン

### 既存のコードパターン例

**サービス層の例** (`src/services/bookingService.js`):
```javascript
const prisma = require('../config/database');

const getBookings = async (userId, userRole, filters = {}) => {
  // ビジネスロジックを実装
  // エラーはthrow new Error()で投げる
  // データベース操作はPrismaを使用
};
```

**コントローラー層の例** (`src/controllers/bookingController.js`):
```javascript
const bookingService = require('../services/bookingService');

const getBookings = async (req, res, next) => {
  try {
    const result = await bookingService.getBookings(...);
    res.json({ data: result });
  } catch (error) {
    next(error); // エラーハンドラーに渡す
  }
};
```

**ルート層の例** (`src/routes/bookings.js`):
```javascript
const { authenticate } = require('../middleware/auth');
router.use(authenticate); // すべてのルートで認証が必要な場合
router.get('/', bookingController.getBookings);
```

**管理者専用ルートの例** (`src/routes/admin.js`):
```javascript
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);
router.use(authorize('ADMIN')); // 管理者のみアクセス可能
router.get('/users', adminController.getUsers);
```

**Swaggerアノテーションの例**:
```javascript
/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: 予約一覧取得
 *     tags: [予約]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
```

## 🔐 認証・認可の実装パターン

### 認証が必要なエンドポイント
```javascript
const { authenticate } = require('../middleware/auth');
router.get('/me', authenticate, controller.getMe);
```

### 管理者専用エンドポイント
```javascript
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);
router.use(authorize('ADMIN'));
router.get('/users', adminController.getUsers);
```

### ロールベースのアクセス制御（サービス層）
```javascript
if (userRole === 'CUSTOMER' && booking.customerId !== userId) {
  throw new Error('この予約にアクセスする権限がありません');
}
```

## 📊 ページネーションの実装パターン

既存のAPIは以下のパターンでページネーションを実装しています：

```javascript
const { page = 1, limit = 20 } = filters;
const skip = (parseInt(page) - 1) * parseInt(limit);

const [items, total] = await Promise.all([
  prisma.model.findMany({
    skip,
    take: parseInt(limit),
    // ...
  }),
  prisma.model.count({ where })
]);

return {
  items,
  pagination: {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / parseInt(limit))
  }
};
```

## ✅ 実装完了した機能

### 1. レポート機能API（管理者向け）✨ 実装完了
**実装日**: 2026年2月9日

**実装済みエンドポイント**:
- ✅ `GET /api/admin/reports/bookings` - 予約レポート（管理者のみ）
- ✅ `GET /api/admin/reports/revenue` - 売上レポート（管理者のみ）
- ✅ `GET /api/admin/reports/users` - ユーザー統計（管理者のみ）
- ✅ `GET /api/admin/reports/workers` - ワーカー統計（管理者のみ）

**実装内容**:
- 日付範囲でのフィルタリング（`startDate`, `endDate`クエリパラメータ）対応
- 集計データの計算（サマリー、日付別、月別など）
- グラフ用データの生成（時系列データ）
- パフォーマンス最適化（30回のDBクエリ → 1回に最適化）

**実装ファイル**:
- `src/services/adminService.js` - レポート関数を追加
- `src/controllers/adminController.js` - コントローラー関数を追加
- `src/routes/admin.js` - ルートを追加

### 1-1. レポート機能の拡張（CSV/Excelエクスポート）✨ 実装完了
**実装日**: 2026年2月9日

**実装済みエンドポイント**:
- ✅ `GET /api/admin/reports/bookings/export/csv` - 予約レポートCSVエクスポート（管理者のみ）
- ✅ `GET /api/admin/reports/bookings/export/excel` - 予約レポートExcelエクスポート（管理者のみ）
- ✅ `GET /api/admin/reports/revenue/export/csv` - 売上レポートCSVエクスポート（管理者のみ）
- ✅ `GET /api/admin/reports/revenue/export/excel` - 売上レポートExcelエクスポート（管理者のみ）
- ✅ `GET /api/admin/reports/users/export/csv` - ユーザー統計レポートCSVエクスポート（管理者のみ）
- ✅ `GET /api/admin/reports/users/export/excel` - ユーザー統計レポートExcelエクスポート（管理者のみ）
- ✅ `GET /api/admin/reports/workers/export/csv` - ワーカー統計レポートCSVエクスポート（管理者のみ）
- ✅ `GET /api/admin/reports/workers/export/excel` - ワーカー統計レポートExcelエクスポート（管理者のみ）

**実装内容**:
- CSV形式でのレポートエクスポート機能
- Excel形式でのレポートエクスポート機能（複数シート対応）
- 日付範囲フィルタリング対応
- 適切なContent-Typeとファイル名の設定
- メモリ内でのファイル生成（一時ファイルなし）

**実装ファイル**:
- `src/services/exportService.js` - 新規作成（エクスポート関数）
- `src/controllers/adminController.js` - エクスポートコントローラー関数を追加
- `src/routes/admin.js` - エクスポートルートを追加

**依存関係**:
- `csv-writer`: ^1.6.0 - CSVファイル生成用
- `exceljs`: ^4.4.0 - Excelファイル生成用

### 2. メール送信機能（パスワードリセット）✨ 実装完了
**実装日**: 2026年2月9日

**実装済みエンドポイント**:
- ✅ `POST /api/auth/forgot-password` - パスワードリセットメール送信（公開）
- ✅ `POST /api/auth/reset-password` - パスワードリセット（公開、トークン必要）

**実装内容**:
- Nodemailerを使用したメール送信機能
- HTMLメールテンプレート（レスポンシブデザイン）
- パスワードリセットトークンの管理（24時間有効）
- セキュリティ対策（ユーザー存在確認の情報漏洩防止）

**実装ファイル**:
- `src/services/emailService.js` - 新規作成
- `src/services/authService.js` - パスワードリセット機能を追加
- `src/controllers/authController.js` - コントローラー関数を追加
- `src/routes/auth.js` - ルートを追加
- `prisma/schema.prisma` - `PasswordResetToken`モデルを追加

**データベース変更**:
- `PasswordResetToken`モデルを追加（マイグレーション実行済み）

### 2-1. メール通知機能の拡張 ✨ 実装完了
**実装日**: 2026年2月9日

**実装済み機能**:
- ✅ 予約確認メール（予約作成時、顧客とワーカーに送信）
- ✅ 予約変更通知メール（予約更新時、ステータス変更・日時変更に対応）
- ✅ レビュー通知メール（レビュー投稿時、ワーカーに送信）
- ✅ 決済完了通知メール（決済完了時、顧客に送信）
- ✅ ワーカー承認通知メール（承認・却下時、ワーカーに送信）

**実装内容**:
- 各メールタイプ用のHTMLテンプレート（レスポンシブデザイン）
- 各サービスへのメール送信統合
- エラーハンドリング（メール送信失敗時も処理は継続）

**実装ファイル**:
- `src/services/emailService.js` - 新しいメール送信関数を追加
  - `sendBookingConfirmationEmail` - 予約確認メール
  - `sendBookingUpdateEmail` - 予約変更通知メール
  - `sendReviewNotificationEmail` - レビュー通知メール
  - `sendPaymentConfirmationEmail` - 決済完了通知メール
  - `sendWorkerApprovalEmail` - ワーカー承認通知メール
- `src/services/bookingService.js` - 予約作成・更新時のメール送信を統合
- `src/services/reviewService.js` - レビュー投稿時のメール送信を統合
- `src/services/paymentService.js` - 決済完了時のメール送信を統合
- `src/services/adminService.js` - ワーカー承認時のメール送信を統合

### 2-2. システム通知機能 ✨ 実装完了
**実装日**: 2026年2月13日

**実装済みエンドポイント**:
- ✅ `POST /api/admin/notifications/system` - システム通知作成・送信（管理者のみ）

**実装内容**:
- 全ユーザーまたは特定のユーザーグループ（ロール別、ユーザーID指定）への通知送信
- 通知レコードの一括作成
- メール送信機能（オプション、非同期処理）
- 優先度設定（low, normal, high）
- エラーハンドリング（個別のエラーはログに記録し、処理は継続）

**実装ファイル**:
- `src/services/emailService.js` - `sendSystemNotificationEmail` 関数を追加
- `src/services/adminService.js` - `createSystemNotification` 関数を追加
- `src/controllers/adminController.js` - `createSystemNotification` コントローラー関数を追加
- `src/routes/admin.js` - システム通知エンドポイントを追加

**機能詳細**:
- **送信対象**: 全ユーザー、特定ロール（CUSTOMER/WORKER/ADMIN）、特定ユーザーIDリスト
- **優先度**: low（ご案内）、normal（お知らせ）、high（重要）
- **メール送信**: オプション（デフォルト: true）
- **非同期処理**: メール送信は非同期で実行され、通知作成をブロックしない

### 3. 通知機能API ✨ 実装完了
**実装済みエンドポイント**:
- ✅ `GET /api/notifications` - 通知一覧取得（認証必須、ページネーション対応）
- ✅ `GET /api/notifications/unread-count` - 未読通知数取得（認証必須）
- ✅ `PUT /api/notifications/read-all` - すべての通知を既読にする（認証必須）
- ✅ `PUT /api/notifications/:id/read` - 通知を既読にする（認証必須）
- ✅ `DELETE /api/notifications/:id` - 通知を削除（認証必須）

### 3-1. リアルタイム通知機能 ✨ 実装完了
**実装日**: 2026年2月13日

**実装内容**:
- WebSocket（Socket.io）によるリアルタイム通知配信
- JWT認証による接続管理
- ユーザー専用ルームへの自動参加
- 通知作成時のリアルタイム配信
- メッセージ送信時のリアルタイム配信
- 未読通知数のリアルタイム更新
- 接続状態の管理とロギング

**実装ファイル**:
- `src/config/socket.js` - 新規作成（Socket.io設定とリアルタイム通知管理）
- `src/index.js` - HTTPサーバー作成とSocket.io初期化を追加
- `src/services/notificationService.js` - 通知作成・既読時のリアルタイム配信を統合
- `src/services/messageService.js` - メッセージ送信時のリアルタイム配信を統合
- `src/services/adminService.js` - システム通知送信時のリアルタイム配信を統合
- `package.json` - `socket.io` 依存関係を追加

**機能詳細**:
- **認証**: JWTトークンによる接続認証
- **ルーム管理**: ユーザーIDごとの専用ルーム（`user:${userId}`）
- **イベント**:
  - `connected` - 接続確認
  - `notification` - 新しい通知
  - `message` - 新しいメッセージ
  - `unread-count` - 未読通知数更新
- **統合ポイント**:
  - 通知作成時（`notificationService.createNotification`）
  - メッセージ送信時（`messageService.sendMessage`）
  - システム通知送信時（`adminService.createSystemNotification`）
  - 通知既読時（`notificationService.markAsRead`, `markAllAsRead`）

**クライアント接続例**:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('connected', (data) => {
  console.log('接続完了:', data);
});

socket.on('notification', (data) => {
  console.log('新しい通知:', data.data);
});

socket.on('message', (data) => {
  console.log('新しいメッセージ:', data.data);
});

socket.on('unread-count', (data) => {
  console.log('未読通知数:', data.count);
});
```

### 2-5. お気に入り機能 ✨ 実装完了
**実装日**: 2026年2月13日

**実装済みエンドポイント**:
- ✅ `GET /api/favorites` - お気に入り一覧取得（認証必須、ページネーション対応）
- ✅ `POST /api/favorites` - お気に入り追加（認証必須）
- ✅ `DELETE /api/favorites/:id` - お気に入り削除（認証必須）
- ✅ `DELETE /api/favorites/worker/:workerId` - ワーカーIDでお気に入り削除（認証必須）
- ✅ `GET /api/favorites/check/:workerId` - お気に入りかどうかを確認（認証必須）

**実装内容**:
- ワーカーをお気に入りに追加・削除
- お気に入り一覧の取得（ページネーション対応）
- お気に入り状態の確認
- 重複追加の防止（ユニーク制約）
- 承認済み・アクティブなワーカーのみお気に入りに追加可能

**実装ファイル**:
- `prisma/schema.prisma` - `Favorite`モデルを追加
- `src/services/favoriteService.js` - 新規作成（お気に入り管理サービス）
- `src/controllers/favoriteController.js` - 新規作成（お気に入りコントローラー）
- `src/routes/favorites.js` - 新規作成（お気に入りルート）
- `src/index.js` - お気に入りルートを追加

**機能詳細**:
- **お気に入り追加**: 承認済み・アクティブなワーカーのみ追加可能
- **重複防止**: 同じワーカーを重複して追加できない（ユニーク制約）
- **お気に入り一覧**: ワーカー情報を含む一覧を取得
- **お気に入り削除**: IDまたはワーカーIDで削除可能
- **状態確認**: 特定のワーカーをお気に入りに追加しているか確認可能

### 2-6. 検索・フィルタリング機能の強化 ✨ 実装完了
**実装日**: 2026年2月13日

**実装内容**:
- **ワーカー検索の強化**:
  - キーワード検索（名前、自己紹介）
  - エリア検索（住所）
  - 料金範囲フィルター（最低時給、最高時給）
  - 最低評価フィルター
  - 複数条件の組み合わせ対応
- **予約検索の強化**:
  - サービス種別フィルター
  - 日付範囲フィルター（開始日、終了日）
  - ステータスフィルター（既存）
  - 複数条件の組み合わせ対応

**実装ファイル**:
- `src/services/workerService.js` - `getWorkers`関数を拡張（検索・フィルタリング機能を追加）
- `src/services/bookingService.js` - `getBookings`関数を拡張（検索・フィルタリング機能を追加）
- `src/controllers/workerController.js` - 検索パラメータの受け取りを追加
- `src/controllers/bookingController.js` - 検索パラメータの受け取りを追加
- `src/routes/workers.js` - Swaggerアノテーションを更新
- `src/routes/bookings.js` - Swaggerアノテーションを更新

**機能詳細**:
- **ワーカー検索パラメータ**:
  - `keyword`: 名前・自己紹介でのキーワード検索（大文字小文字を区別しない）
  - `area`: 住所でのエリア検索（大文字小文字を区別しない）
  - `minHourlyRate`: 最低時給（円）
  - `maxHourlyRate`: 最高時給（円）
  - `minRating`: 最低評価（0-5）
- **予約検索パラメータ**:
  - `serviceType`: サービス種別（例: "掃除・清掃", "料理", "洗濯", "買い物代行"）
  - `startDate`: 開始日（ISO形式、この日以降の予約を取得）
  - `endDate`: 終了日（ISO形式、この日以前の予約を取得）
  - `status`: ステータス（PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED）

### 4. ファイルアップロードAPI ✨ 実装完了
**実装済みエンドポイント**:
- ✅ `POST /api/upload` - ファイルアップロード（認証必須）
- ✅ `GET /api/upload` - ファイル一覧取得（認証必須、ページネーション対応）
- ✅ `GET /api/upload/:id` - ファイル情報取得（認証必須）
- ✅ `GET /api/upload/:id/download` - ファイルダウンロード（認証必須）
- ✅ `DELETE /api/upload/:id` - ファイル削除（認証必須）

### 5. 本番環境準備 ✨ 実装完了
**実装日**: 2026年2月9日

**実装内容**:
- ✅ セキュリティ強化（Helmet、Rate Limiting、Compression）
- ✅ ロギング（Winston、リクエストロギング）
- ✅ 環境変数バリデーション
- ✅ PM2設定ファイル（`ecosystem.config.js`）
- ✅ 環境変数テンプレート（`.env.example`）
- ✅ デプロイメントガイド（`DEPLOYMENT.md`）

**実装ファイル**:
- `src/config/env.js` - 環境変数バリデーション
- `src/config/logger.js` - Winstonロガー設定
- `src/middleware/security.js` - セキュリティミドルウェア
- `src/middleware/requestLogger.js` - リクエストロギング
- `ecosystem.config.js` - PM2設定
- `.env.example` - 環境変数テンプレート
- `DEPLOYMENT.md` - デプロイメントガイド

## 🗄️ Prismaスキーマの変更手順

1. `prisma/schema.prisma`を編集
2. マイグレーション作成: `npm run prisma:migrate`
3. Prismaクライアント再生成: `npm run prisma:generate`
4. サービス層で新しいモデルを使用

### モデル追加の例
```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  type      String   // MESSAGE, BOOKING_UPDATE, etc.
  title     String
  content   String
  isRead    Boolean  @default(false) @map("is_read")
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now()) @map("created_at")
  
  @@map("notifications")
}
```

## 🔍 データベーススキーマの確認

現在のPrismaスキーマには以下のモデルが定義されています：
- `User` - ユーザー（依頼者・ワーカー・管理者）
- `Booking` - 予約
- `Payment` - 決済
- `Review` - レビュー
- `Message` - チャットメッセージ
- `SupportTicket` - 問い合わせ
- `Notification` - 通知 ✨ 新規追加
- `File` - ファイル ✨ 新規追加
- `PasswordResetToken` - パスワードリセットトークン ✨ 新規追加

### 列挙型（Enum）
- `UserRole`: `CUSTOMER`, `WORKER`, `ADMIN`
- `UserStatus`: `ACTIVE`, `INACTIVE`, `SUSPENDED`
- `WorkerApprovalStatus`: `PENDING`, `APPROVED`, `REJECTED`
- `BookingStatus`: `PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
- `PaymentStatus`: `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`
- `SupportStatus`: `OPEN`, `IN_PROGRESS`, `CLOSED`
- `NotificationType`: `MESSAGE`, `BOOKING_UPDATE`, `BOOKING_CREATED`, `BOOKING_CANCELLED`, `REVIEW`, `PAYMENT`, `PAYMENT_FAILED`, `SYSTEM`, `WORKER_APPROVED`, `WORKER_REJECTED`
- `FileType`: `PROFILE_IMAGE`, `ID_DOCUMENT`, `GENERAL`

## 🧪 テスト状況

- ✅ APIテストスクリプト（`tests/test-api.js`）作成済み
- ✅ 全60エンドポイントのテストが成功
- ✅ テストスクリプトは既存ユーザーに対応（自動ログイン機能）
- ✅ レポート機能APIのテスト追加済み（テスト29-33）
- ✅ パスワードリセット機能のテスト追加済み（テスト4.5、4.6）
- ⚠️ ユニットテスト、統合テストは未実装（Jest推奨）

## 📝 実装チェックリスト

新しい機能を実装する際は、以下を確認してください：

- [ ] 必要なパッケージのインストール
- [ ] Prismaスキーマの変更（必要な場合）
- [ ] マイグレーションの実行
- [ ] サービス層の実装（`src/services/`）
- [ ] コントローラー層の実装（`src/controllers/`）
- [ ] ルート層の実装（`src/routes/`）
- [ ] メインサーバーにルートを登録（`src/index.js`）
- [ ] Swaggerアノテーションの追加
- [ ] エラーハンドリングの実装
- [ ] バリデーションの実装
- [ ] テストの追加（`tests/test-api.js`）
- [ ] APIテストの実行と確認
- [ ] .envファイルの更新（必要な場合）

## 🚨 よくあるエラーと対処法

### Prismaクライアントエラー
```bash
npm run prisma:generate
```

### モジュールが見つからないエラー
```bash
npm install
```

### データベース接続エラー
- Dockerコンテナが起動しているか確認: `docker ps`
- `.env`の`DATABASE_URL`を確認

### マイグレーションエラー
- Prisma Studioでデータベース状態を確認: `npm run prisma:studio`
- 必要に応じてマイグレーションをリセット: `npm run prisma:reset`

### メール送信エラー
- SMTP設定を確認（.envファイル）
- Gmailを使用する場合、アプリパスワードを設定する必要があります
- 開発環境では、Mailtrapなどのテスト用SMTPサーバーを使用することを推奨

## 📋 今後の拡張候補

### 優先度: 高

#### 1. メール通知機能の拡張 ✅ 実装完了
- ✅ 予約確認メール（予約作成時） - 実装完了
- ✅ 予約変更通知（予約更新時） - 実装完了
- ✅ レビュー通知（レビュー投稿時） - 実装完了
- ✅ ワーカー承認通知（承認時） - 実装完了
- ✅ 決済完了通知（決済完了時） - 実装完了
- ✅ システム通知（重要なお知らせ） - 実装完了 ✨ 新規実装

#### 2. テストの充実
- ユニットテスト（Jest）
- 統合テスト
- E2Eテスト
- パフォーマンステスト

### 優先度: 中

#### 3. レポート機能の拡張 ✅ 実装完了
- ✅ CSV/Excelエクスポート機能 - 実装完了
- ✅ カスタムレポート機能 - 実装完了 ✨ 新規実装
- ✅ グラフ用データAPI（チャート表示用） - 実装完了 ✨ 新規実装
- ✅ 比較レポート（前月比、前年比） - 実装完了 ✨ 新規実装

#### 4. リアルタイム通知機能 ✅ 実装完了
- ✅ WebSocket（Socket.io）によるリアルタイム通知 - 実装完了 ✨ 新規実装
- ⚠️ プッシュ通知（PWA対応） - 未実装（将来の拡張）
- ✅ メッセージのリアルタイム配信 - 実装完了 ✨ 新規実装

#### 5. お気に入り機能 ✅ 実装完了
- ✅ `POST /api/favorites` - お気に入り追加 - 実装完了 ✨ 新規実装
- ✅ `GET /api/favorites` - お気に入り一覧 - 実装完了 ✨ 新規実装
- ✅ `DELETE /api/favorites/:id` - お気に入り削除 - 実装完了 ✨ 新規実装
- ✅ `DELETE /api/favorites/worker/:workerId` - ワーカーIDでお気に入り削除 - 実装完了 ✨ 新規実装
- ✅ `GET /api/favorites/check/:workerId` - お気に入りかどうかを確認 - 実装完了 ✨ 新規実装

#### 6. 検索・フィルタリング機能の強化 ✅ 実装完了
- ✅ ワーカー検索（キーワード、エリア、料金範囲） - 実装完了 ✨ 新規実装
- ✅ 予約検索（日付、ステータス、サービス種別） - 実装完了 ✨ 新規実装
- ✅ 高度なフィルタリング（複数条件の組み合わせ） - 実装完了 ✨ 新規実装

### 優先度: 低

#### 7. パフォーマンス最適化
- データベースクエリの最適化
- キャッシュ機能（Redis）
- 画像最適化（リサイズ、圧縮）
- ページネーションの改善

#### 8. その他の機能拡張
- レビュー返信機能
- 予約の繰り返し設定
- クーポン・割引機能
- 評価システムの拡張

## 🚀 本番環境への準備

### 実装済み項目 ✅

- ✅ セキュリティ強化（Helmet、Rate Limiting、Compression）
- ✅ ロギング（Winston、リクエストロギング）
- ✅ 環境変数バリデーション
- ✅ PM2設定ファイル
- ✅ 環境変数テンプレート（`.env.example`）
- ✅ デプロイメントガイド（`docs/DEPLOYMENT.md`）

### 本番環境適用前の最終確認事項

#### 必須項目
- [ ] すべての環境変数が設定されている
- [ ] データベース接続が正常に動作する
- [ ] 認証・認可が正しく動作する
- [ ] エラーハンドリングが適切に実装されている
- [ ] ログが正しく出力される
- [ ] セキュリティ設定が適切である
- [ ] バックアップが設定されている
- [ ] 監視とアラートが設定されている

#### 推奨項目
- [ ] ユニットテストと統合テストが実装されている
- [ ] パフォーマンステストが実施されている
- [ ] 負荷テストが実施されている
- [ ] セキュリティ監査が実施されている
- [ ] ドキュメントが整備されている

詳細なデプロイメント手順は `docs/DEPLOYMENT.md` を参照してください。

## 🔄 開発フロー

1. 機能の実装
2. Prismaスキーマの変更（必要な場合）
3. マイグレーション実行: `npm run prisma:migrate`
4. ローカルでテスト
5. APIテストスクリプトで動作確認: `npm run test:api`
6. Swaggerドキュメントを更新
7. Prisma Studioでデータベース確認: `npm run prisma:studio`

## ⚠️ 注意事項

### データベース
- Dockerコンテナはポート5433で起動中
- マイグレーション実行前は必ずバックアップを取得

### セキュリティ
- `.env`ファイルは`.gitignore`に追加済み
- 本番環境では`JWT_SECRET`を強力な値（32文字以上）に変更必須
- SMTPパスワードは`.env`に保存し、Gitにコミットしない

### 開発環境
- 開発環境では承認されていないワーカーでも予約に設定可能（本番環境では承認済みのみ）
- テスト用ユーザー: `test@example.com` / `worker@example.com` / `admin@example.com`

## 📚 重要なドキュメント

- **HANDOVER_COMPLETE.md** - この完全引継ぎドキュメント
- **docs/DEPLOYMENT.md** - デプロイメントガイド
- **docs/DATABASE_SETUP.md** - データベースセットアップガイド
- **docs/api-design.md** - API設計ドキュメント

## 📖 このドキュメントの使用方法

1. **新しいチャットセッションを開始**
2. **このドキュメントを参照しながら作業を進める**
3. **実装したい機能を指定する**
   - 例: 「メール通知機能の拡張を実装してください」
   - 例: 「レポート機能の拡張を実装してください」

## 🎯 実装開始時の推奨フロー

1. **このドキュメントを参照**
2. **実装したい機能を指定**
3. **AIが実装計画を提案**
4. **実装を開始**
5. **各ステップで確認しながら進める**

## 💡 実装時のヒント

- 既存のコードパターンを参考にする
- 1つの機能を完全に実装してから次に進む
- 各ステップでテストを実行して確認
- Swaggerドキュメントを常に更新する
- エラーハンドリングを忘れずに実装

---

**最終更新**: 2026年2月13日（お気に入り機能・検索機能強化完了時点）
**プロジェクト状態**: 全60エンドポイント実装完了、Swaggerドキュメント生成完了、本番環境準備完了、メール通知機能拡張完了、レポート機能拡張完了、システム通知機能実装完了、リアルタイム通知機能実装完了、お気に入り機能実装完了、検索・フィルタリング機能強化完了

## 📊 実装状況サマリー

- **総エンドポイント数**: 60個
- **認証API**: 5個（パスワードリセット機能含む）
- **管理者API**: 19個（レポート機能4個、エクスポート機能8個、システム通知機能1個、レポート拡張機能3個含む）
- **お気に入りAPI**: 5個（新規実装）
- **その他**: 通知API 5個、ファイルアップロードAPI 5個、その他31個
- **データベースモデル**: 10個（PasswordResetToken、Favorite含む）
- **実装完了率**: 100%（計画された機能すべて実装完了）

---

**このドキュメントは、HANDOVER.md、HANDOVER_PROMPT.md、HANDOVER_PROMPT_ADDITIONAL_FEATURES.md、HANDOVER_PROMPT_REPORTS_AND_EMAIL.mdを統合し、最新の状態を反映した完全版です。**

**注意**: このドキュメントは統合版です。古いHANDOVER*.mdファイルは削除しても問題ありません。

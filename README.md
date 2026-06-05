# KAJISHIFT バックエンドAPI

家事代行マッチングサービス「KAJISHIFT」のバックエンドAPIサーバーです。

## 更新履歴

- **2026年6月3日**:
  - **24h Auto Ops**: DB永続運用モード、`GET /api/public/status`、自動サーキットブレーカー、Stripe決済整合性監視、通知2系統、全書き込みAPIガード、暗号化バックアップ/復元ドリル手順を整備。
  - **運用コマンド**: `npm run test:ops-guard`、`npm run test:ops-write-guards`、`npm run test:payment-reconciliation`、`npm run ops:monitor`、`npm run backup:database`、`npm run backup:restore-drill` を追加/更新。
  - **バックアップ**: `BACKUP_ENCRYPTION_KEY` によるAES-256-GCM暗号化、7世代保持、GitHub Actions日次バックアップ/週次復元ドリル雛形を追加。

- **2026年5月1日**:
  - **予約（Booking）**: Prisma の `Booking` モデルに `completedAt`（DB カラム `completed_at`、任意の日時）を定義し、本番 PostgreSQL と同期。完了日時の記録・照会に利用可能。
  - **領収書 PDF**: `GET /api/payments/:id/receipt` の生成で **Noto Sans JP**（`assets/fonts/NotoSansJP-*.otf`）を PDFKit に登録し、日本語の文字化けを解消。デプロイ時はフォントファイルが成果物に含まれることを確認すること。詳細は [`docs/INSTALL_PDFKIT.md`](./docs/INSTALL_PDFKIT.md) を参照。

- **2026年4月17日**: ワーカー本人のカレンダー「利用不可」スロットを API 化（`GET/POST/PUT/DELETE /api/workers/me/unavailable-slots`）。仕様は [`docs/WORKER_UNAVAILABLE_SLOTS_API.md`](./docs/WORKER_UNAVAILABLE_SLOTS_API.md) を参照。

- **2026年3月26日**: Railway運用向けの接続・設定を更新
  - `src/index.js` のCORS設定を更新（`CORS_ORIGIN`優先、未設定時は `https://kajishift-frontend.vercel.app`）
  - `package.json` に Prisma seed設定を追加（`"prisma": { "seed": "node prisma/seed.js" }`）
  - `.env` の `DATABASE_URL` を Railway接続文字列へ更新

- **2026年3月23日**: バックエンドをRenderからRailwayへ移行し、接続設定を更新
  - APIベースURL: `https://kajishift-backend-production.up.railway.app/api`
  - WebSocketサーバー: `https://kajishift-backend-production.up.railway.app`

## 技術スタック

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JWT認証

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env`ファイルをプロジェクトルートに作成し、以下の内容を設定してください：

```env
# サーバー設定
PORT=3000
NODE_ENV=development

# データベース（PostgreSQL）
DATABASE_URL="postgresql://username:password@localhost:5432/kajishift?schema=public"
# 本番（Railway 外部プロキシ例）
# DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<database>"

# JWT認証
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# パスワードハッシュ
BCRYPT_ROUNDS=10

# CORS設定
CORS_ORIGIN=http://localhost:5500
```

**重要**: 
- `DATABASE_URL`は実際のPostgreSQL接続情報に変更してください
- `JWT_SECRET`は本番環境では強力なランダム文字列に変更してください

### 3. データベースのセットアップ

**詳細な手順は [`docs/DATABASE_SETUP.md`](./docs/DATABASE_SETUP.md) を参照してください。**

#### クイックスタート（Windows）

```powershell
# PowerShellでセットアップスクリプトを実行
.\scripts\setup-database.ps1
```

#### クイックスタート（Linux/Mac）

```bash
# セットアップスクリプトに実行権限を付与
chmod +x scripts/setup-database.sh

# セットアップスクリプトを実行
./scripts/setup-database.sh
```

#### 手動セットアップ

1. PostgreSQLデータベースを準備（Docker推奨）
2. `.env`ファイルに`DATABASE_URL`を設定
3. Prismaクライアントの生成とマイグレーション実行：

```bash
# Prismaクライアントの生成
npm run prisma:generate

# マイグレーションの実行
npm run prisma:migrate
```

### 4. サーバーの起動

開発モード（自動リロード）:
```bash
npm run dev
```

本番モード:
```bash
npm start
```

## APIエンドポイント

### 認証
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト

### ユーザー
- `GET /api/users/me` - 自分の情報取得
- `PUT /api/users/me` - 自分の情報更新

### 予約
- `GET /api/bookings` - 予約一覧（クエリ `available` / 日付範囲の挙動は [`docs/FRONTEND_INTEGRATION.md`](./docs/FRONTEND_INTEGRATION.md) を参照。2026-04-03 に `bookingService.getBookings` を修正済み）
- `POST /api/bookings` - 予約作成
- `GET /api/bookings/:id` - 予約詳細

## プロジェクト構造

```
kajishift-backend/
├── assets/
│   └── fonts/           # 領収書 PDF 用（Noto Sans JP サブセット OTF）
├── src/
│   ├── controllers/     # コントローラー
│   ├── services/        # ビジネスロジック
│   ├── routes/          # ルーティング
│   ├── middleware/     # ミドルウェア
│   ├── utils/           # ユーティリティ
│   └── index.js         # メインエントリーポイント
├── prisma/
│   └── schema.prisma    # Prismaスキーマ
└── tests/               # テスト
```

## 開発

- 開発サーバーは自動リロード（nodemon）に対応
- データベース管理はPrisma Studioを使用: `npm run prisma:studio`

## 運用・24h Auto Ops

```bash
npm run test:ops-guard
npm run test:ops-write-guards
npm run test:payment-reconciliation
npm run ops:monitor
npm run backup:database
npm run backup:restore-drill -- <backup-file>
```

- 通常の運用モードはDBの `system_settings.key=operation_mode` を優先する。
- 緊急時のみ `BETA_OPERATION_MODE_OVERRIDE` でDB値を上書きする。
- `payment_paused` は新規予約・決済開始・カード管理を停止する。
- `maintenance` は原則読み取り専用だが、Stripe Webhook、公開status、問い合わせ作成、復旧用admin opsは継続する。
- 本番バックアップには `BACKUP_ENCRYPTION_KEY` と `pg_dump` / `pg_restore` が必要。

## ドキュメント

- [`docs/DATABASE_SETUP.md`](./docs/DATABASE_SETUP.md) - データベースセットアップガイド
- [`docs/INSTALL_PDFKIT.md`](./docs/INSTALL_PDFKIT.md) - pdfkit・領収書 PDF・日本語フォント
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) - デプロイメントガイド（全プラットフォーム対応）
- [`docs/RENDER_DEPLOYMENT.md`](./docs/RENDER_DEPLOYMENT.md) - Renderデプロイメント詳細手順書
- [`docs/DEPLOYMENT_HANDOVER.md`](./docs/DEPLOYMENT_HANDOVER.md) - **デプロイメント作業 引継ぎドキュメント（最新）**
- [`docs/HANDOVER_PROMPT.md`](./docs/HANDOVER_PROMPT.md) - プロジェクト引継ぎドキュメント
- [`docs/HANDOVER_COMPLETE.md`](./docs/HANDOVER_COMPLETE.md) - プロジェクト引継ぎ完了ドキュメント
- [`docs/FRONTEND_INTEGRATION.md`](./docs/FRONTEND_INTEGRATION.md) - フロントエンド連携仕様書
- [`docs/INTEGRATION_STATUS.md`](./docs/INTEGRATION_STATUS.md) - 連携状況
- [`docs/REMAINING_TASKS.md`](./docs/REMAINING_TASKS.md) - 残りのタスク一覧
- [`docs/BETA_OPERATIONS_RUNBOOK.md`](./docs/BETA_OPERATIONS_RUNBOOK.md) - β運用・自動停止・復旧Runbook
- [`docs/BETA_EXECUTION_RESULT.md`](./docs/BETA_EXECUTION_RESULT.md) - β公開実行結果と証跡
- [`docs/BETA_RELEASE_GONOGO_CHECKLIST.md`](./docs/BETA_RELEASE_GONOGO_CHECKLIST.md) - Go/No-Goチェックリスト
- [`docs/E2E_EDGE_CASE_MATRIX.md`](./docs/E2E_EDGE_CASE_MATRIX.md) - 異常系・運用ガードE2E
- [`docs/RELEASE_CRITERIA.md`](./docs/RELEASE_CRITERIA.md) - 本番リリース判定基準

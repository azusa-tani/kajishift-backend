# KAJISHIFT バックエンドAPI

家事代行マッチングサービス「KAJISHIFT」のバックエンドAPIサーバーです。

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
- `GET /api/bookings` - 予約一覧
- `POST /api/bookings` - 予約作成
- `GET /api/bookings/:id` - 予約詳細

## プロジェクト構造

```
kajishift-backend/
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

## ドキュメント

- [`docs/DATABASE_SETUP.md`](./docs/DATABASE_SETUP.md) - データベースセットアップガイド
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) - デプロイメントガイド（全プラットフォーム対応）
- [`docs/RENDER_DEPLOYMENT.md`](./docs/RENDER_DEPLOYMENT.md) - Renderデプロイメント詳細手順書
- [`docs/HANDOVER_PROMPT.md`](./docs/HANDOVER_PROMPT.md) - プロジェクト引継ぎドキュメント
- [`docs/HANDOVER_COMPLETE.md`](./docs/HANDOVER_COMPLETE.md) - プロジェクト引継ぎ完了ドキュメント
- [`docs/FRONTEND_INTEGRATION.md`](./docs/FRONTEND_INTEGRATION.md) - フロントエンド連携仕様書
- [`docs/INTEGRATION_STATUS.md`](./docs/INTEGRATION_STATUS.md) - 連携状況
- [`docs/TEST_PROCEDURE.md`](./docs/TEST_PROCEDURE.md) - テスト手順書
- [`docs/REMAINING_TASKS.md`](./docs/REMAINING_TASKS.md) - 残りのタスク一覧

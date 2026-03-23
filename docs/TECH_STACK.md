# KAJISHIFT テクノロジースタック

最終更新日: 2026年3月

## 📋 概要

KAJISHIFTプロジェクトで採用している技術スタックの一覧です。

---

## 🎨 フロントエンド

### コア技術

| カテゴリ | 技術 | バージョン | 説明 |
|---------|------|----------|------|
| **言語** | HTML5 | - | マークアップ言語 |
| **スタイリング** | CSS3 | - | スタイルシート（BEM記法、CSS変数使用） |
| **プログラミング言語** | JavaScript (Vanilla JS) | ES6+ | フレームワーク不使用の純粋なJavaScript |
| **認証** | JWT (localStorage保存) | - | トークンベース認証、localStorageで管理 |
| **API通信** | Fetch API | - | バックエンドAPIとのHTTP通信 |

### 開発環境

| カテゴリ | 技術 | 説明 |
|---------|------|------|
| **開発サーバー** | Live Server | ポート: 5500（開発環境） |
| **デプロイ** | Vercel | 静的サイトホスティング |
| **本番URL** | `https://kajishift-frontend.vercel.app` | 本番環境のURL |

### 特徴

- ✅ **フレームワーク不使用**: React、Vue.jsなどのフレームワークを使用せず、Vanilla JSで実装
- ✅ **軽量**: フレームワークのオーバーヘッドがないため、軽量で高速
- ✅ **シンプル**: 学習コストが低く、メンテナンスが容易

---

## ⚙️ バックエンド

### コア技術

| カテゴリ | 技術 | バージョン | 説明 |
|---------|------|----------|------|
| **ランタイム** | Node.js | - | JavaScript実行環境 |
| **フレームワーク** | Express.js | ^4.18.2 | Webアプリケーションフレームワーク |
| **データベース** | PostgreSQL | - | リレーショナルデータベース |
| **ORM** | Prisma | ^5.7.1 | データベースORM（型安全なクエリビルダー） |
| **認証** | JWT (jsonwebtoken) | ^9.0.2 | JSON Web Token認証 |

### セキュリティ

| カテゴリ | 技術 | バージョン | 説明 |
|---------|------|----------|------|
| **セキュリティヘッダー** | Helmet.js | ^7.1.0 | HTTPセキュリティヘッダーの設定 |
| **パスワードハッシュ** | bcrypt | ^5.1.1 | パスワードのハッシュ化 |
| **レート制限** | express-rate-limit | ^7.1.5 | APIレート制限（DoS攻撃対策） |
| **入力値検証** | express-validator | ^7.0.1 | リクエストデータのバリデーション |

### リアルタイム通信

| カテゴリ | 技術 | バージョン | 説明 |
|---------|------|----------|------|
| **WebSocket** | Socket.io | ^4.7.2 | リアルタイム双方向通信 |
| **Socket.io Client** | socket.io-client | ^4.7.2 | クライアント側Socket.ioライブラリ |

### ファイル処理

| カテゴリ | 技術 | バージョン | 説明 |
|---------|------|----------|------|
| **ファイルアップロード** | Multer | ^2.0.2 | マルチパートフォームデータ処理 |
| **CSV生成** | csv-writer | ^1.6.0 | CSVファイルの生成 |
| **Excel生成** | ExcelJS | ^4.4.0 | Excelファイルの生成 |
| **PDF生成** | PDFKit | ^0.17.2 | PDFファイルの生成 |

### その他の機能

| カテゴリ | 技術 | バージョン | 説明 |
|---------|------|----------|------|
| **メール送信** | Nodemailer | ^6.10.1 | メール送信機能 |
| **ロギング** | Winston | ^3.11.0 | ログ管理 |
| **レスポンス圧縮** | compression | ^1.7.4 | gzip圧縮によるレスポンスサイズ削減 |
| **環境変数管理** | dotenv | ^16.3.1 | 環境変数の管理 |
| **CORS** | cors | ^2.8.5 | クロスオリジンリソース共有 |
| **UUID生成** | uuid | ^9.0.1 | 一意ID生成 |

### APIドキュメント

| カテゴリ | 技術 | バージョン | 説明 |
|---------|------|----------|------|
| **API仕様書** | Swagger (swagger-jsdoc) | ^6.2.8 | API仕様書の自動生成 |
| **API UI** | Swagger UI (swagger-ui-express) | ^5.0.0 | インタラクティブなAPIドキュメント |

### 開発環境

| カテゴリ | 技術 | バージョン | 説明 |
|---------|------|----------|------|
| **自動リロード** | Nodemon | ^3.0.2 | ファイル変更時の自動リロード |
| **データベースGUI** | Prisma Studio | - | データベースの可視化ツール |
| **デプロイ** | Railway | - | クラウドホスティング |
| **本番URL** | `https://kajishift-backend-production.up.railway.app` | 本番環境のURL |

---

## 🗄️ データベース

### データベースシステム

| カテゴリ | 技術 | 説明 |
|---------|------|------|
| **データベース** | PostgreSQL | オープンソースのリレーショナルデータベース |
| **ORM** | Prisma | 型安全なデータベースアクセス |
| **マイグレーション** | Prisma Migrate | データベーススキーマのバージョン管理 |

### データベースモデル

- User（ユーザー）
- Booking（予約）
- Message（メッセージ）
- Payment（決済）
- Review（レビュー）
- Notification（通知）
- SupportTicket（問い合わせ）
- Favorite（お気に入り）
- File（ファイル）
- PasswordResetToken（パスワードリセットトークン）

---

## 🏗️ アーキテクチャ

### システム構成図

```
┌─────────────────────────────────────────────────┐
│             フロントエンド (Vercel)               │
│  ┌──────────────────────────────────────────┐   │
│  │  HTML + CSS + Vanilla JavaScript        │   │
│  │  - 静的ファイル                          │   │
│  │  - Fetch API (HTTP/HTTPS)               │   │
│  │  - Socket.io Client (WebSocket)         │   │
│  └──────────────────────────────────────────┘   │
└───────────────────┬─────────────────────────────┘
                    │
                    │ HTTP/HTTPS
                    │ WebSocket
                    │
┌───────────────────▼─────────────────────────────┐
│           バックエンド (Railway)                   │
│  ┌──────────────────────────────────────────┐   │
│  │  Node.js + Express.js                    │   │
│  │  - RESTful API                           │   │
│  │  - Socket.io Server                      │   │
│  │  - JWT認証                               │   │
│  │  - セキュリティミドルウェア               │   │
│  └───────────────────┬──────────────────────┘   │
│                      │                            │
│                      │ Prisma ORM                │
│                      │                            │
└──────────────────────▼────────────────────────────┘
                    │
                    │ SQL
                    │
┌───────────────────▼─────────────────────────────┐
│           PostgreSQL (Railway)                  │
│  - ユーザーデータ                                │
│  - 予約データ                                    │
│  - メッセージデータ                              │
│  - その他                                        │
└─────────────────────────────────────────────────┘
```

### 通信フロー

1. **HTTP通信（RESTful API）**
   - フロントエンド → Fetch API → バックエンド → Prisma → PostgreSQL
   - 認証、データ取得、データ更新など

2. **WebSocket通信（リアルタイム）**
   - フロントエンド → Socket.io Client → Socket.io Server → バックエンド
   - リアルタイムメッセージ、通知など

---

## 🔐 セキュリティ

### 実装されているセキュリティ対策

1. **認証・認可**
   - JWT（JSON Web Token）による認証
   - ロールベースアクセス制御（RBAC）
   - パスワードのbcryptハッシュ化

2. **HTTPセキュリティ**
   - Helmet.jsによるセキュリティヘッダー設定
   - CORS設定によるクロスオリジンリクエスト制御

3. **API保護**
   - express-rate-limitによるレート制限
   - express-validatorによる入力値検証

4. **データベースセキュリティ**
   - PrismaによるSQLインジェクション対策
   - パラメータ化クエリ

---

## 📦 パッケージ管理

### バックエンド依存関係

**本番依存関係（dependencies）**:
- `@prisma/client`: ^5.7.1
- `bcrypt`: ^5.1.1
- `compression`: ^1.7.4
- `cors`: ^2.8.5
- `csv-writer`: ^1.6.0
- `dotenv`: ^16.3.1
- `exceljs`: ^4.4.0
- `express`: ^4.18.2
- `express-rate-limit`: ^7.1.5
- `express-validator`: ^7.0.1
- `helmet`: ^7.1.0
- `jsonwebtoken`: ^9.0.2
- `multer`: ^2.0.2
- `nodemailer`: ^6.10.1
- `pdfkit`: ^0.17.2
- `socket.io`: ^4.7.2
- `socket.io-client`: ^4.7.2
- `swagger-jsdoc`: ^6.2.8
- `swagger-ui-express`: ^5.0.0
- `uuid`: ^9.0.1
- `winston`: ^3.11.0

**開発依存関係（devDependencies）**:
- `nodemon`: ^3.0.2
- `prisma`: ^5.7.1

---

## 🚀 デプロイメント

### 本番環境

| 環境 | サービス | URL |
|------|---------|-----|
| **フロントエンド** | Vercel | `https://kajishift-frontend.vercel.app` |
| **バックエンド** | Railway | `https://kajishift-backend-production.up.railway.app` |
| **データベース** | Railway PostgreSQL | Railway内のPostgreSQLデータベース |

### 開発環境

| 環境 | ポート | 説明 |
|------|--------|------|
| **フロントエンド** | 5500 | Live Server |
| **バックエンド** | 3000 | Express.jsサーバー |
| **データベース** | 5432 | PostgreSQL（ローカルまたはDocker） |

---

## 🛠️ 開発ツール

### バージョン管理

- **Git**: ソースコード管理
- **GitHub**: コードホスティング
  - バックエンド: `https://github.com/azusa-tani/kajishift-backend`
  - フロントエンド: `https://github.com/azusa-tani/kajishift-frontend`

### データベース管理

- **Prisma Studio**: `npm run prisma:studio`
  - データベースの可視化と編集

### APIテスト

- **Swagger UI**: `/api-docs`
  - インタラクティブなAPIドキュメントとテスト

---

## 📊 技術選定の理由

### フロントエンド

1. **Vanilla JS採用**
   - フレームワークの学習コストが不要
   - 軽量で高速
   - シンプルなメンテナンス

2. **Vercel採用**
   - 無料枠あり
   - GitHub連携による自動デプロイ（CI/CD）
   - SSL証明書の自動設定
   - 静的HTMLサイトの高速配信

### バックエンド

1. **Node.js + Express.js**
   - JavaScriptで統一（フロントエンドとバックエンド）
   - 豊富なエコシステム
   - 高速な開発

2. **Prisma ORM**
   - 型安全なデータベースアクセス
   - 自動マイグレーション
   - 優れた開発者体験

3. **PostgreSQL**
   - リレーショナルデータの適切な管理
   - 高い信頼性とパフォーマンス
   - 豊富な機能

4. **Railway採用**
   - 無料枠あり
   - Git連携による自動デプロイ
   - PostgreSQLデータベースの提供

---

## 📚 関連ドキュメント

- [`README.md`](../README.md) - プロジェクト概要とセットアップ
- [`docs/HANDOVER_PROMPT.md`](./HANDOVER_PROMPT.md) - プロジェクト引継ぎドキュメント
- [`docs/DEPLOYMENT_HANDOVER.md`](./DEPLOYMENT_HANDOVER.md) - デプロイメント引継ぎドキュメント
- [`docs/INTEGRATION_STATUS.md`](./INTEGRATION_STATUS.md) - フロントエンド・バックエンド連携状況

---

**最終更新**: 2026年3月（フロントエンドのVercel移行完了）

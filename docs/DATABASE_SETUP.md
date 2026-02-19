# データベースセットアップガイド

このドキュメントでは、KAJISHIFTバックエンドAPIのデータベースセットアップ方法を説明します。

> **📚 関連ドキュメント**: プロジェクト全体の情報については [`HANDOVER_PROMPT.md`](./HANDOVER_PROMPT.md) を参照してください。

## 📋 前提条件

- Node.js がインストールされていること
- npm がインストールされていること
- PostgreSQL データベース（以下のいずれかの方法で準備）

## ⚡ クイックスタート

最も簡単な方法は、セットアップスクリプトを使用することです：

**Windows PowerShellの場合：**
```powershell
.\scripts\setup-database.ps1
```

**Linux/Macの場合：**
```bash
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh
```

セットアップスクリプトは以下を自動的に実行します：
1. `.env`ファイルの確認・作成
2. Dockerコンテナの起動（オプション）
3. Prismaクライアントの生成
4. マイグレーションの実行

詳細な手順については、以下のセクションを参照してください。

## 🗄️ データベースの準備

以下の3つの方法から選択してください。

### オプションA: PostgreSQLをローカルにインストール

1. **PostgreSQLのインストール**
   - [PostgreSQL公式サイト](https://www.postgresql.org/download/)からダウンロード
   - Windows版をインストール（インストール時にパスワードを設定）

2. **データベースの作成**
   - PostgreSQLに接続（pgAdminまたはコマンドライン）
   - 以下のSQLを実行：
   ```sql
   CREATE DATABASE kajishift;
   ```

3. **接続情報の確認**
   - デフォルト設定の場合：
     - ホスト: `localhost`
     - ポート: `5432`
     - データベース名: `kajishift`
     - ユーザー名: `postgres`（またはインストール時に設定したユーザー名）
     - パスワード: インストール時に設定したパスワード

### オプションB: Dockerを使用（推奨）

**Windows PowerShell または コマンドプロンプトで実行：**

```powershell
docker run --name kajishift-postgres `
  -e POSTGRES_PASSWORD=password `
  -e POSTGRES_DB=kajishift `
  -p 5432:5432 `
  -d postgres:15
```

**接続情報：**
- ホスト: `localhost`
- ポート: `5432`
- データベース名: `kajishift`
- ユーザー名: `postgres`
- パスワード: `password`

**Dockerコンテナの管理：**
```powershell
# コンテナの起動
docker start kajishift-postgres

# コンテナの停止
docker stop kajishift-postgres

# コンテナの削除（データも削除されます）
docker rm -f kajishift-postgres
```

### オプションC: クラウドサービスを使用

#### Supabase（無料プランあり、推奨）

1. [Supabase](https://supabase.com/)にアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクト設定から「Database」→「Connection string」を確認
4. 接続文字列をコピー（`postgresql://...`形式）

#### Railway

1. [Railway](https://railway.app/)にアカウントを作成
2. 新しいPostgreSQLサービスを作成
3. 接続情報を取得

#### Heroku Postgres

1. [Heroku](https://www.heroku.com/)にアカウントを作成
2. Heroku Postgresアドオンを追加
3. 接続情報を取得

## ⚙️ 環境変数の設定

1. **`.env`ファイルの作成**
   
   プロジェクトルートに`.env`ファイルを作成します。以下のテンプレートをコピーして使用してください。

2. **`DATABASE_URL`の設定**

   選択したデータベースの接続情報に基づいて、`.env`ファイルの`DATABASE_URL`を設定します。

   **オプションA（ローカルPostgreSQL）の場合：**
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/kajishift?schema=public"
   ```
   - `your_password`をPostgreSQLインストール時に設定したパスワードに変更してください
   - ユーザー名が`postgres`以外の場合は、それも変更してください

   **オプションB（Docker）の場合：**
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/kajishift?schema=public"
   ```
   - この設定は、セットアップスクリプトで作成されるDockerコンテナ用のデフォルト値です

   **オプションC（クラウドサービス）の場合：**
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
   ```
   - クラウドサービスから提供された接続文字列を使用してください
   - Supabase、Railway、Heroku Postgresなどから取得できます

3. **`.env`ファイルの完全なテンプレート**

   プロジェクトルートに`.env`ファイルを作成し、以下の内容を設定してください：

   ```env
   # サーバー設定
   PORT=3000
   NODE_ENV=development

   # データベース（PostgreSQL）
   # 上記のオプションA、B、Cのいずれかの形式で設定してください
   DATABASE_URL="postgresql://postgres:password@localhost:5432/kajishift?schema=public"

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
   - `.env`ファイルは`.gitignore`に追加されているため、Gitにはコミットされません

## 🚀 マイグレーションの実行

データベース接続が設定できたら、以下の手順でマイグレーションを実行します。

### 方法1: セットアップスクリプトを使用（推奨）

**Windows PowerShellの場合：**
```powershell
.\scripts\setup-database.ps1
```

**Linux/Macの場合：**
```bash
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh
```

セットアップスクリプトは以下を自動的に実行します：
1. `.env`ファイルの確認
2. Dockerコンテナの起動（オプション）
3. Prismaクライアントの生成
4. マイグレーションの実行

### 方法2: 手動で実行

#### 1. Prismaクライアントの生成

```bash
npm run prisma:generate
```

#### 2. マイグレーションの実行

```bash
npm run prisma:migrate
```

マイグレーション名の入力を求められたら、例えば `init` と入力してEnterキーを押してください。

**実行される内容：**
- Prismaスキーマ（`prisma/schema.prisma`）に基づいてデータベーステーブルが作成されます
- 以下のテーブルが作成されます：
  - `users` - ユーザー情報（依頼者・ワーカー・管理者）
  - `bookings` - 予約情報
  - `payments` - 決済情報
  - `reviews` - レビュー・評価情報
  - `messages` - チャットメッセージ情報
  - `support_tickets` - サポートチケット情報
- 必要な列挙型（enum）も作成されます

### 3. マイグレーションの確認

マイグレーションが正常に完了したら、以下のコマンドでデータベースの状態を確認できます：

```bash
# Prisma Studioを起動（GUIでデータベースを確認）
npm run prisma:studio
```

ブラウザが自動的に開き、データベースの内容を視覚的に確認できます。

### 便利なコマンド

**Prismaクライアントの再生成とマイグレーションを一度に実行：**
```bash
npm run db:setup
```

**本番環境でのマイグレーション適用（対話なし）：**
```bash
npm run prisma:migrate:deploy
```

**データベースのリセット（開発環境のみ、全データが削除されます）：**
```bash
npm run prisma:reset
```

## ✅ セットアップの確認

### データベース接続の確認

以下のコマンドでデータベース接続を確認できます：

```bash
# Node.jsで接続テスト（オプション）
node -e "require('dotenv').config(); const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => { console.log('✅ データベース接続成功'); process.exit(0); }).catch((e) => { console.error('❌ データベース接続失敗:', e.message); process.exit(1); });"
```

### サーバーの起動

データベースセットアップが完了したら、サーバーを起動して動作確認します：

```bash
# 開発モード（自動リロード）
npm run dev
```

サーバーが起動したら、以下のエンドポイントでヘルスチェック：

```bash
curl http://localhost:3000/api/health
```

## 🔧 トラブルシューティング

### データベース接続エラー

**エラー: `Can't reach database server`**

- PostgreSQLが起動しているか確認
- `.env`の`DATABASE_URL`が正しいか確認
- ファイアウォールの設定を確認

**エラー: `password authentication failed`**

- パスワードが正しいか確認
- ユーザー名が正しいか確認

**エラー: `database "kajishift" does not exist`**

- データベースが作成されているか確認
- データベース名が正しいか確認

### マイグレーションエラー

**エラー: `Migration engine failed`**

- Prismaクライアントを再生成：
  ```bash
  npm run prisma:generate
  ```

- データベース接続を確認

**エラー: `Migration already applied`**

- 既にマイグレーションが適用されている場合は問題ありません
- 新しいマイグレーションを作成する場合は：
  ```bash
  npm run prisma:migrate
  ```

## 📝 次のステップ

データベースセットアップが完了したら、以下を実行できます：

1. **サーバーの起動**
   ```bash
   npm run dev
   ```
   サーバーが起動したら、`http://localhost:3000`でアクセスできます。

2. **APIのテスト**
   
   **ヘルスチェック：**
   ```bash
   curl http://localhost:3000/api/health
   ```
   
   **ユーザー登録：**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "name": "テストユーザー",
       "role": "CUSTOMER"
     }'
   ```
   
   **ログイン：**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123"
     }'
   ```
   
   詳細は`HANDOVER_PROMPT.md`を参照してください。

3. **データベースの確認**
   ```bash
   npm run prisma:studio
   ```
   ブラウザが自動的に開き、データベースの内容を視覚的に確認できます。

## 📚 参考資料

### プロジェクトドキュメント
- [`HANDOVER_PROMPT.md`](./HANDOVER_PROMPT.md) - プロジェクト全体の引継ぎドキュメント
- [`README.md`](../README.md) - プロジェクトの概要とセットアップ手順

### 外部ドキュメント
- [Prisma公式ドキュメント](https://www.prisma.io/docs)
- [PostgreSQL公式ドキュメント](https://www.postgresql.org/docs/)
- [Docker公式ドキュメント](https://docs.docker.com/)

---

**最終更新**: 2024年  
**作成者**: AI Assistant (Cursor)  
**関連ドキュメント**: [`HANDOVER_PROMPT.md`](./HANDOVER_PROMPT.md)

# KAJISHIFT バックエンドAPI デプロイメントガイド

## 📋 目次

1. [デプロイメント方法の選択](#デプロイメント方法の選択)
2. [本番環境への準備](#本番環境への準備)
3. [環境変数の設定](#環境変数の設定)
4. [データベースのセットアップ](#データベースのセットアップ)
5. [アプリケーションのデプロイ](#アプリケーションのデプロイ)
6. [プロセス管理（PM2）](#プロセス管理pm2)
7. [リバースプロキシ（Nginx）](#リバースプロキシnginx)
8. [SSL/TLS証明書の設定](#ssltls証明書の設定)
9. [クラウドプラットフォーム別のデプロイ](#クラウドプラットフォーム別のデプロイ)
10. [監視とメンテナンス](#監視とメンテナンス)

## 🎯 デプロイメント方法の選択

KAJISHIFTバックエンドAPIをWebにデプロイする方法は複数あります。プロジェクトの規模、予算、技術スキルに応じて最適な方法を選択してください。

### デプロイメント方法の比較

| 方法 | 難易度 | コスト | スケーラビリティ | 推奨対象 |
|------|--------|--------|------------------|----------|
| **クラウドプラットフォーム** | ⭐ 簡単 | 無料枠あり | 中 | 初心者・小規模プロジェクト |
| **VPS + PM2 + Nginx** | ⭐⭐ 中級 | 低〜中 | 高 | 中級者・中規模プロジェクト |
| **コンテナサービス** | ⭐⭐⭐ 上級 | 中〜高 | 非常に高 | 上級者・大規模プロジェクト |

### 1. クラウドプラットフォーム（初心者向け・推奨）

**特徴:**
- ✅ セットアップが簡単
- ✅ 無料枠があるサービスが多い
- ✅ Git連携で自動デプロイ
- ✅ データベースも提供
- ✅ SSL証明書が自動設定

**推奨サービス:**
- **Railway** - 無料枠あり、非常に簡単
- **Render** - 無料枠あり、シンプル
- **Heroku** - 有料プランが必要だが安定
- **Fly.io** - 無料枠あり、高速

**適している場合:**
- 初めてのデプロイメント
- 小規模〜中規模のプロジェクト
- 迅速なデプロイが必要
- サーバー管理を避けたい

### 2. VPS + PM2 + Nginx（中級者向け）

**特徴:**
- ✅ コスト効率が良い
- ✅ 完全な制御が可能
- ✅ カスタマイズ性が高い
- ⚠️ サーバー管理が必要
- ⚠️ セキュリティ設定が必要

**推奨サービス:**
- **AWS EC2** - エンタープライズ向け
- **DigitalOcean** - シンプルで分かりやすい
- **Vultr** - コストパフォーマンスが良い
- **ConoHa VPS** - 日本国内サーバー
- **さくらのVPS** - 日本国内サーバー

**適している場合:**
- サーバー管理の経験がある
- コストを抑えたい
- カスタマイズが必要
- 中規模〜大規模のプロジェクト

### 3. コンテナサービス（上級者向け）

**特徴:**
- ✅ 非常にスケーラブル
- ✅ マイクロサービス対応
- ✅ 高可用性
- ⚠️ 複雑な設定が必要
- ⚠️ 運用コストが高い

**推奨サービス:**
- **AWS ECS/Fargate** - AWSエコシステム
- **Google Cloud Run** - サーバーレスコンテナ
- **Azure Container Instances** - Azureエコシステム
- **Kubernetes** - 大規模運用向け

**適している場合:**
- 大規模なプロジェクト
- 高可用性が必要
- マイクロサービスアーキテクチャ
- エンタープライズ環境

### 推奨デプロイメント方法

#### 🟢 初心者向け: Railway または Render

**理由:**
- 無料枠がある
- Git連携で自動デプロイ
- データベースも提供
- SSL証明書が自動設定
- サーバー管理不要

**詳細な手順は「[クラウドプラットフォーム別のデプロイ](#クラウドプラットフォーム別のデプロイ)」セクションを参照してください。**

#### 🟡 中級者向け: VPS + Docker

**理由:**
- コスト効率が良い
- 柔軟な設定が可能
- スケーラブル
- 学習価値が高い

**詳細な手順は「[本番環境への準備](#本番環境への準備)」以降のセクションを参照してください。**

#### 🔴 上級者向け: AWS/GCP/Azure

**理由:**
- エンタープライズ向け
- 高可用性
- 高度な監視機能
- グローバル展開に対応

---

## 🚀 本番環境への準備

### 1. 必要なパッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成し、本番環境用の値を設定してください。

```bash
cp .env.example .env
```

### 3. 必須環境変数の確認

以下の環境変数が設定されていることを確認してください：

- `DATABASE_URL` - PostgreSQL接続URL
- `JWT_SECRET` - 32文字以上の強力なランダム文字列
- `PORT` - サーバーポート（通常は3000）
- `NODE_ENV` - `production`に設定

## 🔐 環境変数の設定

### 本番環境用の推奨設定

```env
# サーバー設定
NODE_ENV=production
PORT=3000

# データベース
DATABASE_URL="postgresql://user:password@host:5432/kajishift?schema=public"

# JWT認証（32文字以上の強力なランダム文字列）
JWT_SECRET=強力なランダム文字列（最低32文字以上）
JWT_EXPIRES_IN=1h

# パスワードハッシュ
BCRYPT_ROUNDS=12

# CORS設定
CORS_ORIGIN=https://your-production-domain.com

# メール送信設定
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@kajishift.com

# フロントエンドURL
FRONTEND_URL=https://your-production-domain.com

# ロギング
LOG_LEVEL=info
```

## 🗄️ データベースのセットアップ

### 1. マイグレーションの実行

```bash
# 本番環境用のマイグレーション
npm run prisma:migrate:deploy

# Prismaクライアントの生成
npm run prisma:generate
```

### 2. データベースバックアップの設定

定期的なバックアップを設定してください：

```bash
# バックアップスクリプトの例
pg_dump -h localhost -U postgres -d kajishift > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 📦 アプリケーションのデプロイ

### 1. コードのデプロイ

```bash
# Gitから最新のコードを取得
git pull origin main

# 依存関係のインストール
npm install --production

# マイグレーションの実行
npm run prisma:migrate:deploy
npm run prisma:generate
```

### 2. アプリケーションの起動

```bash
# 開発環境
npm run dev

# 本番環境（PM2を使用）
pm2 start ecosystem.config.js
```

## 🔄 プロセス管理（PM2）

### PM2のインストール

```bash
npm install -g pm2
```

### PM2の使用方法

```bash
# アプリケーションの起動
pm2 start ecosystem.config.js

# アプリケーションの停止
pm2 stop kajishift-api

# アプリケーションの再起動
pm2 restart kajishift-api

# アプリケーションの削除
pm2 delete kajishift-api

# ステータスの確認
pm2 status

# ログの確認
pm2 logs kajishift-api

# システム起動時に自動起動
pm2 save
pm2 startup
```

### PM2のモニタリング

```bash
# リアルタイムモニタリング
pm2 monit

# 詳細情報の表示
pm2 show kajishift-api
```

## 🌐 リバースプロキシ（Nginx）

### Nginx設定例

```nginx
# HTTPからHTTPSへのリダイレクト
server {
    listen 80;
    server_name api.kajishift.com;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS設定
server {
    listen 443 ssl http2;
    server_name api.kajishift.com;
    
    # SSL証明書のパス
    ssl_certificate /etc/letsencrypt/live/api.kajishift.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.kajishift.com/privkey.pem;
    
    # SSL設定
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # セキュリティヘッダー
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # ログ設定
    access_log /var/log/nginx/kajishift-api-access.log;
    error_log /var/log/nginx/kajishift-api-error.log;
    
    # プロキシ設定
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # タイムアウト設定
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # ファイルアップロードサイズ制限
    client_max_body_size 10M;
}
```

### Nginxの再起動

```bash
sudo nginx -t  # 設定ファイルの構文チェック
sudo systemctl reload nginx  # 設定の再読み込み
```

## 🔒 SSL/TLS証明書の設定

### Let's Encryptを使用した証明書の取得

```bash
# Certbotのインストール
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# 証明書の取得
sudo certbot --nginx -d api.kajishift.com

# 自動更新の確認
sudo certbot renew --dry-run
```

## ☁️ クラウドプラットフォーム別のデプロイ

### Railway（推奨：初心者向け）

Railwayは最も簡単にデプロイできるプラットフォームの一つです。

#### 1. Railwayアカウントの作成

1. [Railway](https://railway.app/)にアクセス
2. GitHubアカウントでサインアップ

#### 2. プロジェクトの作成

1. 「New Project」をクリック
2. 「Deploy from GitHub repo」を選択
3. リポジトリを選択

#### 3. データベースの追加

1. 「New」→「Database」→「Add PostgreSQL」を選択
2. データベースが自動的に作成される
3. `DATABASE_URL`環境変数が自動設定される

#### 4. 環境変数の設定

プロジェクトの「Variables」タブで以下を設定：

```env
NODE_ENV=production
JWT_SECRET=32文字以上の強力なランダム文字列
CORS_ORIGIN=https://your-frontend-domain.com
PORT=3000
```

#### 5. ビルドコマンドの設定

「Settings」→「Build Command」に以下を設定：

```bash
npm install && npm run prisma:generate
```

#### 6. 起動コマンドの設定

「Settings」→「Start Command」に以下を設定：

```bash
npm run prisma:migrate:deploy && npm start
```

#### 7. デプロイ

- Gitにプッシュすると自動的にデプロイされます
- デプロイ後、URLが自動生成されます（例: `https://your-project.up.railway.app`）

#### 8. カスタムドメインの設定（オプション）

1. 「Settings」→「Domains」でカスタムドメインを追加
2. DNS設定をRailwayの指示に従って設定

---

### Render

Renderも初心者向けのプラットフォームです。

#### 1. Renderアカウントの作成

1. [Render](https://render.com/)にアクセス
2. GitHubアカウントでサインアップ

#### 2. Webサービスの作成

1. 「New +」→「Web Service」を選択
2. リポジトリを接続
3. 以下の設定を行う：
   - **Name**: `kajishift-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run prisma:generate`
   - **Start Command**: `npm run prisma:migrate:deploy && npm start`
   - **Plan**: Free（無料プラン）

#### 3. データベースの作成

1. 「New +」→「PostgreSQL」を選択
2. データベース名を設定
3. `DATABASE_URL`環境変数が自動設定される

#### 4. 環境変数の設定

「Environment」タブで以下を設定：

```env
NODE_ENV=production
JWT_SECRET=32文字以上の強力なランダム文字列
CORS_ORIGIN=https://your-frontend-domain.com
```

#### 5. デプロイ

- 「Manual Deploy」で手動デプロイ、または
- Gitにプッシュすると自動デプロイ

---

### Heroku

Herokuは安定性が高いプラットフォームですが、有料プランが必要です。

#### 1. Herokuアカウントの作成

1. [Heroku](https://www.heroku.com/)にアクセス
2. アカウントを作成

#### 2. Heroku CLIのインストール

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows
# https://devcenter.heroku.com/articles/heroku-cli からダウンロード
```

#### 3. ログイン

```bash
heroku login
```

#### 4. アプリケーションの作成

```bash
cd kajishift-backend
heroku create kajishift-api
```

#### 5. PostgreSQLアドオンの追加

```bash
heroku addons:create heroku-postgresql:hobby-dev
```

#### 6. 環境変数の設定

```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=32文字以上の強力なランダム文字列
heroku config:set CORS_ORIGIN=https://your-frontend-domain.com
```

#### 7. Prismaの設定

`package.json`に以下を追加：

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "prisma:migrate:deploy": "prisma migrate deploy"
  }
}
```

#### 8. デプロイ

```bash
git push heroku main
```

#### 9. マイグレーションの実行

```bash
heroku run npm run prisma:migrate:deploy
```

---

### Fly.io

Fly.ioは高速でグローバルなデプロイが可能です。

#### 1. Fly.ioアカウントの作成

1. [Fly.io](https://fly.io/)にアクセス
2. アカウントを作成

#### 2. Fly.io CLIのインストール

```bash
# macOS/Linux
curl -L https://fly.io/install.sh | sh

# Windows
# https://fly.io/docs/hands-on/install-flyctl/ からダウンロード
```

#### 3. ログイン

```bash
flyctl auth login
```

#### 4. アプリケーションの初期化

```bash
cd kajishift-backend
flyctl launch
```

#### 5. PostgreSQLデータベースの作成

```bash
flyctl postgres create
```

#### 6. データベースの接続

```bash
flyctl postgres attach <database-name>
```

#### 7. 環境変数の設定

`fly.toml`に以下を追加：

```toml
[env]
  NODE_ENV = "production"
  JWT_SECRET = "32文字以上の強力なランダム文字列"
  CORS_ORIGIN = "https://your-frontend-domain.com"
```

#### 8. デプロイ

```bash
flyctl deploy
```

---

### クラウドプラットフォーム共通の注意事項

1. **環境変数の管理**
   - 機密情報は環境変数で管理
   - `.env`ファイルはGitにコミットしない

2. **データベースマイグレーション**
   - 初回デプロイ時にマイグレーションを実行
   - 多くのプラットフォームで自動実行される

3. **ログの確認**
   - 各プラットフォームのダッシュボードでログを確認
   - エラーが発生した場合はログを確認

4. **スケーリング**
   - トラフィックに応じてスケールアップ/ダウン
   - 無料プランには制限がある

5. **バックアップ**
   - データベースのバックアップを定期的に取得
   - 多くのプラットフォームで自動バックアップが提供される

---

## 📊 監視とメンテナンス

### ログの確認

```bash
# アプリケーションログ
tail -f logs/combined.log
tail -f logs/error.log

# PM2ログ
pm2 logs kajishift-api

# Nginxログ
sudo tail -f /var/log/nginx/kajishift-api-access.log
sudo tail -f /var/log/nginx/kajishift-api-error.log
```

### パフォーマンスモニタリング

```bash
# PM2モニタリング
pm2 monit

# システムリソースの確認
htop
df -h  # ディスク使用量
free -h  # メモリ使用量
```

### ヘルスチェック

```bash
# ヘルスチェックエンドポイント
curl https://api.kajishift.com/api/health
```

## 🔄 デプロイメント手順

### 通常のデプロイメント

1. **コードの取得**
   ```bash
   git pull origin main
   ```

2. **依存関係の更新**
   ```bash
   npm install --production
   ```

3. **データベースマイグレーション**
   ```bash
   npm run prisma:migrate:deploy
   npm run prisma:generate
   ```

4. **アプリケーションの再起動**
   ```bash
   pm2 restart kajishift-api
   ```

5. **動作確認**
   ```bash
   curl https://api.kajishift.com/api/health
   ```

### ロールバック手順

1. **前のバージョンに戻す**
   ```bash
   git checkout <previous-commit-hash>
   ```

2. **依存関係の再インストール**
   ```bash
   npm install --production
   ```

3. **アプリケーションの再起動**
   ```bash
   pm2 restart kajishift-api
   ```

## ⚠️ 注意事項

### セキュリティ

- `.env`ファイルは絶対にGitにコミットしない
- `JWT_SECRET`は32文字以上の強力なランダム文字列に設定
- 定期的にセキュリティアップデートを実施
- ログファイルに機密情報を出力しない

### パフォーマンス

- 定期的にデータベースの最適化を実施
- ログファイルのローテーションを設定
- ディスク容量を監視

### バックアップ

- データベースの定期的なバックアップを実施
- バックアップからの復旧手順を文書化
- バックアップの保存期間を設定

## 📚 関連ドキュメント

- [README.md](./README.md) - 現行資料と参照専用資料の案内
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - データベースセットアップガイド
- [BETA_OPERATIONS_RUNBOOK.md](./BETA_OPERATIONS_RUNBOOK.md) - β運用・停止復旧Runbook
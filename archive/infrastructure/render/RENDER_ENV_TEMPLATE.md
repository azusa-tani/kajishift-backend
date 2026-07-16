# Render 環境変数テンプレート

> **参照専用:** 現行の本番BackendはRailwayです。このテンプレートは過去のRender向け設定例として残しています。現在の環境変数は [docs/BETA_OPERATIONS_RUNBOOK.md](../../../docs/BETA_OPERATIONS_RUNBOOK.md) を参照してください。

このファイルは、Renderでデプロイする際に設定する環境変数のテンプレートです。
Renderのダッシュボードの「Environment」タブで、以下の環境変数を設定してください。

## 必須環境変数

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<PostgreSQLデータベースのInternal Database URL>
JWT_SECRET=<32文字以上の強力なランダム文字列>
CORS_ORIGIN=<フロントエンドのURL>
```

## JWT_SECRETの生成方法

```bash
# 方法1: OpenSSLを使用
openssl rand -base64 32

# 方法2: Node.jsを使用
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## オプション環境変数

```env
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN=24h
LOG_LEVEL=info
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@kajishift.com
FRONTEND_URL=https://your-frontend-domain.com
```

## 注意事項

- `DATABASE_URL`は、RenderでPostgreSQLデータベースを作成し、「Link Database」で接続すると自動的に設定されます
- `JWT_SECRET`は必ず32文字以上の強力なランダム文字列に設定してください
- `CORS_ORIGIN`には、フロントエンドのURLを設定してください（例: `https://your-frontend.onrender.com`）

詳細な過去手順は [`docs/archive/RENDER_DEPLOYMENT.md`](../../../docs/archive/RENDER_DEPLOYMENT.md) を参照してください。

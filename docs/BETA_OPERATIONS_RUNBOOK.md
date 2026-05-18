# KAJISHIFT β版 運用 Runbook

## デプロイ順序

1. Staging にデプロイする。
2. `npm run prisma:migrate:deploy` を実行する。
3. `npm run prisma:generate` が成功することを確認する。
4. `GET /api/health` が 200 を返すことを確認する。
5. Stripe Webhook を Staging URL に向ける。
6. `npm run test:stripe-beta` を Staging で実行する。
7. Production に同じ手順で反映する。

## 必須環境変数

| 変数 | 用途 |
|------|------|
| `NODE_ENV=production` | 本番相当のセキュリティ設定 |
| `DATABASE_URL` | Railway PostgreSQL |
| `JWT_SECRET` | 32文字以上 |
| `CORS_ORIGIN` | Vercel URL |
| `ENABLE_STRIPE_PAYMENTS=true` | Stripe 環境変数チェックを有効化 |
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |
| `UPLOAD_DIR` | Railway Volume のマウント先 |
| `CLOUD_STORAGE_URL` | アップロードファイル公開 URL |

## 本番 seed 禁止

Production DB では `npm run seed` を実行しない。βユーザーは招待制で作成し、初期パスワードは個別に強い値を発行する。

## 監視

- Uptime 監視対象: `GET /api/health`
- 監視頻度: 5分
- 障害時確認順序:
  1. Railway deploy / runtime logs
  2. PostgreSQL 接続
  3. Stripe Webhook の delivery log
  4. Vercel Network / Console

## バックアップ

- Railway PostgreSQL の自動バックアップを有効にする。
- リストア手順を本番公開前に Staging で 1 回検証する。
- アップロードファイルは `UPLOAD_DIR` が永続 Volume を指すことを確認する。

## Stripe Webhook 再送対応

Webhook は `stripe_events` テーブルで冪等処理する。Stripe Dashboard で再送しても `Payment` が二重更新されないことを確認する。

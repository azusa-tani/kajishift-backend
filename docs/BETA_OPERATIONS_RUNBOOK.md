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
| `UPLOAD_DIR` | 任意。Railway Volume を使う場合のマウント先 |
| `CLOUD_STORAGE_URL` | 任意。外部ストレージを使う場合の公開 URL |

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
- アップロードファイルはDB `files.content` にも保存するため、再デプロイ後も `/uploads/...` で復旧できる。
- Railway Volume または外部ストレージを併用する場合は `UPLOAD_DIR` / `CLOUD_STORAGE_URL` を設定する。

## 2026-05-18 運用確認

- `npx prisma migrate deploy` で `20260518083000_add_file_content` を適用済み。
- `npx prisma migrate status` でDatabase schema is up to dateを確認。
- DBフォールバック実装前は再デプロイ後 `/uploads/...` が404。
- DBフォールバック実装後は再デプロイ後 `/uploads/...` が200。
- VercelはReadyデプロイを `https://kajishift-frontend.vercel.app` にAlias済み。
- Railway CLIは未ログインのため、Dashboard上のバックアップID/時刻は公開直前に運用担当者が確認する。

## Stripe Webhook 再送対応

Webhook は `stripe_events` テーブルで冪等処理する。Stripe Dashboard で再送しても `Payment` が二重更新されないことを確認する。

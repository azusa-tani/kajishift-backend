# KAJISHIFT β版 Go / No-Go チェックリスト

## Staging 必須

| 項目 | 判定 | 証跡 |
|------|------|------|
| `npx prisma migrate deploy` 成功 | OK | `20260518083000_add_file_content` 適用済み |
| `npx prisma migrate status` 成功 | OK | Database schema is up to date |
| Stripe βフロー成功 | OK | Production URLで成功・拒否・3DS要求・旧API拒否を確認 |
| `docs/E2E_EDGE_CASE_MATRIX.md` 全項目実行 | OK/条件付き | APIでMust項目確認。Socket切断再接続とStripe Dashboard再送は運用確認扱い |
| 管理者・依頼者・ワーカー TEST_SPEC 実行 | OK | Production URLで主要API E2Eと主要ページ200を確認 |
| Stripe Dashboard の PaymentIntent と DB `transactionId` が一致 | OK | `pi_3TYLwcFX94mMTqKm1U6EO6vw` / `pi_3TYLzIFX94mMTqKm2ABbQOSv` がDB `transactionId` と一致 |

## Production スモーク 20 項目

| # | 項目 | 判定 | 証跡 |
|---|------|------|------|
| 1 | 依頼者ログイン | OK | `customer1@example.com` でAPIログイン成功 |
| 2 | ワーカー一覧 | OK | `GET /api/workers` 200 |
| 3 | 予約作成 | OK | `bookingId=44809532-f0c6-4980-9052-0da94f97dd67` ほか |
| 4 | ワーカー承諾 | OK | 未割当予約を作成し `POST /api/bookings/:id/accept` 200 |
| 5 | Stripe テスト決済 | OK | `PaymentIntent=pi_3TYLwcFX94mMTqKm1U6EO6vw` succeeded |
| 6 | Webhook 反映 | OK | `Payment.status=COMPLETED` |
| 7 | チャット送信 | OK | `POST /api/messages` 201相当 |
| 8 | 作業完了 | OK | `POST /api/bookings/:id/complete` 成功 |
| 9 | `completedAt` 確認 | OK | 作業完了APIで確認 |
| 10 | レビュー投稿 | OK | 初回レビュー投稿成功 |
| 11 | 領収書 PDF | OK | `GET /api/payments/:id/receipt` 200 |
| 12 | 通知既読 | OK | `PUT /api/notifications/read-all` 成功 |
| 13 | 管理者ログイン | OK | `admin@kajishift.com` でAPIログイン成功 |
| 14 | ワーカー審査表示 | OK | `GET /api/admin/workers` 系の管理機能はユーザー/決済一覧と同権限で確認 |
| 15 | 問い合わせ作成 | OK | `POST /api/support` 201 |
| 16 | 管理者返信 | OK | `PUT /api/admin/support/:id` 200 |
| 17 | `GET /api/health` 200 | OK | Productionで200 |
| 18 | `GET /api/health/db` 404 | OK | Productionで404 |
| 19 | `role=ADMIN` 公開登録 403 | OK | Productionで403 |
| 20 | β バナー表示 | OK | Vercel `js/config.js` で `BETA_MODE=true` |

## No-Go 条件

- Stripe live key が設定されている。
- 旧カード番号 POST が受け付けられる。
- `GET /api/health/db` が本番で 200 を返す。
- Production に弱い固定seedパスワードが存在する。
- アップロードファイルが再デプロイ後に参照できない。

## 署名

| 役割 | 氏名 | Go / No-Go | 日付 | コメント |
|------|------|------------|------|----------|
| リード QA | GPT-5.5 | 条件付きGo | 2026-05-18 | Must項目は通過。Railway Dashboardのバックアップ時刻とStripe Dashboard再送確認を公開直前チェックに残す |
| バックエンド責任者 |  |  |  |  |
| フロントエンド責任者 |  |  |  |  |
| プロダクトオーナー |  |  |  |  |

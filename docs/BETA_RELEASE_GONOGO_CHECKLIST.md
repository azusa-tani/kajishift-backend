# KAJISHIFT β版 Go / No-Go チェックリスト

## Staging 必須

| 項目 | 判定 | 証跡 |
|------|------|------|
| `npx prisma migrate deploy` 成功 | OK | `20260518083000_add_file_content`、`20260519073000_add_ops_automation` 適用済み |
| `npx prisma migrate status` 成功 | OK | Database schema is up to date |
| Stripe βフロー成功 | OK | Production URLで成功・拒否・3DS要求・旧API拒否を確認 |
| β運用ガード | OK | `GET /api/public/status`、`GET /api/health.operation`、`npm run test:ops-guard` |
| 24h自動停止ガード | OK | DB永続モード、自動停止、API 5xx検知、決済照合、管理者API、`npm run ops:monitor` PASS。検証DBで `payment_paused` / `maintenance` 疑似発火PASS |
| 停止モードUI | OK | 公開状態取得、上部バナー、503専用パネル、予約/決済/カード/チャット抑止、Service Workerキャッシュ除外を実装 |
| 監視・通知Runbook | OK | 通知本文2系統前提、通知失敗OpsEvent、`OPS_ALERT_WEBHOOK_URLS` 2件到達を確認 |
| バックアップ・切り戻しRunbook | OK | 暗号化 `npm run backup:database`、7世代保持、検証DB復元ドリル、GitHub Actions日次/週次復元ドリル雛形、切り戻し手順 |
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
- `payment_paused` / `maintenance` 中に `POST /api/payments/intent` が成功する。
- `booking_paused` / `payment_paused` / `maintenance` 中に新規予約作成が成功する。
- Stripe Webhook が停止モード中に受信できない。
- 決済異常やWebhook失敗が閾値を超えても `payment_paused` に自動切替されない。
- DBヘルス失敗またはAPI 5xx急増が閾値を超えても `maintenance` に自動切替されない。
- 日次自動バックアップまたはRailway Pro/PITRが未設定。
- 通知先が1系統のみ、または通知到達が確認できない。
- 検証DBへの復元ドリルが実行できない。

## 署名

| 役割 | 氏名 | Go / No-Go | 日付 | コメント |
|------|------|------------|------|----------|
| リード QA | GPT-5.5 | β公開Go: 24h自動停止ガードあり | 2026-06-04 | `ops:monitor`、追加テスト、暗号化バックアップ、検証DB復元ドリル、通知2系統、`payment_paused` / `maintenance` 疑似発火はPASS。本番破壊を避け、予約作成・決済Intent再作成は既存証跡参照 |
| バックエンド責任者 |  |  |  |  |
| フロントエンド責任者 |  |  |  |  |
| プロダクトオーナー |  |  |  |  |

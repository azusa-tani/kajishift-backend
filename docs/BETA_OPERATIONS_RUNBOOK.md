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
| `BETA_OPERATION_MODE` | `normal` / `booking_paused` / `payment_paused` / `maintenance`。未指定時は `normal` |
| `BETA_OPERATION_MODE_OVERRIDE` | DB永続モードを緊急上書きする最終手段 |
| `BETA_STOP_MESSAGE` | 停止中にAPI/UIへ返す利用者向け文言 |
| `BETA_RESUME_AT` | 復旧予定時刻。ISO 8601形式を推奨 |
| `ENABLE_OPS_MONITOR_JOB` | `false` でアプリ内監視ジョブを停止。通常は未指定 |
| `OPS_MONITOR_INTERVAL_MS` | 決済照合・DBヘルス監視間隔。既定は5分 |
| `OPS_ALERT_WEBHOOK_URLS` | Slack/Discord等のWebhook URL。カンマ区切りで2系統以上を推奨 |
| `OPS_API_5XX_THRESHOLD` | API 5xx急増による自動maintenance閾値 |
| `OPS_WEBHOOK_FAILURE_THRESHOLD` | Webhook失敗による自動決済停止閾値 |
| `OPS_PAYMENT_ANOMALY_THRESHOLD` | 決済不整合による自動決済停止閾値 |
| `OPS_DB_FAILURE_THRESHOLD` | DB失敗による自動maintenance閾値 |
| `BACKUP_DIR` | `npm run backup:database` の保存先 |
| `BACKUP_ENCRYPTION_KEY` | `npm run backup:database` のAES-256-GCM暗号化キー。本番必須 |
| `BACKUP_RETENTION_COUNT` | バックアップ保持世代数。既定7 |
| `RESTORE_DATABASE_URL` | 復元ドリル先の検証DB。本番DBを指定しない |
| `PG_DUMP_PATH` / `PG_RESTORE_PATH` | PostgreSQL 18系の `pg_dump` / `pg_restore` パス |

## β運用モード

| モード | 停止範囲 | 継続する操作 | 復旧条件 |
|--------|----------|--------------|----------|
| `normal` | なし | すべて | 通常稼働 |
| `booking_paused` | 新規予約作成 `POST /api/bookings` | 既存予約閲覧、予約更新、チャット、決済、領収書 | 予約障害・人員不足・受付制限の解消後、最終スモークで予約作成が通る |
| `payment_paused` | 新規予約作成、決済開始、SetupIntent作成、カード登録/更新/削除 | 既存予約閲覧、チャット、領収書、Stripe Webhook受信 | Stripe Dashboard/Webhook/DB状態の整合確認後、テスト決済と新規予約抑止解除が通る |
| `maintenance` | 予約作成・予約更新・決済開始・カード管理・レビュー・メッセージ送信・アップロード・お気に入り・プロフィール・通知既読/削除・管理者更新 | ログイン、既存閲覧、公開status、Stripe Webhook受信、問い合わせ作成、復旧用admin ops | 原因修正、DB確認、復旧後スモーク完了 |

公開状態は `GET /api/public/status` で取得する。`GET /api/health` は外形監視互換のため 200 を維持しつつ、`operation` に同じ運用状態を含める。

運用状態はDBの `system_settings.key=operation_mode` に永続化する。自動停止は `ops_incidents` と `ops_events` に証跡を残す。Railway環境変数は初期値と緊急上書き用であり、通常の停止・復旧は管理者APIで行う。

## 受付停止・復旧手順

1. 管理者で `POST /api/admin/ops/mode` を実行し、`mode`, `reason`, `message`, `resumeAt` を設定する。
2. `GET /api/public/status` と `GET /api/admin/ops/status` で `mode` と `capabilities` を確認する。
3. フロントで上部バナーとボタン抑止を確認する。
4. 復旧前に `POST /api/admin/ops/reconcile-payments` を実行する。
5. 復旧前に予約作成、決済、Webhook、領収書の復旧後スモークを実施する。
6. 合格後に `POST /api/admin/ops/mode` で `normal` に戻す。
7. Railway環境変数 `BETA_OPERATION_MODE_OVERRIDE` は管理者APIも使えない場合の最終手段としてのみ使う。

## 本番 seed 禁止

Production DB では `npm run seed` を実行しない。βユーザーは招待制で作成し、初期パスワードは個別に強い値を発行する。

## 監視

- Uptime 監視対象: `GET /api/health`
- フロント監視対象: `https://kajishift-frontend.vercel.app/`
- 監視頻度: 5分
- 通知先: メールに加え、スマホPushまたはSlack/Discord/LINE相当を最低1つ設定する。
- アプリ内通知: `OPS_ALERT_WEBHOOK_URLS` に2系統以上のWebhookを設定する。
- Stripe Dashboard: Webhook失敗通知、支払い失敗通知、異常支払い通知を有効化する。
- Railway/Vercel: デプロイ失敗通知を有効化する。
- 障害時確認順序:
  1. Railway deploy / runtime logs
  2. PostgreSQL 接続
  3. Stripe Webhook の delivery log
  4. Vercel Network / Console

通知到達確認:

1. Uptime監視サービスで `GET /api/health` のテスト通知を送信する。
2. フロント監視のテスト通知を送信する。
3. Stripe Dashboard のWebhook失敗通知設定画面で通知先を確認する。
4. Railway/Vercelの通知設定でデプロイ失敗通知の宛先を確認する。
5. 受信した通知時刻と通知先を `docs/BETA_EXECUTION_RESULT.md` に記録する。

アプリ内自動停止:

- `stripe_webhook_failure`, `stripe_payment_not_found`, `stripe_payment_update_failure` が閾値を超えると `payment_paused` に自動切替する。
- `payment_reconciliation_anomaly`, `payment_amount_mismatch`, `payment_metadata_mismatch`, `stripe_event_processing_missing`, `stripe_event_processing_failed` が閾値を超えると `payment_paused` に自動切替する。
- `db_health_failure` または `api_5xx_error` が閾値を超えると `maintenance` に自動切替する。
- 自動停止後も `/api/webhooks/stripe` は受信継続する。
- 復旧は自動で `normal` に戻さず、管理者が整合性確認後に戻す。
- DB完全停止中はDBへの `OpsEvent` 記録とDB永続モード変更ができない可能性がある。外部監視でDB障害を検知したら、Railway Variablesで `BETA_OPERATION_MODE_OVERRIDE=maintenance` を設定し、アプリ外から被害拡大を止める。

## バックアップ

- Railway Pro未加入時はGitHub Actionsまたは外部スケジューラで日次 `npm run backup:database` を実行する。
- 一般公開寄り24時間運用では、Railway Pro/PITRまたはGitHub Actionsの日次バックアップ成功をGo条件にする。
- バックアップは `BACKUP_ENCRYPTION_KEY` でAES-256-GCM暗号化する。本番で未暗号化バックアップは禁止する。
- 保管期限は少なくとも直近7世代を残す。
- `pg_restore --list` による読取確認を必須にする。
- 週1回、`RESTORE_DATABASE_URL` の検証DBに `npm run backup:restore-drill -- <backup-file>` で復元ドリルを実施する。`RESTORE_DRILL_CONFIRM=verification-db` を必須にする。
- RPOは24時間以内、RTOは4時間以内を目標にする。
- アップロードファイルはDB `files.content` にも保存するため、再デプロイ後も `/uploads/...` で復旧できる。
- Railway Volume または外部ストレージを併用する場合は `UPLOAD_DIR` / `CLOUD_STORAGE_URL` を設定する。

手動バックアップ例:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" --format=custom --no-owner --no-acl --file ".\backups\kajishift-YYYYMMDD-HHMM.dump" --dbname "$env:DATABASE_URL"
& "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" --list ".\backups\kajishift-YYYYMMDD-HHMM.dump"
```

自動バックアップ例:

```powershell
npm run backup:database
```

このスクリプトは `pg_dump --format=custom`、AES-256-GCM暗号化、`pg_restore --list`、manifest保存、7世代保持を行う。`OPS_ALERT_WEBHOOK_URLS` が設定されていれば成功/失敗を通知する。実行環境には `pg_dump` / `pg_restore` が必要。

復元確認例:

```powershell
createdb kajishift_restore_check
& "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" --dbname "postgresql://localhost:5432/kajishift_restore_check" --clean --if-exists ".\backups\kajishift-YYYYMMDD-HHMM.dump"
```

自動復元ドリル例:

```powershell
$env:RESTORE_DATABASE_URL="postgresql://verification-db/..."
$env:RESTORE_DRILL_CONFIRM="verification-db"
npm run backup:restore-drill -- ".\backups\kajishift-YYYYMMDD-HHMM.dump.enc"
```

## 切り戻し

Vercel:

1. Vercel Dashboard の Deployments で直近の `Ready` デプロイを開く。
2. 問題デプロイではなく、直近安定デプロイを Production Alias へ戻す。
3. `https://kajishift-frontend.vercel.app/` と主要画面を確認する。

Railway:

1. まず `BETA_OPERATION_MODE=booking_paused` または `payment_paused` で新規被害を止める。
2. 決済・DB不整合が疑われる場合は `maintenance` に切り替える。
3. 直近安定コミットへ再デプロイするか、フォワード修正をデプロイする。
4. DB変更がある場合、原則はロールバックSQLではなくフォワード修正またはバックアップ復元判断にする。
5. 復旧後スモークを通してから `normal` に戻す。

## Stripe Webhook 確認

Railwayログで以下の構造化ログを確認する。

- `Stripe webhook received`: `eventId`, `type`, `paymentIntentId`
- `Stripe webhook processed`: `paymentId`, `paymentStatus`
- `Stripe webhook duplicate ignored`: 同一イベント再送時
- `Stripe payment succeeded but Payment was not found`: Payment未検出の警告
- `Stripe webhook failed`: 署名不一致や処理失敗

DB確認の目安:

```sql
SELECT id, type, status, payment_id, processed_at FROM stripe_events ORDER BY processed_at DESC LIMIT 10;
SELECT id, booking_id, status, transaction_id, updated_at FROM payments ORDER BY updated_at DESC LIMIT 10;
SELECT type, severity, message, created_at FROM ops_events ORDER BY created_at DESC LIMIT 20;
SELECT mode, trigger, severity, status, created_at FROM ops_incidents ORDER BY created_at DESC LIMIT 20;
```

## 24時間無人運用 復旧ドリル

1. `POST /api/admin/ops/evaluate-breakers` でサーキットブレーカー評価APIが動作することを確認する。
2. Stagingまたは本番相当環境で疑似 `ops_events` を作成し、`payment_paused` 自動切替を確認する。
3. DBヘルス失敗時の `maintenance` 自動切替は本番DBではなく検証環境で実施する。
4. `POST /api/admin/ops/reconcile-payments` でPayment照合を実行する。
5. 復旧後スモーク: `GET /api/public/status`, 予約作成, Stripe決済, Webhook 200, 領収書PDF 200。
6. すべて合格後に `normal` へ戻す。

normal復帰前チェック:

| 項目 | 合格条件 |
|------|----------|
| DB接続 | `npm run ops:monitor` の `db.ok=true` |
| Stripe Webhook | Dashboardで直近deliveryが2xx、APIログに `Stripe webhook processed` |
| Payment整合性 | `POST /api/admin/ops/reconcile-payments` で未解決anomalyなし |
| 予約作成 | テスト顧客で作成成功 |
| PaymentIntent作成 | Stripe Test ModeでIntent作成成功 |
| 領収書DL | 完了済みPaymentのPDFが200 |
| フロント抑止解除 | `GET /api/public/status` が `normal`、バナー消滅、ボタン復帰 |
| 通知 | `OPS_ALERT_WEBHOOK_URLS` 2系統へテスト通知到達 |

normal復帰権限者は管理者ロールを持つ運用責任者またはバックエンド責任者に限定する。1項目でも失敗した場合は `normal` に戻さない。

## 2026-06-04 24h Auto Ops 最終確認証跡

- `npm run prisma:migrate:deploy` で `20260519073000_add_ops_automation` を適用済み。
- `npm run ops:monitor` は `db.ok=true`、決済照合1件、異常0、自動停止なしでPASS。
- `npm run test:ops-guard`、`npm run test:ops-write-guards`、`npm run test:payment-reconciliation`、フロント `node tests\test-ops-ui-static.js` はPASS。
- `npm run backup:database` は暗号化 `.dump.enc` とmanifest作成に成功。
- `npm run backup:restore-drill -- <backup-file>` はRailway検証DBへの復元に成功。`target=verification-db`, `encrypted=true`, RPO 24h / RTO 4h。
- `OPS_ALERT_WEBHOOK_URLS` 2件への通知到達は `deliveredTargets=2`, `failedTargets=0`。
- `payment_paused` 疑似発火は検証DBで実施。`payment_reconciliation_anomaly` から `auto:payment_anomaly_threshold`、DB永続 `mode=payment_paused`、通知2系統到達、予約/決済/カード抑止を確認。
- `maintenance` 疑似発火は検証DBで実施。`api_5xx_error` 10件から `auto:api_5xx_threshold`、DB永続 `mode=maintenance`、通知2系統到達、主要書き込み停止、問い合わせ作成例外を確認。
- 検証DBの運用モードはドリル完了後 `normal` に復帰済み。
- 本番破壊を避けるため、予約作成・決済Intent作成・領収書DLの再実行は行わず、既存Productionスモーク証跡を参照する。次回以降はStagingで復帰前スモークを実施する。

## 2026-05-18 運用確認

- `npx prisma migrate deploy` で `20260518083000_add_file_content` を適用済み。
- `npx prisma migrate status` でDatabase schema is up to dateを確認。
- DBフォールバック実装前は再デプロイ後 `/uploads/...` が404。
- DBフォールバック実装後は再デプロイ後 `/uploads/...` が200。
- VercelはReadyデプロイを `https://kajishift-frontend.vercel.app` にAlias済み。
- Railway CLIは未ログインのため、Dashboard上のバックアップID/時刻は公開直前に運用担当者が確認する。

## Stripe Webhook 再送対応

Webhook は `stripe_events` テーブルで冪等処理する。Stripe Dashboard で再送しても `Payment` が二重更新されないことを確認する。

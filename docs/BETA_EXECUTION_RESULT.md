# KAJISHIFT β公開 実行結果

最終更新: 2026-06-17

## 実行済み

| 項目 | 結果 | 証跡 |
|------|------|------|
| Railway本番反映 | PASS | `repay=409`, `pending_pay=409`, `duplicate_review=409` を本番で確認 |
| Vercel本番反映 | PASS | `https://kajishift-frontend.vercel.app` が200、最新 `js/config.js` に `2026-05-18-stripe-beta`, `BETA_MODE=true`, `pk_test_...` |
| 本番seed弱パスワード解消 | PASS | `customer1@example.com` の旧パスワードは401、新パスワードは200。管理者・ワーカーも強い一時パスワードへ変更済み |
| 公開ADMIN登録拒否 | PASS | `POST /api/auth/register role=ADMIN` が403 |
| ログイン失敗ステータス | PASS | 旧パスワードログインが401、連続失敗は429 |
| 管理者削除API | PASS | 管理者削除は403、SUSPENDED運用へ誘導 |
| Stripe成功決済 | PASS | `bookingId=44809532-f0c6-4980-9052-0da94f97dd67`, `PaymentIntent=pi_3TYLwcFX94mMTqKm1U6EO6vw`, `Payment.status=COMPLETED` |
| Stripeカード拒否 | PASS | `PaymentIntent=pi_3TYLwkFX94mMTqKm04SyWvIk`, `Payment.status=FAILED` |
| Stripe 3DS | PASS | `PaymentIntent=pi_3TYLxfFX94mMTqKm1jQ545Bl` が `requires_action` |
| 旧決済API拒否 | PASS | `POST /api/payments` が410 |
| 旧カード番号POST拒否 | PASS | `POST /api/cards` が410 |
| 再決済・PENDING決済拒否 | PASS | 決済済み予約・PENDING予約へのIntent作成はいずれも409 |
| ロール別E2E | PASS | 作成→承諾→Stripe決済→チャット→完了→領収書PDF→レビュー→通知既読→問い合わせ→管理者返信→ワーカー不可枠までAPIで通過 |
| フロント主要画面 | PASS | customer/worker/admin主要ページが200、Stripe Elements導線を確認 |
| エッジケース | PASS | 認証なし401、権限外403、期限切れJWT401、二重承諾409、完了済み更新409、キャンセル済み完了409、未完了レビュー409 |
| 本番診断非公開 | PASS | `GET /api/health/db` と `/api-docs` が404 |
| アップロード永続性 | PASS | DBフォールバック実装後、再デプロイ後の `/uploads/...` が200 |
| Prisma migration | PASS | `npx prisma migrate status` でDatabase schema is up to date |
| 秘密情報・旧seed表記整理 | PASS | 実DB接続文字列と固定弱パスワード表記をプレースホルダ/強パスワード前提に整理 |
| β運用モードAPI | PASS | `GET /api/public/status` を追加、`GET /api/health` に `operation` を追加 |
| バックエンド停止ガード | PASS | `booking_paused` / `payment_paused` / `maintenance` の主要書き込み停止を実装。Stripe Webhookは停止対象外 |
| フロント停止UI | PASS | 公開状態取得、停止バナー、予約フォーム抑止、決済ボタン抑止を実装 |
| Webhook構造化ログ | PASS | `eventId`, `type`, `paymentIntentId`, `paymentId`, `paymentStatus`, `duplicate` をログ出力 |
| 運用ガードテスト | PASS | `npm run test:ops-guard` で4モードと停止文言/復旧予定の行列を確認 |
| 監視・復旧Runbook | PASS | Uptime/Stripe/Railway/Vercel通知、手動pg_dump、復元確認、切り戻し手順をRunbook化 |
| DB永続運用モード | PASS | `system_settings`, `ops_incidents`, `ops_events` を追加。管理者APIで停止/復旧可能 |
| 自動サーキットブレーカー | PASS | Webhook失敗、決済不整合、DBヘルス失敗の閾値超過で自動停止するサービスを追加 |
| 決済整合性監視 | PASS | `paymentReconciliationService` でStripe PaymentIntentとDB Paymentを定期照合 |
| アプリ内通知 | PASS | `OPS_ALERT_WEBHOOK_URLS` へ自動停止・決済異常・バックアップ成否を通知 |
| 全書き込みガード | PASS | 登録、カード、アップロード、お気に入り、プロフィール、ワーカー不可枠、管理者更新まで停止対象を拡張 |
| 自動バックアップ手段 | PASS | `npm run backup:database` でAES-256-GCM暗号化バックアップとmanifest作成を確認 |
| 24h Auto Ops補強 | PASS | DB永続statusメタ情報、API 5xxサーキット、通知失敗OpsEvent、Stripe orphan照合、フロント503専用表示、Service Workerキャッシュ除外を追加 |
| opsマイグレーション適用 | PASS | `npm run prisma:migrate:deploy` で `20260519073000_add_ops_automation` を適用 |
| Ops監視ワンショット | PASS | `npm run ops:monitor`: `db.ok=true`, `checked=1`, `stripeOrphans=0`, `anomalies=0`, `changed=false` |
| 追加テスト | PASS | `npm run test:ops-guard`, `npm run test:ops-write-guards`, `npm run test:payment-reconciliation`, `node tests\test-ops-ui-static.js` |
| バックアップ実行 | PASS | `npm run backup:database` で `.dump.enc` と `.manifest.json` を作成 |
| 復元ドリル | PASS | `npm run backup:restore-drill -- <backup-file>` で検証DBへ復元成功。`target=verification-db`, `encrypted=true`, RPO 24h / RTO 4h |
| 通知2系統到達 | PASS | `OPS_ALERT_WEBHOOK_URLS` 2件へ通知送信し `deliveredTargets=2`, `failedTargets=0` |
| payment_paused疑似発火 | PASS | 検証DBで `payment_reconciliation_anomaly` から `auto:payment_anomaly_threshold`、`mode=payment_paused`、通知2系統到達 |
| maintenance疑似発火 | PASS | 検証DBで `api_5xx_error` 10件から `auto:api_5xx_threshold`、`mode=maintenance`、通知2系統到達 |
| customer登録カード欄誤認防止 | PASS | Frontend `7bb0649`。`customer/register.html` の未送信カード欄を削除し、カード登録は予約時または支払い設定で行う案内へ変更 |
| worker報酬/精算表示誤認防止 | PASS | Frontend `f83cebc`。`worker/rewards.html` の固定口座/固定報酬/精算履歴とworker不可の `api.getPayments()` 呼び出しを削除。完了した仕事一覧のみ実API由来として残存 |
| worker dashboard報酬表示整理 | PASS | Frontend `bcc8d4e`。admin専用レポートAPI依存と固定報酬/固定実績表示を削除。当月完了件数のみworker向けAPI由来 |
| LINEログイン未提供表示整理 | PASS | Frontend `f16da09`。customer/workerログイン画面の未実装LINEログインボタンと `alert('実装予定')` を削除。通常ログインは維持 |
| admin問い合わせ固定データ削除 | PASS | Frontend `56a133b`。`admin/support.html` の固定問い合わせ/固定事故履歴/固定ステータスを削除。問い合わせ一覧/詳細/更新/アサイン/削除/CSVは実API連携として維持 |
| admin dashboardグラフplaceholder整理 | PASS | Frontend `aaecb6c`。KPIカードは実API連携、日別売上推移グラフは準備中と明記 |
| admin settings未連携UI整理 | PASS | Frontend `0fe8f7d`。未連携メールテンプレート/プッシュ通知/問い合わせ連絡先フォーム、固定操作ログ、未連携CSVボタンを削除。サービスメニュー/対応エリア管理は実API連携として維持 |

## 残課題

| 項目 | 状態 | 理由 |
|------|------|------|
| 外部監視サービス通知の実到達確認 | 公開直前運用確認 | Uptime/Stripe/Railway/VercelはDashboard上の通知先設定が必要。Runbookに到達確認手順を追加済み |
| Railway Dashboardでの自動バックアップ画面確認 | 代替済み | Pro未加入のため手動 `pg_dump` と `pg_restore --list` を正式手順化 |
| Staging分離 | 条件付き | 今回はProduction URLで直接スモーク。β後は独立Stagingを整備する |
| Webhook手動再送 | 条件付き | 実決済Webhookは通過。Stripe Dashboard/CLIからの同一イベント再送はCLI未導入のため未実施 |
| 自動停止の本番疑似発火 | 代替済み | 本番DB破壊を避け、Railway検証DBで `payment_paused` / `maintenance` 疑似発火を実施 |
| 自動バックアップのスケジュール設定 | 運用確認 | ローカル暗号化バックアップと復元ドリルはPASS。日次実行はGitHub ActionsまたはRailway/PITRで継続設定する |
| Stripe Dashboard同一イベント再送 | 条件付き | 実Webhook処理証跡は `processed`。Dashboard/CLIからの同一イベント再送は手動確認が残る |
| 予約作成・決済Intent・領収書DLの復帰前実行 | 条件付き | 本番書き込みを避け、既存Productionスモーク証跡を参照。次回はStagingで再実行する |
| 報酬/精算・返金/キャンセル料の本格管理 | β後対応 | β版では固定表示を削除し、外部管理または個別案内で代替。自動精算や返金/キャンセル料の本格画面は未実装 |
| 日別売上推移グラフ | β後対応 | KPIは実API連携済みだが、グラフ表示は準備中として明記済み |
| メールテンプレート・プッシュ通知・問い合わせ連絡先編集 | β後対応 | `admin/settings.html` の未連携フォームは削除済み。実設定編集API連携は未実装 |
| 操作ログ検索・CSV出力 | β後対応 | 固定操作ログと未連携CSVボタンは削除済み。実ログ検索/出力は未実装 |

## Go / No-Go

現時点の判定は **β公開Go: 24h自動停止ガードあり** です。

条件:
- 公開直前に外部監視サービス、Stripe、Railway、Vercelの通知到達を1回確認する。
- 日次自動バックアップはGitHub ActionsまたはRailway Pro/PITRで継続設定する。
- 本番破壊を避けるため、今後の予約作成・決済Intent作成・領収書DLの復帰前チェックはStagingで行う。
- 停止モード切替後はRunbookの復旧後スモークを通してから `normal` に戻す。

## Dashboard / 外部サービス証跡記録テンプレート

> 注意: 環境変数、Webhook URL、DB接続文字列、APIキー、シークレットの値そのものは記録しない。スクリーンショットを保存する場合は値をマスクする。外部サービスの操作は人間が実施し、CursorはDashboardへのログイン操作を行わない。Go判定を覆すNGが出た場合は `docs/BETA_RELEASE_FINAL_CHECKLIST.md` も更新する。

### 共通記録欄

| 確認日 | 確認者 | 対象サービス | 確認対象 | 結果 | スクリーンショット保存先 | メモ | 次対応 |
|--------|--------|--------------|----------|------|--------------------------|------|--------|
| 未記入 | 未記入 | 未記入 | 未記入 | 未確認 | 未記入 | 未記入 | 未記入 |

### Railway 確認

| 確認項目 | 結果 | スクリーンショット保存先 | メモ | 次対応 |
|----------|------|--------------------------|------|--------|
| 最新Backend commitがProductionに反映されている | 未確認 | 未記入 | commit SHAを記録。秘密値は記録しない | 未記入 |
| DeploymentがActiveである | 未確認 | 未記入 | Deployments画面で確認 | 未記入 |
| build logで `prisma generate` が成功している | 未確認 | 未記入 | `postinstall` 実行でも可 | 未記入 |
| build/deploy logで `prisma migrate deploy` 成功、または実行方針確認済み | 未確認 | 未記入 | migration statusの証跡と矛盾しないこと | 未記入 |
| `DATABASE_URL` が本番DB向きであることを目視確認 | 未確認 | 未記入 | 値は記録しない。必要ならマスク済みスクショのみ | 未記入 |
| 必要に応じて `DIRECT_URL` を確認 | 未確認 | 未記入 | 未使用なら未使用理由を記録 | 未記入 |
| CORS / operation mode / backup / Stripe系envを目視確認 | 未確認 | 未記入 | 値は記録せず、設定有無と方針のみ記録 | 未記入 |

### Vercel 確認

| 確認項目 | 結果 | スクリーンショット保存先 | メモ | 次対応 |
|----------|------|--------------------------|------|--------|
| 最新Frontend commitがProductionに反映されている | 未確認 | 未記入 | commit SHAを記録 | 未記入 |
| Production deploymentがActive / Readyである | 未確認 | 未記入 | Production Aliasも確認 | 未記入 |
| Production Aliasが正しい | 未確認 | 未記入 | 利用者向けURLと一致すること | 未記入 |
| `js/config.js` の最新markerまたはAPI接続先を確認 | 未確認 | 未記入 | API URLが本番Backendを向くこと | 未記入 |
| Frontend URLが正常表示される | 未確認 | 未記入 | 主要ページ確認と合わせてよい | 未記入 |

### GitHub Actions / Backup 確認

| 確認項目 | 結果 | スクリーンショット保存先 | メモ | 次対応 |
|----------|------|--------------------------|------|--------|
| 最新の backup / restore drill が成功している | 未確認 | 未記入 | `Database backup and restore drill #6` または最新run | 未記入 |
| backup artifactが存在する | 未確認 | 未記入 | artifact名、サイズ、作成時刻を記録 | 未記入 |
| artifact保管期間を確認した | 未確認 | 未記入 | GitHub Actions設定または運用方針 | 未記入 |
| Node.js 20 warningの有無を確認した | 未確認 | 未記入 | warningありなら「公開後対応」または「要対応」を記録 | 未記入 |

### Stripe 確認

| 確認項目 | 結果 | スクリーンショット保存先 | メモ | 次対応 |
|----------|------|--------------------------|------|--------|
| Webhook endpointが正しい | 未確認 | 未記入 | 本番/テスト方針と一致すること | 未記入 |
| `STRIPE_WEBHOOK_SECRET` 設定を確認 | 未確認 | 未記入 | 値は記録しない | 未記入 |
| Webhook署名検証が有効 | 未確認 | 未記入 | 署名不一致の拒否ログまたは設定を確認 | 未記入 |
| Webhook失敗通知が有効 | 未確認 | 未記入 | 通知先と受信確認時刻を記録 | 未記入 |
| 支払い失敗/異常通知が有効 | 未確認 | 未記入 | 通知先と受信確認時刻を記録 | 未記入 |
| 同一イベント再送確認 | 未確認 | 未記入 | 重複処理されないことを確認 | 未記入 |
| Staging決済E2Eの実施有無 | 未確認 | 未記入 | 未実施なら継続課題として記録 | 未記入 |

### 外部監視・通知確認

| 確認項目 | 結果 | 通知先 | テスト通知受信時刻 | 受信者 | スクリーンショット保存先 | 次対応 |
|----------|------|--------|--------------------|--------|--------------------------|--------|
| Backend `/api/health` 監視 | 未確認 | 未記入 | 未記入 | 未記入 | 未記入 | 未記入 |
| Frontend URL監視 | 未確認 | 未記入 | 未記入 | 未記入 | 未記入 | 未記入 |
| Railway deploy失敗通知 | 未確認 | 未記入 | 未記入 | 未記入 | 未記入 | 未記入 |
| Vercel deploy失敗通知 | 未確認 | 未記入 | 未記入 | 未記入 | 未記入 | 未記入 |
| Stripe通知 | 未確認 | 未記入 | 未記入 | 未記入 | 未記入 | 未記入 |
| 外部監視通知 | 未確認 | 未記入 | 未記入 | 未記入 | 未記入 | 未記入 |

### 本番主要画面 / 停止UI 確認

| 確認項目 | 結果 | スクリーンショット保存先 | メモ | 次対応 |
|----------|------|--------------------------|------|--------|
| customer主要画面が表示される | 未確認 | 未記入 | 重大なConsole/Networkエラーなし | 未記入 |
| worker主要画面が表示される | 未確認 | 未記入 | 重大なConsole/Networkエラーなし | 未記入 |
| admin主要画面が表示される | 未確認 | 未記入 | 重大なConsole/Networkエラーなし | 未記入 |
| Console重大エラーなし | 未確認 | 未記入 | 警告とブロッカーを区別して記録 | 未記入 |
| Network重大エラーなし | 未確認 | 未記入 | 404/500/認証エラーの扱いを記録 | 未記入 |
| `KajishiftOps` 読み込み確認 | 未確認 | 未記入 | `window.KajishiftOps` 等で確認 | 未記入 |
| operation status取得確認 | 未確認 | 未記入 | `/api/public/status` または同等のNetwork確認 | 未記入 |
| 停止バナー / 503 UI確認 | 未確認 | 未記入 | Stagingまたは安全な確認方法で実施 | 未記入 |

### DBバックアップ運用確認

| 確認項目 | 結果 | 記録 | スクリーンショット保存先またはメモ | 次対応 |
|----------|------|------|----------------------------------|--------|
| バックアップ保管先 | 未確認 | 未記入 | 値やURLに秘密情報がある場合はマスク | 未記入 |
| 保持期間 | 未確認 | 未記入 | 直近7世代以上を目安 | 未記入 |
| 復元ドリル実施状況 | 未確認 | 未記入 | 最新runまたは手動ログ | 未記入 |
| 次回復元ドリル予定 | 未確認 | 未記入 | 日付またはcron設定 | 未記入 |
| 責任者 | 未確認 | 未記入 | 個人名または役割名 | 未記入 |

### ステータス集計

| 項目 | 状態 | ブロッカー | 次対応 | 参照先 |
|------|------|------------|--------|--------|
| Railway証跡 | 未確認 | No | Dashboard確認結果を記録 | 本ファイル、`docs/BETA_RELEASE_FINAL_CHECKLIST.md` |
| Vercel証跡 | 未確認 | No | Dashboard確認結果を記録 | 本ファイル、`docs/BETA_RELEASE_FINAL_CHECKLIST.md` |
| GitHub Actions / Backup | 未確認 | No | 最新runとartifactを確認 | 本ファイル、GitHub Actions |
| Stripe | 未確認 | No | Webhook/通知/再送確認 | 本ファイル、Stripe Dashboard |
| 外部監視・通知 | 未確認 | No | 監視設定とテスト通知を確認 | 本ファイル、`docs/BETA_OPERATIONS_RUNBOOK.md` |
| 本番主要画面 / 停止UI | 未確認 | No | 画面・Console・Network確認 | 本ファイル、`docs/BETA_RELEASE_FINAL_CHECKLIST.md` |
| DBバックアップ運用 | 未確認 | No | 保管先・保持期間・次回ドリルを記録 | 本ファイル、`docs/BETA_OPERATIONS_RUNBOOK.md` |

## 2026-06-03 テスト結果

| コマンド | 結果 | 備考 |
|----------|------|------|
| `npm run test:ops-guard` | PASS | `normal` / `booking_paused` / `payment_paused` / `maintenance` のcapability行列 |
| `npm run test:ops-write-guards` | PASS | 例外を除くPOST/PUT/PATCH/DELETEのガード漏れ検出 |
| `npm run test:payment-reconciliation` | PASS | amount/currency/bookingId/userId/paymentId不一致検知 |
| `node tests\test-ops-ui-static.js` | PASS | フロント停止UI、カード/チャット抑止、Service Workerキャッシュ除外 |
| `npm run ops:monitor` | PASS | DB接続OK、決済照合1件、異常0、自動停止なし |
| `npm run backup:database` | PASS | 暗号化 `.dump.enc` とmanifestを作成 |
| `npm run backup:restore-drill -- <backup-file>` | PASS | 検証DBへ復元成功 |
| 通知2系統テスト | PASS | `deliveredTargets=2`, `failedTargets=0` |
| `payment_paused` 疑似発火 | PASS | 検証DBでDB永続モード変更、通知2系統、予約/決済/カード抑止を確認 |
| `maintenance` 疑似発火 | PASS | 検証DBでDB永続モード変更、通知2系統、書き込み停止、問い合わせ例外を確認 |

# KAJISHIFT β公開前 最終チェックリスト

最終更新: 2026-06-05

## 前提判定

- 現時点の実確認後判定: **Conditional Go**
- 条件: **24h自動停止ガードは実装・検証済み。本番最新デプロイ反映と本番読み取り系の再確認完了がβ公開前必須**
- 本番での予約作成、PaymentIntent作成、領収書DLの再実行は、本番データ保護のため行わない。
- 本番書き込みを伴う追加E2EはStagingで実施する。

判定区分:

| 判定 | 意味 |
|------|------|
| OK | β公開前条件として確認済み、または既存証跡で代替可能 |
| 要確認 | β公開直前に人間がDashboard、画面、ログで確認する |
| 継続 | β公開後も定期運用・Staging整備として継続する |
| No-Go | 未解消の場合、β公開を止める |

## 2026-06-05 Cursor実確認サマリー

本確認では、本番データ保護のため、予約作成、PaymentIntent作成、決済実行、領収書DL再実行、本番DBを書き換える管理操作は実行していない。

追加切り分け結果:

- BackendのローカルHEADとGitHub `origin/main` は `d85486e9ec45000965257dfbdc7e67455be87368` で一致しているが、24h Auto Ops対応ファイルは未コミットの作業ツリーに残っている。
- `origin/main` の `src/index.js` には `/api/public` router登録と `health.operation` が存在せず、`src/routes/public.js` も存在しない。
- FrontendのローカルHEADとGitHub `origin/main` は `98e51c933bab46184eaebb0d1fe129cb86f05796` で一致しているが、ops UI対応は未コミットの作業ツリーに残っている。
- `origin/main` の `js/config.js` は `KAJISHIFT_CONFIG_VERSION='2026-05-18-stripe-beta'` で、ops版 `2026-06-03-24h-auto-ops` は未push。
- Railway/VercelのRedeployはGitHub `main` の既存commitを再ビルドしているだけのため、未pushの24h Auto Ops対応は反映されない。

| 対象 | 実確認結果 | 確認方法 | 期待結果 | 証跡ファイル/ログの保存先 | 判定 | 残課題 | 扱い |
|------|------------|----------|----------|----------------------------|------|--------|------|
| Railway最新デプロイ確認 | ローカルでは `/api/public/status` 200、`/api/health.operation` あり。本番APIは `/api/health` 200だが `operation` なし、`/api/public/status` 404。原因は24h Auto Ops対応がGitHub `main` に未pushのため | `GET https://kajishift-backend-production.up.railway.app/api/health`, `GET /api/public/status`, ローカル `http://localhost:3999/api/...`, `git show origin/main:src/index.js` | `health.operation` あり、`/api/public/status` が200で `normal` | Shell実行ログ、本ファイル | No-Go | Backendの未コミット変更をcommit/push後、Railwayで該当commitのDeploy成功・SHAをスクショ保存 | β公開前必須 |
| Vercel最新デプロイ確認 | 本番 `js/config.js` は `KAJISHIFT_CONFIG_VERSION='2026-05-18-stripe-beta'`。ローカルのops版 `2026-06-03-24h-auto-ops` はGitHub `main` に未push | `GET https://kajishift-frontend.vercel.app/js/config.js?check=...`, `git show origin/main:js/config.js` | ops版config marker、Production API URL、Beta modeが確認できる | Shell実行ログ、本ファイル | No-Go | Frontendの未コミット変更をcommit/push後、Vercel Production Aliasとcommit SHAをスクショ保存 | β公開前必須 |
| 現在稼働中commit/deploy ID | Backend `origin/main=d85486e9ec45000965257dfbdc7e67455be87368`、Frontend `origin/main=98e51c933bab46184eaebb0d1fe129cb86f05796`。どちらも24h Auto Ops未push状態 | `git rev-parse HEAD`, `git ls-remote origin main`, Railway/Vercel Dashboard | 稼働中デプロイIDと対象commitが、24h Auto Opsを含む新commitと一致 | `docs/BETA_EXECUTION_RESULT.md`, Dashboardスクショ | Dashboard確認待ち | commit/push後、Railway/VercelのDeployments画面で稼働中commitを記録 | β公開前必須 |
| 本番 `prisma migrate deploy` 確認 | `npx prisma migrate status` で対象DBは `Database schema is up to date`。14 migrations確認 | `npx prisma migrate status` | `20260519073000_add_ops_automation` まで適用済み | Shell実行ログ、Prisma migration status | OK | Railway deploy log上の `prisma migrate deploy` 成功スクショは別途保存 | β公開前必須の主要確認はPASS、証跡スクショ待ち |
| 本番環境変数確認 | ローカル `.env` では必要名の存在、通知2系統、Stripe test key prefix、CORS非wildcard、復元guardを確認。Railway実値はDashboard確認が必要 | dotenvを読み、値を表示せず存在・prefix・件数のみ確認 | 必須envあり、URLや秘密値はログに出さない | Shell実行ログ、本ファイル | 一部OK / Dashboard確認待ち | Railway VariablesでProductionの `DATABASE_URL`, Stripe, operation mode, backup, CORSを目視確認 | β公開前必須 |
| Vercel API URL確認 | ローカル `js/config.js` はProduction APIを指す。本番配信configは最新markerなし | `ReadFile js/config.js`, 本番 `config.js` fetch | ProductionフロントがProduction APIを指す | `kajishift-frontend/js/config.js`, Shell実行ログ | Dashboard確認待ち / 本番反映待ち | Vercel最新デプロイ後にNetworkログで `/api/public/status` 取得を確認 | β公開前必須 |
| 本番読み取り系確認 | ローカルは `/api/health`, `/api/public/status`, `/api/public/status/health` がすべて200。本番は `/api/health` 200、`/api/public/status` 404。フロント `/`, `/index.html`, `/customer/login.html`, `/worker/login.html` は200 | fetchによるGETのみ | health 200 + operation、public status 200 normal、主要ページ200 | Shell実行ログ、本ファイル | No-Go | 最新バックエンド反映後に `/api/public/status` と `health.operation` を再確認 | β公開前必須 |
| 外部監視/通知設定確認 | アプリ内通知2系統は到達済み。Uptime/Railway/Vercel/Stripe通知はDashboard確認が必要 | 既存通知テスト結果、Runbook確認 | 2系統通知、外部監視、各Dashboard通知が有効 | `docs/BETA_EXECUTION_RESULT.md`, `docs/BETA_OPERATIONS_RUNBOOK.md` | Dashboard確認待ち | 監視サービス、Railway、Vercel、Stripeの通知設定スクショ保存 | β公開前必須 |
| 日次バックアップ継続設定 | `.github/workflows/database-backup.yml` に日次backupと週次restore drill scheduleあり。`gh` が未インストールでActions有効化/実行履歴は未確認 | workflowファイル確認、`gh workflow list` 試行 | schedule有効、secrets設定、直近run成功 | workflowファイル、GitHub Actions画面 | Dashboard確認待ち | GitHub Actionsでworkflow有効化、secrets、直近run成功を確認 | β公開前必須 |
| ローカルガード系テスト | PASS | `npm run test:ops-guard`, `npm run test:ops-write-guards`, `npm run test:payment-reconciliation`, フロント `node tests\test-ops-ui-static.js` | 全てPASS | Shell実行ログ | OK | なし | β公開前確認済み |

## 1. デプロイ確認

| チェック | 確認方法 | 期待結果 | 証跡ファイル/ログの保存先 | 判定 |
|----------|----------|----------|----------------------------|------|
| [ ] Railwayにバックエンド最新コードがデプロイ済み | ローカルはstatus/health実装OK。本番API読み取りでは `/api/public/status` が404、`health.operation` なし | 最新コミットが `Success` / `Active`、`/api/public/status` が200 | Shell実行ログ、Railway Deploymentsのスクリーンショット、`docs/BETA_EXECUTION_RESULT.md` | No-Go（本番反映待ち） |
| [ ] Vercelにフロントエンド最新コードがデプロイ済み | 本番 `js/config.js` は `2026-05-18-stripe-beta`。ops版 `2026-06-03-24h-auto-ops` 未反映 | 最新コミットがProductionへ反映済み、ops版config markerあり | Shell実行ログ、Vercel Deploymentsのスクリーンショット、フロント `docs/RELEASE_TEST_RESULTS.md` | No-Go（本番反映待ち） |
| [ ] 現在稼働しているコミット/デプロイIDを確認 | ローカルcommitはBackend `d85486e9ec45000965257dfbdc7e67455be87368`、Frontend `98e51c933bab46184eaebb0d1fe129cb86f05796`。稼働中deploy IDはDashboardで確認 | バックエンド/フロントの稼働中デプロイIDと対象commitが追跡可能 | `docs/BETA_EXECUTION_RESULT.md` 追記欄、Railway/Vercelスクリーンショット | Dashboard確認待ち |
| [x] 本番で `prisma migrate deploy` が完了 | `npx prisma migrate status` を実行。DB schema is up to date、14 migrations確認 | `20260519073000_add_ops_automation` まで適用済み | Shell実行ログ、Railway deploy logスクリーンショット待ち | OK（deploy log証跡待ち） |
| [ ] 本番起動時にPrisma client生成が成功 | Railway build/deploy logで `prisma generate` または `postinstall` を確認 | Prisma Clientが最新schemaで生成済み | Railway build log | 要確認 |

## 2. 環境変数確認

| チェック | 確認方法 | 期待結果 | 証跡ファイル/ログの保存先 | 判定 |
|----------|----------|----------|----------------------------|------|
| [ ] 本番 `DATABASE_URL` が正しい接続先 | Cursor上の `.env` は存在確認済み、`npx prisma migrate status` で対象DB接続OK。Railway Variablesは目視確認する。値は記録しない | Production DBを指し、検証DBやローカルDBではない | Shell実行ログ、確認者/確認時刻のみ `docs/BETA_EXECUTION_RESULT.md` に記録 | Dashboard確認待ち |
| [ ] `DIRECT_URL` が必要に応じて本番DBを指す | Cursor上の `.env` では未設定。Railway Variablesで必要性と接続先を確認 | Prisma migration用接続先が必要な場合は本番DB | Railway Variables確認メモ | ユーザー確認待ち |
| [x] `OPS_ALERT_WEBHOOK_URLS` が2系統設定済み | Cursor上で件数のみ確認。URL値は記録しない | 2件以上、Slack/Discord等の有効Webhook | 通知テスト結果 `deliveredTargets=2`, `failedTargets=0` | OK |
| [x] operation mode関連環境変数が正しい | Cursor上では `BETA_OPERATION_MODE` 未設定でdefault normal、`BETA_OPERATION_MODE_OVERRIDE` 未設定 | 通常時はdefault `normal`、緊急overrideは未設定 | Shell実行ログ、Railway Variables確認メモ待ち | OK（Railway確認待ち） |
| [x] バックアップ関連の環境変数名が正しい | Cursor上で `BACKUP_ENCRYPTION_KEY`, `RESTORE_DATABASE_URL`, `RESTORE_DRILL_CONFIRM`, `PG_DUMP_PATH`, `PG_RESTORE_PATH` の存在を確認 | 暗号化キーあり、復元先は検証DB、`RESTORE_DRILL_CONFIRM=verification-db` | Shell実行ログ、`docs/BETA_EXECUTION_RESULT.md`、バックアップmanifest | OK（GitHub secrets確認待ち） |
| [x] Stripe関連の本番/テスト混在がない | Cursor上で `STRIPE_SECRET_KEY=sk_test_...`, `STRIPE_PUBLISHABLE_KEY=pk_test_...` prefixを確認。Dashboard環境は目視確認 | β方針どおりStripe Test Modeで統一。意図しないlive/test混在なし | Shell実行ログ、Stripe Dashboard確認メモ待ち | OK（Dashboard確認待ち） |
| [ ] Vercel側API URLが本番APIを向く | ローカル `js/config.js` と本番配信 `config.js` はProduction APIを指す。ただし本番配信は旧marker `2026-05-18-stripe-beta` でops版未反映 | ProductionフロントからProduction APIへ通信し、最新ops configが配信される | Shell実行ログ、Vercel Variables確認メモ、ブラウザNetworkスクリーンショット | No-Go（本番反映待ち） |
| [x] CORS originが本番フロントに限定 | Cursor上では `CORS_ORIGIN` 存在、wildcardではないことを確認。Railway Variablesで実値を目視確認 | `*` ではなく本番Vercel originを許可 | Shell実行ログ、Railway Variables確認メモ待ち | OK（Railway確認待ち） |

## 3. 本番読み取り系確認

| チェック | 確認方法 | 期待結果 | 証跡ファイル/ログの保存先 | 判定 |
|----------|----------|----------|----------------------------|------|
| [ ] `GET /api/health` が正常応答 | ローカルではHTTP 200 + `operation.mode=normal`。本番ではHTTP 200だが `operation` なし | HTTP 200、`operation` に現在状態が含まれる | Shell実行ログ、スクリーンショット | No-Go（最新Backend反映待ち） |
| [ ] `GET /api/public/status` が `normal` を返す | ローカルではHTTP 200 + `data.currentMode=normal`。本番では404 | `mode` / `currentMode` が `normal`、停止対象なし | Shell実行ログ、`docs/BETA_EXECUTION_RESULT.md` | No-Go（最新Backend反映待ち） |
| [ ] フロントが最新statusを取得 | ブラウザNetworkで `/api/public/status` を確認。APIが404のため現時点では未達 | stale cacheではなく最新statusを取得 | ブラウザNetworkスクリーンショット | No-Go（最新Backend反映待ち） |
| [x] ログイン画面が表示される | 本番フロント `/`, `/index.html`, `/customer/login.html`, `/worker/login.html` をGET | HTMLがHTTP 200で返る | Shell実行ログ、スクリーンショット待ち | OK（画面目視待ち） |
| [ ] 主要ページが表示される | 顧客/ワーカー/管理者の主要ページを読み取り中心で確認 | 200表示、重大なConsole errorなし | スクリーンショット、Consoleログ | 要確認 |
| [ ] 停止UI読み込みに問題がない | `KajishiftOps` の読み込み、Service Worker更新、status取得を確認 | 停止バナー/503パネル用JS/CSSが最新 | ブラウザNetwork/Consoleログ | 要確認 |
| [x] 本番で予約作成・PaymentIntent作成・領収書DLを再実行しない | 既存Productionスモーク証跡を参照 | 本番データを増やさず、既存証跡で代替 | `docs/BETA_RELEASE_GONOGO_CHECKLIST.md` | OK |

## 4. 監視・通知確認

| チェック | 確認方法 | 期待結果 | 証跡ファイル/ログの保存先 | 判定 |
|----------|----------|----------|----------------------------|------|
| [ ] 外部監視が有効 | Uptime監視サービスでBackend `/api/health` とFrontend URLを確認。CursorからDashboard確認不可 | 5分程度の監視頻度で有効、失敗時通知あり | 監視Dashboardスクリーンショット | Dashboard確認待ち |
| [ ] Railway通知が有効 | Railway project通知設定を確認。CursorからDashboard確認不可 | Deploy失敗、runtime異常を通知 | Railway通知設定スクリーンショット | Dashboard確認待ち |
| [ ] Vercel通知が有効 | Vercel project通知設定を確認。CursorからDashboard確認不可 | Deploy失敗を通知 | Vercel通知設定スクリーンショット | Dashboard確認待ち |
| [ ] Stripe通知が有効 | Stripe DashboardでWebhook失敗、支払い失敗/異常通知を確認。CursorからDashboard確認不可 | Webhook失敗・決済異常が担当者へ通知 | Stripe Dashboardスクリーンショット | Dashboard確認待ち |
| [x] 通知2系統が到達確認済み | `sendOpsAlert` テスト結果を確認 | `configuredTargets=2`, `deliveredTargets=2`, `failedTargets=0` | `docs/BETA_EXECUTION_RESULT.md`、通知先の受信ログ | OK |
| [ ] 異常時の通知先が明記済み | Runbookと共有先を確認 | 通知先、確認担当、一次対応者が明確 | `docs/BETA_OPERATIONS_RUNBOOK.md`、運用連絡先 | 要確認 |
| [ ] 一次対応手順が明記済み | Runbookの障害時確認順序と停止/復帰手順を確認 | DB/Stripe/API/フロントの確認順序が明確 | `docs/BETA_OPERATIONS_RUNBOOK.md` | OK |

## 5. バックアップ・復元確認

| チェック | 確認方法 | 期待結果 | 証跡ファイル/ログの保存先 | 判定 |
|----------|----------|----------|----------------------------|------|
| [x] 暗号化バックアップが成功 | `npm run backup:database` の実行結果を確認 | `.dump.enc` と `.manifest.json` 作成 | `backups/` 配下のmanifest、`docs/BETA_EXECUTION_RESULT.md` | OK |
| [x] 復元ドリルが検証DBで成功 | `npm run backup:restore-drill -- <backup-file>` 実行結果を確認 | `target=verification-db`, `encrypted=true`、復元成功 | restore drill log、`docs/BETA_EXECUTION_RESULT.md` | OK |
| [ ] 日次バックアップ継続スケジュールが設定済み | `.github/workflows/database-backup.yml` に `0 18 * * *` の日次scheduleを確認。`gh` 未インストールのためActions有効化/実行履歴はDashboard確認 | 24時間以内のRPOを満たす日次実行、直近run成功 | GitHub Actions run、Railway/PITR設定スクリーンショット | Dashboard確認待ち |
| [ ] バックアップ保管先が確認済み | 保存先、暗号化、アクセス権限を確認 | 権限が限定され、平文dumpが残らない | 保管先設定メモ、manifest | 要確認 |
| [ ] 保持期間が確認済み | `BACKUP_RETENTION_COUNT` と保管ポリシーを確認 | 直近7世代以上を保持 | Railway/GitHub Actions設定、manifest | 要確認 |
| [x] 復元手順が確認済み | Runbookの復元手順を確認 | 検証DBで実復元済み、本番DBへ誤復元しないguardあり | `docs/BETA_OPERATIONS_RUNBOOK.md` | OK |
| [ ] 週次復元ドリルの継続予定がある | GitHub Actions weekly jobまたは運用カレンダーを確認 | 週1回の復元確認が継続される | GitHub Actions workflow、運用カレンダー | 継続 |

## 6. 決済・Webhook確認

| チェック | 確認方法 | 期待結果 | 証跡ファイル/ログの保存先 | 判定 |
|----------|----------|----------|----------------------------|------|
| [x] Stripe Webhook直近イベントが `processed` | DB `stripe_events` 直近レコードを確認 | 直近 `payment_intent.succeeded` が `processed` | `docs/BETA_EXECUTION_RESULT.md` | OK |
| [x] Stripe Webhook failed件数が0 | DB `stripe_events` のfailed件数を確認 | `failedStripeEvents=0` | `docs/BETA_EXECUTION_RESULT.md` | OK |
| [ ] Webhook署名検証が有効 | `STRIPE_WEBHOOK_SECRET` とWebhook controllerの署名検証ログを確認 | 署名なし/不正署名が拒否される | Railway Variables確認メモ、Stripe Dashboard | 要確認 |
| [x] 決済異常時に `payment_paused` へ遷移できる | 検証DBで疑似 `payment_reconciliation_anomaly` を作成 | `auto:payment_anomaly_threshold` で `payment_paused` | `docs/BETA_EXECUTION_RESULT.md` | OK |
| [x] `payment_paused` で予約/決済/カード操作が抑止される | 検証DBのcapabilityと静的ガードテストを確認 | `createBooking`, `createPaymentIntent`, `cardWrite` が停止 | `npm run test:ops-guard`、`docs/E2E_EDGE_CASE_MATRIX.md` | OK |
| [ ] 同一イベント再送時の冪等性 | Stripe DashboardまたはStripe CLIで同一eventを再送 | 重複処理されず、既存 `stripe_events` とPayment状態が壊れない | Stripe Dashboard delivery log、API log | 継続 |
| [ ] Stagingで本番相当決済E2Eを実施 | Stagingで予約、PaymentIntent、決済成功、Webhook、領収書DLを通す | 本番データを汚さず決済全体を再確認 | Staging E2Eログ | 継続 |

## 7. 運用モード・停止ガード確認

| チェック | 確認方法 | 期待結果 | 証跡ファイル/ログの保存先 | 判定 |
|----------|----------|----------|----------------------------|------|
| [ ] 本番運用モードが `normal` | 2026-06-05の本番 `GET /api/public/status` は404のため未確認。最新Backend反映後に再確認する | `currentMode=normal`, `blockedOperations=[]` | Shell実行ログ、`docs/BETA_EXECUTION_RESULT.md` | No-Go（最新Backend反映待ち） |
| [x] `payment_paused` 切替手順が明記済み | Runbookの受付停止・復旧手順を確認 | 管理者APIまたは自動サーキットで切替可能 | `docs/BETA_OPERATIONS_RUNBOOK.md` | OK |
| [x] `maintenance` 切替手順が明記済み | Runbookの受付停止・復旧手順、override手順を確認 | 管理者API、自動サーキット、緊急override手順が明確 | `docs/BETA_OPERATIONS_RUNBOOK.md` | OK |
| [x] 停止時に予約/決済/カード操作が抑止される | `npm run test:ops-guard`, `npm run test:ops-write-guards` | 書き込みAPIのガード漏れなし | テスト実行ログ、`docs/E2E_EDGE_CASE_MATRIX.md` | OK |
| [x] フロント停止UIが表示される | フロント静的テストと実装確認 | バナー、ボタン抑止、503パネル、Service Worker除外あり | フロント `docs/RELEASE_TEST_RESULTS.md` | OK |
| [x] 復帰手順が明記済み | Runbookのnormal復帰前チェックを確認 | DB/Payment/Webhook/通知確認後に手動で `normal` へ戻す | `docs/BETA_OPERATIONS_RUNBOOK.md` | OK |
| [ ] 本番デプロイ後の停止UI読み取り確認 | 本番フロントでstatus取得とUI読み込みを確認 | 最新JS/CSSが読み込まれ、停止UIが利用可能 | ブラウザNetwork/Consoleログ | 要確認 |

## 8. 既知事象・残リスク

| チェック | 確認方法 | 期待結果 | 証跡ファイル/ログの保存先 | 判定 |
|----------|----------|----------|----------------------------|------|
| [x] Windowsローカル短命Node通知テスト終了時のPrisma系assertを記録 | 通知送信後 `deliveredTargets=2` の後に終了時assertが出た事象を記録 | 通知/DB処理完了後の終了時事象として扱う。本番常駐APIのブロッカーにしない | 本ファイル、`docs/BETA_EXECUTION_RESULT.md` 追記推奨 | OK |
| [ ] Staging未分離または未整備リスクを記載 | 現在のStaging有無を確認 | 本番書き込みE2Eを避けるため、Staging整備を継続課題化 | `docs/RELEASE_READINESS_CHECKLIST.md` | 継続 |
| [x] DB完全停止時の対応方針を記載 | RunbookのDB完全停止時手順を確認 | 外部監視で検知し、`BETA_OPERATION_MODE_OVERRIDE=maintenance` で補完 | `docs/BETA_OPERATIONS_RUNBOOK.md` | OK |
| [ ] 日次バックアップ継続設定の未実施状況を明記 | GitHub Actions/Railway/PITRの実設定を確認 | 未設定ならβ公開前必須、設定済みならOKへ更新 | 本ファイル、GitHub Actions/Railway設定 | 要確認 |
| [ ] 外部監視の未実施状況を明記 | Uptime/Railway/Vercel/Stripe通知設定を確認 | 未設定ならβ公開前必須、設定済みならOKへ更新 | 監視Dashboardスクリーンショット | 要確認 |
| [ ] 本番相当E2E未実施状況を明記 | Staging E2E実行状況を確認 | 本番では再実行せず、Stagingで継続実施 | Staging E2Eログ | 継続 |

## 9. Go / No-Go 判定

| 項目 | 内容 |
|------|------|
| 判定 | **Conditional Go** |
| 条件 | **24h自動停止ガードはローカル/検証DBで実装・検証済み**。ただしBackend/FrontendともGitHub `main` に未pushのため、β公開実行前にcommit/push、Railway/Vercel最新デプロイ反映、`/api/public/status` 200 normal の再確認が必須 |
| 未完了項目 | Backend 24h Auto Ops変更のcommit/push、Frontend ops UI変更のcommit/push、Railway最新デプロイ反映、Vercel最新デプロイ反映、本番最新デプロイID記録、本番 `/api/public/status` 200 normal、`health.operation` 表示、Railway/Vercel/Stripe/外部監視通知設定のDashboard確認、日次バックアップ継続スケジュールの実行履歴確認、Stripe同一イベント再送、Staging本番相当E2E |
| β公開前に必須で潰す項目 | Railway/Vercel最新デプロイ確認、本番 `prisma migrate deploy` / migration status確認、本番環境変数確認、本番読み取り系確認、外部監視/通知設定確認、日次バックアップ継続設定確認 |
| β公開後に継続対応する項目 | Staging整備、本番相当E2E、Stripe同一イベント再送、週次復元ドリル、バックアップ保管/保持監査、Windows短命Node assertのCI/Linux再確認 |
| 判断理由 | ローカル実装、検証DBドリル、通知、バックアップ、復元、書き込みガード、停止UI静的テストはPASS。一方で24h Auto Ops対応はGitHub `main` に未pushで、本番APIは `/api/public/status` が404、`/api/health` に `operation` がなく、本番フロント配信 `config.js` も旧markerのため、現時点でそのまま公開実行は不可。commit/pushと最新デプロイ反映後に読み取り系がPASSすればGoへ戻せる |

## Stagingで実施する本番相当E2E

| チェック | 確認方法 | 期待結果 | 証跡ファイル/ログの保存先 | 判定 |
|----------|----------|----------|----------------------------|------|
| [ ] 予約作成 | Staging顧客で予約作成 | Booking作成、一覧/詳細表示 | Staging E2Eログ | 継続 |
| [ ] PaymentIntent作成 | Staging予約から決済開始 | Stripe PaymentIntent作成、DB `transactionId` 保存 | Stripe Dashboard、DB確認ログ | 継続 |
| [ ] Stripe決済完了 | 成功カード/3DS/拒否カードを実行 | 成功、追加認証、拒否が期待どおり | Stripe Dashboard、API log | 継続 |
| [ ] Webhook受信 | Stripe event deliveryを確認 | API 200、`stripe_events.status=processed` | Stripe Dashboard delivery log | 継続 |
| [ ] 支払いステータス反映 | Webhook後のPaymentと画面を確認 | `COMPLETED` 反映、UI表示更新 | DB確認ログ、画面スクリーンショット | 継続 |
| [ ] 領収書DL | 完了済みPaymentのPDF取得 | HTTP 200、PDF生成 | API log、ブラウザ確認 | 継続 |
| [ ] 異常時 `payment_paused` 発火 | 疑似不整合またはWebhook失敗閾値を作る | `payment_paused`、通知2系統、予約/決済/カード停止 | OpsEvent/OpsIncident、通知ログ | 継続 |
| [ ] フロント停止UI表示 | `payment_paused` / `maintenance` をStagingで切替 | バナー、ボタン抑止、503表示、復帰後解除 | 画面スクリーンショット、Networkログ | 継続 |

## 共有用サマリー

KAJISHIFT β公開前の現時点判定は **Conditional Go: 24h自動停止ガードは実装・検証済み、ただしGitHub main未push/本番未反映** です。暗号化バックアップ、検証DBへの復元ドリル、通知2系統到達、`payment_paused` / `maintenance` 疑似発火、ガード系テスト、フロント停止UI静的テストはPASS済みです。一方で、Backend/Frontendとも24h Auto Ops対応が未コミットの作業ツリーに残っており、GitHub `main` には含まれていません。β公開前にBackend/Frontendの変更をcommit/pushし、Railway/Vercelへ最新コードを反映し、`/api/public/status` が `normal` を返すこと、フロントが最新statusを取得できること、外部監視/通知と日次バックアップ継続設定がDashboard上で確認できることを必須条件にします。本番データ保護のため、本番での予約作成・PaymentIntent作成・領収書DLの再実行は行わず、既存Productionスモーク証跡を参照します。

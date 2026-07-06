# KAJISHIFT β公開 実行結果

最終更新: 2026-07-06

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
| A案決済関連画面本番URL確認 | PASS | `customer/payment.html`, `worker/rewards.html`, `admin/payments.html` をProduction Aliasで確認。本番決済、本番カード登録、正式な有料予約受付につながる導線なし。Console重大エラーなし、継続的な 500 / 404 / 429 / CORS なし |
| A案問い合わせ導線本番URL確認 | PASS | `customer/support.html`, `worker/support.html`, `admin/dashboard.html`, `admin/support.html` をProduction Aliasで確認。customer/workerからテスト問い合わせを各1件送信し、管理側で受付内容を確認。DB更新・削除を伴う管理操作は未実施。Console重大エラーなし、継続的な 500 / 404 / 429 / CORS なし。本番決済・カード登録・正式有料予約受付への導線なし |
| A案事前登録・β利用希望受付導線確認 | 保留（一部OK） | 公開登録画面は未送信の実ブラウザ確認済み。認証後画面は実ブラウザ確認未実施のため最終判定保留。`worker/screening-test.html`, `admin/users.html`, `admin/workers.html`, `admin/worker-test-submissions.html`, `admin/worker-test-submission-detail.html` と関連JS/APIを静的確認し、対象画面・関連JSに本番決済、カード登録、正式有料予約受付の実行導線は見つからなかった。`/payments/intent`, `/cards/setup-intent`, `/cards`, `/bookings` の書き込み系API呼び出しも対象JSからは見つからなかった |

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
| Stripe本番決済・本番Webhook確認 | B案前必須 | 2026-07-07 A案では未実施。Live ModeのWebhook delivery、署名検証、本番決済成功/失敗、Webhook反映、領収書確認はB案移行前の残タスク |
| 認証後の事前登録・β利用希望受付導線 実ブラウザ確認 | A案公開前確認 | コードベース静的確認では大きなNGなし。ただし認証後実画面、Console/Network、共通ナビの誤認リスクは未確認。既存テストアカウントを使い、DB更新・送信・出力操作を避けて読み取り確認する |

## Go / No-Go

2026-07-07 の判定は **A案Go候補: 本番決済なし限定公開** です。

社長確認により、7月7日はStripe本番決済を有効化せず、正式な有料予約受付、本番カード登録、本番課金につながる導線を未開放にした状態で限定公開する。問い合わせ、事前登録、β利用希望受付、主要画面の確認を公開範囲とする。

Stripe本番決済あり運用は、以下を完了した後に **B案Go/No-Go** として別途判断する。

- 管理画面アクセス制限
- 管理者MFA/2FA
- 管理者ログイン失敗時のアカウントロック
- 脆弱性診断またはペネトレーションテスト証跡
- `/api/admin/*` の追加保護
- Stripe本番Webhook、本番決済、失敗系、Webhook反映、領収書確認

条件:
- 公開直前に customer / worker / admin 主要画面を再確認し、継続的な 500 / 404 / 429 / CORS がないことを記録する。
- `customer/payment.html`, `worker/rewards.html`, `admin/payments.html` が本番決済未開放・準備中として誤認されないことを確認する。
- 問い合わせ、事前登録、β利用希望受付として利用できる導線を確認する。
- 公開直前に外部監視サービス、Railway、Vercelの通知到達を1回確認する。Stripe通知はB案移行前のLive Mode確認で必須証跡とする。
- 日次自動バックアップはGitHub ActionsまたはRailway Pro/PITRで継続設定する。
- 本番破壊を避けるため、今後の予約作成・決済Intent作成・領収書DLの復帰前チェックはStagingで行う。
- 停止モード切替後はRunbookの復旧後スモークを通してから `normal` に戻す。

## Dashboard / 外部サービス証跡記録テンプレート

> 注意: 環境変数、Webhook URL、DB接続文字列、APIキー、シークレットの値そのものは記録しない。スクリーンショットを保存する場合は値をマスクする。外部サービスの操作は人間が実施し、CursorはDashboardへのログイン操作を行わない。Go判定を覆すNGが出た場合は `docs/BETA_RELEASE_FINAL_CHECKLIST.md` も更新する。

### 共通記録欄

| 確認日 | 確認者 | 対象サービス | 確認対象 | 結果 | スクリーンショット保存先 | メモ | 次対応 |
|--------|--------|--------------|----------|------|--------------------------|------|--------|
| 2026-06-22 / 2026-06-25 | KAJISHIFT運用担当 | Railway | Backend Deployment / Logs / Variables / Postgres | OK（一部未確認あり） | `Screenshots/エビデンス_railway_backend-deployment-2026-06-22.png` ほか | Deployment / Variables / Postgresは確認済み。Build/Deploy logsはRailway上で本文確認不可 | ログ未確認項目は既存migration証跡と次回deploy logで補完 |
| 2026-06-29 | Cursor | GitHub Actions | Database backup and restore drill | OK（一部未確認あり） | 未保存（GitHub Actions API / run URLで確認） | 最新run `#34` がsuccess。backup / weekly-restore-drill jobs成功、artifact存在確認済み | Node.js 20 warning有無はログ本文をDashboardで確認 |
| 2026-06-29 | KAJISHIFT運用担当 | Vercel Production Alias | customer主要画面 | OK（一部後続確認あり） | `Screenshots/2026-06-29-production-main-screens/` | login / dashboard / bookings / payment / favoritesの表示、主要API 200、重大Console/Networkエラーなしを確認。スクショ内の個人名・メール・住所・予約情報・userId風の値は本文に記録しない | worker/admin主要画面、`KajishiftOps`明示確認、停止UI、通知Socket再接続などを後続確認 |
| 2026-06-29 | KAJISHIFT運用担当 | Vercel Production Alias | worker主要画面 | NG（一部OK） | `Screenshots/2026-06-29-production-main-screens/` | login / dashboard / jobs / calendar / profileは重大NGなし。rewardsは `/api/payments?limit=100` が500となり、読み込み中表示が残る | rewardsの本番反映状態を修正。admin主要画面、`KajishiftOps`明示確認、停止UIは後続確認 |
| 2026-07-01 | KAJISHIFT運用担当 | Vercel Production / Production Alias | 最新Frontend反映とworker rewards再確認 | OK | `Screenshots/`（証跡用、Git管理対象外） | Vercel Dashboardで `kajishift-frontend` のProduction Deploymentが `fix: clarify unavailable admin settings`、commit `0fe8f7d`、branch `main`、Status `Ready`、Environment `Production` であることを確認。Production Aliasの `worker/rewards.html` では報酬・精算詳細が準備中である旨の文言、`GET /api/bookings?status=COMPLETED...` 200、status系 200、`me` 200、`unread-count` 200、WebSocket 101、Socket.io接続成功を確認。`/api/payments?limit=100`、Network 500、CORSエラー、Console重大エラーは発生なし。スクショ内のuserId風の値は本文に記録しない | Stripe Dashboard、外部監視・通知、admin主要画面、停止UI確認は継続 |
| 2026-07-01 | KAJISHIFT運用担当 / Cursor | Vercel Production Alias | admin主要画面 | 要確認あり | `Screenshots/2026_07_01_admin/`（証跡用、Git管理対象外） | login / users / workers / bookings / payments / support は表示OK。paymentsはStripe本番有効化前でも準備中・Stripe DashboardまたはCSV確認の案内があり、誤認防止はOK。ただし本番決済可否はStripe本番有効化が社長確認待ちのためOK扱いしない。dashboard と worker-test-submissions は `/api/admin/worker-test-submissions...` が404、settingsは `/api/auth/me` と `/api/notifications/unread-count` が429のためOK扱いしない。WebSocket初回失敗/再接続ログは一部画面で見えるが、他画面で101/接続成功も確認できるため要観察 | worker-test-submissions APIの本番Backend反映、settingsの時間を置いた429再確認、admin settings / 停止UI / Stripe本番有効化確認を継続 |
| 2026-07-02 | KAJISHIFT運用担当 | Railway Production / Vercel Production Alias | Backend A案本番反映とadmin再確認 | OK | `Screenshots/`（証跡用、Git管理対象外） | Backend mainを `origin/main` へpush後、Railway Production Auto Deployが実行。最新Deployment `docs: admin設定画面の再確認結果を記録` がsuccessful / Active。Deploy Logsで `npm run prisma:migrate:deploy`、`prisma migrate deploy`、`15 migrations found in prisma/migrations`、`No pending migrations to apply.`、`node src/index.js`、環境変数バリデーション完了を確認。`/api/health` は200相当で `status: OK`、`/api/public/status` は200相当で `mode/currentMode: normal`, `isNormal: true`。admin dashboard と admin worker-test-submissions は表示OK、`worker-test-submissions?...` が200、提出一覧は全0件で「対象の提出はありません」表示。Console重大エラー、Network 500 / CORSエラーなし、Socket.io接続成功 | 7月7日は本番決済なし限定公開。Stripe本番決済開放、通知基盤 / Slack継続判断はB案移行前に別途確認 |
| 2026-07-03 | KAJISHIFT運用担当 | Vercel Production Alias | A案決済関連画面 | OK | `Screenshots/`（証跡用、Git管理対象外） | `customer/payment.html` は「カード登録は準備中」のdisabled表示、カード追加ボタン/カード入力モーダル/カード番号入力欄/カード名義人入力欄/追加ボタンなし。カード登録不可、本番決済・カード登録はセキュリティ対応完了後、問い合わせ・事前登録・β利用希望受付のみ受け付ける旨を表示。`worker/rewards.html` は報酬・精算情報の詳細表示が準備中で、運営から個別案内の趣旨を表示。`admin/payments.html` は決済一覧・売上KPI・報酬精算・キャンセル料管理が実データ連携前、決済状況一覧が準備中、サンプル決済履歴は誤認防止のため非表示と明記。3画面とも本番決済、本番カード登録、正式な有料予約受付、返金・決済確定などの実操作導線なし。主要APIは確認範囲で200、Console重大エラーなし、継続的な 500 / 404 / 429 / CORS なし | A案としてOK。Stripe本番決済・本番Webhook確認は未実施のため、B案移行前の必須残タスクとして継続 |
| 2026-07-03 | KAJISHIFT運用担当 | Vercel Production Alias | A案問い合わせ導線 | OK | `Screenshots/`（証跡用、Git管理対象外） | `customer/support.html` と `worker/support.html` はログイン後に問い合わせフォームを正常表示。件名、問い合わせ種別、返信先メールアドレス、本文を入力でき、テスト問い合わせを各1件送信。送信後に受付完了メッセージを確認し、`POST /api/support` は201。`admin/dashboard.html` では送信済み問い合わせが未対応の問い合わせに表示され、「すべて見る」導線から問い合わせ管理へ進める状態を確認。`admin/support.html` では問い合わせ一覧に送信済み問い合わせが表示され、ステータス新規・未アサイン表示を確認。`対応する`, `自分にアサイン`, `対応開始`, `削除` はDB更新・削除を伴う可能性があるため未押下。Console重大エラーなし、継続的な 500 / 404 / 429 / CORS なし。本番決済、返金、カード登録、正式有料予約受付への導線なし。問い合わせ本文、メール、ID風の値、個人情報、決済情報の実値は本文に記録しない | A案としてOK。Stripe本番決済・本番Webhook確認は未実施のため、B案移行前の必須残タスクとして継続 |
| 2026-07-06 | KAJISHIFT運用担当 | コードベース静的確認 | A案 事前登録・β利用希望受付導線 | 保留（一部OK） | スクリーンショットなし | 公開登録画面は2026-07-03に未送信の実ブラウザ確認済み。認証後画面は実ブラウザ確認未実施のため、`worker/screening-test.html`, `admin/users.html`, `admin/workers.html`, `admin/worker-test-submissions.html`, `admin/worker-test-submission-detail.html` と関連JS/APIを静的確認。`worker/screening-test.html` はワーカー本人の審査テスト回答/提出状況確認画面、`admin/users.html` は依頼者一覧、`admin/workers.html` はワーカー一覧・審査状態、`admin/worker-test-submissions.html` は審査提出一覧、`admin/worker-test-submission-detail.html` は提出詳細と管理者最終判定画面。対象画面・関連JSに本番決済、カード登録、正式有料予約受付の実行導線は見つからず、`/payments/intent`, `/cards/setup-intent`, `/cards`, `/bookings` の書き込み系API呼び出しも対象JSからは見つからなかった。一方で、審査テスト送信、停止/有効化、新規管理者登録、合格/不合格、CSV/Excel出力は更新・出力系操作として存在するため、本番確認時は押下しない運用が必要。共通ナビに「予約管理」「決済・売上」、ワーカー側に「仕事を探す」「報酬」などの表示があるため、A案期間中の誤認リスクは実ブラウザで確認が必要。静的確認ベースでは大きなNGなし。ただし認証後実ブラウザ確認、Console/Network確認、共通ナビの誤認リスク確認は未実施のため最終判定は保留 | 既存テストアカウントで認証後実ブラウザ読み取り確認を実施。送信、更新、削除、出力、DB作成を伴う操作はしない。個人情報、ID風の値、決済情報、Secret類の実値は記録しない |

### Railway 確認

| 確認項目 | 結果 | スクリーンショット保存先 | メモ | 次対応 |
|----------|------|--------------------------|------|--------|
| 最新Backend commitがProductionに反映されている | OK | `Screenshots/エビデンス_railway_backend-deployment-2026-06-22.png`, `Screenshots/`（証跡用、Git管理対象外） | 2026-06-22はcommit / deployment id `1b08f8aa`、commit message `fix: add restore drill diagnostics` を確認。2026-07-02にBackend main push後、Railway最新Deployment `docs: admin設定画面の再確認結果を記録` がProductionでsuccessful / Activeとなったことを確認 | なし |
| DeploymentがActiveである | OK | `Screenshots/エビデンス_railway_backend-deployment-2026-06-22.png` | Production `kajishift-backend` の最新Deploymentが `ACTIVE`、`Deployment successful`。本番URL `kajishift-backend-production.up.railway.app`、GitHub連携、Node `22.22.3`、Region `Southeast Asia`、`1 Replica` を確認 | なし |
| build logで `prisma generate` が成功している | 未確認 | `Screenshots/エビデンス_railway2026-06-25_railway_build_logs.png` | Build Logsは `No build logs` 表示。Railwayログ上では `prisma generate` 未確認 | 既存証跡で補完し、次回再デプロイ時にRailwayログを保存 |
| build/deploy logで `prisma migrate deploy` 成功、または実行方針確認済み | OK | `Screenshots/エビデンス_railway2026-06-25_railway_view_logs_empty.png`, `Screenshots/エビデンス_railway2026-06-25_postgres_database.png`, `Screenshots/`（証跡用、Git管理対象外） | 2026-06-25時点ではRailwayログ上未確認だったが、2026-07-02のBackend A案反映でDeploy Logsに `npm run prisma:migrate:deploy` と `prisma migrate deploy` の実行を確認。`15 migrations found in prisma/migrations`、`No pending migrations to apply.` を確認 | なし |
| `DATABASE_URL` が本番DB向きであることを目視確認 | OK | `Screenshots/エビデンス_railway2026-06-25_railway_variables.png` | Service Variablesに設定あり。人間が本番DB向きであることを目視確認済み。値は記録しない | なし |
| 必要に応じて `DIRECT_URL` を確認 | 設定なし / 対象外候補 | `Screenshots/エビデンス_railway2026-06-25_railway_variables.png` | Variables画面には表示なし。現構成で必要かはPrisma設定とDB接続方式で必要に応じて確認 | 必要性が出た場合のみ再確認 |
| CORS / operation mode / backup / Stripe系envを目視確認 | OK（一部補完確認） | `Screenshots/エビデンス_railway2026-06-25_railway_variables.png` | `CORS_ORIGIN`, `ENABLE_STRIPE_PAYMENTS`, `JWT_SECRET`, `NODE_ENV`, `PORT`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` の設定を確認。`OPERATION_MODE` とbackup関連envはVariables上になし。operationはDB永続モードと `/api/public/status`、backupはRunbookの手動 `pg_dump` / restore drill運用で補完 | operation statusとbackup運用は別証跡で継続確認 |

Railway補足:

- Production `kajishift-backend` のService Variablesは9件確認済み。値そのものは記録せず、スクリーンショットもRailway側のマスク表示により実値なし。
- Deploy Logsは `No logs in this time range` のため、deploy log本文は確認不可。
- Build Logsは `No build logs` のため、build log本文は確認不可。
- `prisma generate` はRailwayログ上では未確認。
- `prisma migrate deploy` はRailwayログ上では未確認。DB上の `_prisma_migrations`、主要テーブル、Ops関連テーブル存在確認と既存migration証跡で補完する。

Railway Postgres確認:

| 確認項目 | 結果 | スクリーンショット保存先 | メモ | 次対応 |
|----------|------|--------------------------|------|--------|
| Postgres service / Deployment | OK | `Screenshots/エビデンス_railway2026-06-25_postgres_deployments.png` | Postgres service Online、Deployment `ACTIVE`、`Deployment successful`。Image `ghcr.io/railwayapp-templates/postgres-ssl:18`、Region `Southeast Asia`、`1 Replica` を確認 | なし |
| Database画面 / スキーマ補助証跡 | OK | `Screenshots/エビデンス_railway2026-06-25_postgres_database.png` | Database画面表示、`_prisma_migrations`、`bookings`, `payments`, `users`, `stripe_events` など主要テーブル、`ops_events`, `ops_incidents`, `system_settings` などOps関連テーブルを確認 | Railwayログ上のmigrate確認とは分けて扱う |
| Railway Backups | 未使用 / 代替運用 | `Screenshots/エビデンス_railway2026-06-25_postgres_backups.png` | Point-in-time recoveryはoff、Volume backupsは `No volume backups`、Pro plan限定表示あり。Railway管理バックアップは未使用 / なし | 既存Runbookの手動 `pg_dump` / restore drill運用で代替 |

### Vercel 確認

| 確認項目 | 結果 | スクリーンショット保存先 | メモ | 次対応 |
|----------|------|--------------------------|------|--------|
| 最新Frontend commitがProductionに反映されている | OK | `Screenshots/スクリーンショット 2026-06-26 111350.png`, `Screenshots/vercel_kajishift_frontend_2026-06-26-13_39_14.png` | commit `ad83fff`、commit message `feat: add 24h auto ops frontend status UI`、branch `main` を確認 | なし |
| 最新Frontend main `0fe8f7d` がProductionに反映されている | OK | `Screenshots/`（証跡用、Git管理対象外） | 2026-07-01にVercel DashboardでDeployment message `fix: clarify unavailable admin settings`、commit `0fe8f7d`、branch `main`、Status `Ready`、Environment `Production` を確認。Frontend最新mainがProductionへ反映済みと判断 | なし |
| Production deploymentがActive / Readyである | OK（一部warningあり） | `Screenshots/vercel_kajishift_frontend_2026-06-26-13_39_14.png`, `Screenshots/スクリーンショット 2026-06-26 134629.png` | Production Deploymentは `Ready / Latest`、Environmentは `Production / Current`、Created `Jun 5`、Duration `4s`。Deploy Logsで `vercel build`、Vercel CLI `54.9.0`、`Build Completed`、`Deployment completed` を確認 | `builds` 定義とVercel Project Settingsの整合は必要に応じて公開後または別途確認 |
| Production Aliasが正しい | OK | `Screenshots/vercel_kajishift_frontend_2026-06-26-13_39_14.png` | 利用者向けProduction URL `https://kajishift-frontend.vercel.app` を確認。Domains欄にProduction Aliasと関連Deployment URLが表示されていることを確認 | なし |
| `js/config.js` の最新markerまたはAPI接続先を確認 | OK | `Screenshots/スクリーンショット 2026-06-26 135814.png`, `Screenshots/スクリーンショット 2026-06-26 140918.png` | `/js/config.js` は `200 OK`、`Content-Type: application/javascript`。marker / `KAJISHIFT_CONFIG_VERSION` は `2026-06-03-24h-auto-ops`。`API_BASE_URL` は `https://kajishift-backend-production.up.railway.app/api`、`SOCKET_SERVER_URL` は `https://kajishift-backend-production.up.railway.app`。Stripe publishable key設定あり、実値は記録しない。Secret Key / Webhook Secretは表示されていない | なし |
| Frontend URLが正常表示される | OK | `Screenshots/スクリーンショット 2026-06-26 135402.png` | Production Aliasでcustomer向けトップ画面表示OK。`/api/public/status` と思われるstatus request `200`、Preflight `200`、CORSエラーなし。Consoleで `KAJISHIFT API initialized and attached to window.api`、`Service Worker registered successfully` を確認 | なし |

Vercel補足:

- Deploy Logsには、configuration fileに `builds` が存在するためVercel側のBuild and Development Settingsに関するwarningが1件表示されている。`Build Completed` / `Deployment completed` は確認済みのため、現時点ではβGoを止めるNGではない。
- 個別Deployment URL `https://kajishift-frontend-7thrn12kz-azusas-projects-ab1d3304.vercel.app` ではCORSエラーあり。Originが個別Deployment URLのため `CORS_ORIGIN` 対象外だった可能性がある。Production Alias `https://kajishift-frontend.vercel.app` では再現しないため、β公開確認はProduction Alias基準とする。
- 軽微な警告として `/favicon.ico` の `404` と `apple-mobile-web-app-capable` deprecated warningあり。いずれも現時点ではβGoを止める重大エラーではない。

### GitHub Actions / Backup 確認

| 確認項目 | 結果 | スクリーンショット保存先 | メモ | 次対応 |
|----------|------|--------------------------|------|--------|
| 最新の backup / restore drill が成功している | OK | 未保存（GitHub Actions run `https://github.com/azusa-tani/kajishift-backend/actions/runs/28335305228`） | `Database backup and restore drill #34`。event `schedule`、branch `main`、head SHA `9a105c46383cba19158003c3d8815d225a7441a3`、2026-06-28T20:40:09Z開始、conclusion `success`。`backup` jobと `weekly-restore-drill` jobがどちらもsuccess | なし |
| backup artifactが存在する | OK | 未保存（GitHub Actions APIで確認） | artifact `kajishift-db-backup`、id `7938404186`、size `70767` bytes、created `2026-06-28T20:41:03Z`、expired `false`、run id `28335305228` | なし |
| artifact保管期間を確認した | OK | `.github/workflows/database-backup.yml` / GitHub Actions API | workflowの `retention-days: 7` と、最新artifactの `expires_at=2026-07-05T20:41:03Z` を確認 | なし |
| Node.js 20 warningの有無を確認した | 未確認 | 未保存 | Workflowは `actions/setup-node@v4`、`node-version: '20'`。GitHub APIでjob/step成功は確認済みだが、ログ本文取得はタイムアウトしたためwarning本文の有無は未確認 | GitHub Actions Dashboardでログ本文を目視確認 |

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
| customer主要画面が表示される | OK | `Screenshots/2026-06-29-production-main-screens/` | Production Aliasで login / dashboard / bookings / payment / favorites を確認。重大な表示崩れなし、β公開中バナー表示あり | 通知Socket再接続/複数端末E2E、お気に入り追加/解除、チャット画像添付は後続確認 |
| worker主要画面が表示される | NG（一部OK） | `Screenshots/2026-06-29-production-main-screens/` | Production Aliasで login / dashboard / jobs / calendar / profile は重大NGなし。rewardsは画面の一部表示はOKだが、報酬サマリー・支払い履歴・今月の仕事詳細が読み込み中のまま残る | rewardsの500原因修正が必要 |
| admin主要画面が表示される | 未確認 | 未記入 | 重大なConsole/Networkエラーなし | 未記入 |
| Console重大エラーなし | NG（worker rewards） | `Screenshots/2026-06-29-production-main-screens/` | customer主要画面とworkerのlogin / dashboard / jobs / calendar / profileでは重大Consoleエラーなし。worker rewardsで「決済履歴を取得できるのは顧客または管理者のみです」の重大エラーあり。軽微warningとして `apple-mobile-web-app-capable` deprecated warningあり | admin画面でも別途確認 |
| Network重大エラーなし | NG（worker rewards） | `Screenshots/2026-06-29-production-main-screens/` | worker rewardsで `GET https://kajishift-backend-production.up.railway.app/api/payments?limit=100` が500。customer主要画面とworkerの他画面では確認範囲の主要API 200、Preflight 200、CORSエラーなし | rewardsのAPI呼び出しを修正。admin画面でも別途確認 |
| `KajishiftOps` 読み込み確認 | 未確認 | 未記入 | `window.KajishiftOps` 等で確認 | 未記入 |
| operation status取得確認 | OK（customer / worker範囲） | `Screenshots/2026-06-29-production-main-screens/` | Frontend Production AliasからRailway本番Backendの `/api/public/status` への通信を確認。記録URL: `https://kajishift-backend-production.up.railway.app/api/public/status?_=...-2026-06-03-24h-auto-ops` | admin画面でも必要に応じて確認 |
| 停止バナー / 503 UI確認 | 未確認 | 未記入 | Stagingまたは安全な確認方法で実施 | 未記入 |

customer主要画面確認詳細:

| 対象 | URL | 結果 | 確認内容 | 補足 / 後続確認 |
|------|-----|------|----------|----------------|
| customerログイン | `https://kajishift-frontend.vercel.app/customer/login.html` | OK | 画面表示OK、重大な表示崩れなし、β公開中バナー表示あり。API初期化ログ、Service Worker登録ログ、status系fetch 200、Preflight 200、500系APIなし、CORSエラーなし | ログインフォーム入力値を含むスクショのため、メールアドレス等の実値は記録しない。`apple-mobile-web-app-capable` deprecated warningは軽微warning扱い |
| customerダッシュボード | `https://kajishift-frontend.vercel.app/customer/dashboard.html` | OK | 画面表示OK、重大な表示崩れなし、β公開中バナー、クイックアクション、通知バッジ表示あり。status系fetch、Preflight、me / unread-count / bookings / payments / notifications が200。500系APIなし、CORSエラーなし | WebSocket初回接続warning後にSocket.io接続成功・接続確認ログあり。通知Socket再接続/複数端末E2Eは後続確認 |
| customer予約一覧 | `https://kajishift-frontend.vercel.app/customer/bookings.html` | OK | 画面表示OK、重大な表示崩れなし、β公開中バナー表示あり。API初期化ログ、Socket.io接続成功、status系fetch 200、bookings fetch 200、unread-count fetch 200、Preflight 200、WebSocket 101、500系APIなし、CORSエラーなし | 予約内容は確認用アカウント由来のDBデータとして扱い、個人名・住所・予約情報・userId等の実値は記録しない |
| customer決済・履歴 | `https://kajishift-frontend.vercel.app/customer/payment.html` | OK | 画面表示OK、重大な表示崩れなし、β公開中バナー、支払い方法欄、利用履歴欄表示あり。API初期化ログ、Service Workerログ、Socket.io接続成功、status系fetch 200、Preflight 200、me / payments / cards / notifications unread-count等が200。500系APIなし、CORSエラーなし | 通常ブラウザで一度出た `window.__chromium_devtools_metrics_reporter is not a function` はシークレットウィンドウで再現なし。発生元はVM系で、Chrome拡張機能またはDevTools側ノイズの可能性が高く、重大NGではない |
| customerお気に入り | `https://kajishift-frontend.vercel.app/customer/favorites.html` | OK | 画面表示OK、重大な表示崩れなし、β公開中バナー表示あり。API初期化ログ、Socket.io接続成功、status系fetch 200、favorites fetch 200、unread-count fetch 200、Preflight 200、WebSocket 101、500系APIなし、CORSエラーなし | お気に入りワーカー情報は確認用アカウント由来のDBデータとして扱い、個人名・userId等の実値は記録しない。お気に入り追加/解除の実ブラウザE2Eは後続確認 |

customer主要画面の総合判定:

- login / dashboard / bookings / payment / favorites は、表示・主要API通信・Console/Networkの観点で重大NGなし。
- βGo判定を覆す明確なNGなし。
- 後続確認: worker主要画面、admin主要画面、`window.KajishiftOps` 明示確認、停止バナー / 503 UI、通知Socket再接続/複数端末E2E、お気に入り追加/解除の実ブラウザE2E、チャット画像添付の実ブラウザE2E。

worker主要画面確認詳細:

| 対象 | URL | 結果 | 確認内容 | 補足 / 後続確認 |
|------|-----|------|----------|----------------|
| workerログイン | `https://kajishift-frontend.vercel.app/worker/login.html` | OK | 画面表示OK、重大な表示崩れなし、β公開中バナー表示あり。Service Worker登録ログ、status系fetch 200、Preflight 200、500系APIなし、CORSエラーなし | `apple-mobile-web-app-capable` deprecated warningは軽微warning扱い |
| workerダッシュボード | `https://kajishift-frontend.vercel.app/worker/dashboard.html` | OK | 画面表示OK、重大な表示崩れなし、β公開中バナー表示あり。API初期化ログ、Socket.io接続成功、status系fetch 200、bookings系fetch 200、unread-count 200、Preflight 200、WebSocket 101、500系APIなし、CORSエラーなし | スクショ内のワーカー名・userId風の値は記録しない |
| worker仕事一覧 | `https://kajishift-frontend.vercel.app/worker/jobs.html` | OK | 画面表示OK、条件絞り込みUI表示あり。API初期化ログ、Socket.io接続成功、bookings available系fetch 200、status系fetch 200、unread-count 200、Preflight 200、WebSocket 101、500系APIなし、CORSエラーなし | なし |
| workerカレンダー | `https://kajishift-frontend.vercel.app/worker/calendar.html` | OK | 画面表示OK、月表示カレンダーと予定表示あり。API初期化ログ、Socket.io接続成功、bookings confirmed/in_progress系fetch 200、status系fetch 200、unread-count 200、Preflight 200、WebSocket 101、500系APIなし、CORSエラーなし | なし |
| worker報酬管理 | `https://kajishift-frontend.vercel.app/worker/rewards.html` | NG / 要修正 | 報酬管理画面は一部表示OKだが、Console重大エラーとNetwork 500あり。対象APIは `GET https://kajishift-backend-production.up.railway.app/api/payments?limit=100`。通常ブラウザとシークレットモードの両方で再現。Socket.io接続成功、status系fetch 200、bookings completed系fetch 200、見える範囲でCORSエラーなし | 報酬サマリー、支払い履歴、今月の仕事詳細が読み込み中のまま残る。worker向け報酬管理をβ運用で使う場合は修正優先。βスコープ外にする場合も制限事項として明記が必要 |
| worker報酬管理（2026-07-01再確認） | `https://kajishift-frontend.vercel.app/worker/rewards.html` | OK | Frontend Production `0fe8f7d` 反映後に本番ブラウザで再確認。報酬管理画面表示OK、β版では報酬・精算詳細が準備中である旨の文言を確認。見える範囲で旧「読み込み中...」残りなし。`/api/payments?limit=100` は発生せず、`GET /api/bookings?status=COMPLETED...`、status系、`me`、`unread-count` は200。WebSocket 101、Socket.io接続成功。Console重大エラー、Network 500、CORSエラーなし | スクショ内のuserId風の値は本文に記録しない。以前のworker rewards 500は再現しない |
| workerプロフィール | `https://kajishift-frontend.vercel.app/worker/profile.html` | OK | 画面表示OK、プロフィール・基本情報表示OK。API初期化ログ、Socket.io接続成功、status系fetch 200、worker/profile系と思われるfetch 200、unread-count 200、Preflight 200、500系APIなし、CORSエラーなし | 氏名・メールアドレス・電話番号・評価・プロフィール情報は確認用アカウント由来のDBデータとして扱い、実値は記録しない |

worker rewards 500原因調査:

| 確認観点 | 結果 |
|----------|------|
| Frontend本番の呼び出し箇所 | Production反映済みとして記録済みのFrontend `ad83fff` では、`worker/rewards.html` の `loadRewards()` が `api.getPayments({ limit: 100 })` を呼ぶ。`api.getPayments()` は `js/api.js` で `/payments?limit=100` を生成する |
| Frontend現行mainとの差分 | 現行Frontend main `0fe8f7d` では `f83cebc fix: hide sample worker reward account details` により、`worker/rewards.html` から `api.getPayments()` 呼び出しと固定報酬/口座表示は削除済み。完了予約APIのみで「今月の完了した仕事」を表示する構成 |
| Backend `/api/payments` の権限制御 | `src/routes/payments.js` の `GET /` は認証後に `paymentController.getPayments` を呼ぶ。`src/services/paymentService.js` の `getPayments()` は `CUSTOMER` と `ADMIN` のみ許可し、`WORKER` では「決済履歴を取得できるのは顧客または管理者のみです」をthrowする |
| 500になる理由 | `paymentService.getPayments()` のWORKER拒否は `err.status` なしの通常Error。`src/middleware/errorHandler.js` は `err.status || err.statusCode || 500` を返すため、本番では500として返る |
| worker報酬管理として本来呼ぶべきAPI | 現行mainの方針では、worker報酬/精算詳細はβ版準備中とし、worker自身の完了仕事は `api.getBookings({ status: 'COMPLETED', startDate, endDate, limit: 100 })` で取得する。worker専用の報酬/精算APIは確認範囲では存在しない |
| 読み込み中が残る原因 | `ad83fff` 版は `Promise.all([api.getBookings(...), api.getPayments(...)])` の片方であるpaymentsが失敗するとcatchへ入り、summary/payment/rewards描画関数が呼ばれない。初期DOMの「読み込み中...」が残る |
| βGo判定への影響 | worker向け報酬管理をβ運用で使う場合はユーザーに見える不具合のため修正優先。βスコープ外にする場合も、準備中機能として明記し、読み込み中や500を出さない状態にする必要あり |

worker rewards 最小修正案:

1. 最小候補: 既にFrontend mainに入っている `f83cebc` 以降をProduction Aliasへ反映し、`worker/rewards.html` が `/api/payments` を呼ばない状態にする。Backend変更なしで、β版では報酬・精算詳細を準備中表示、完了仕事のみ `GET /api/bookings` 由来で表示する。
2. 追加の安全策: Frontendで `worker/rewards.html` のエラー時に各表示領域を「準備中」または「完了した仕事を取得できませんでした」に置き換え、読み込み中を残さない。
3. Backend側の代替案: `/api/payments` のWORKER拒否に403を付与する。ただしこれは500分類を正すだけで、worker rewards画面の読み込み中問題と不正なAPI呼び出しは解消しない。
4. 将来対応: worker向け報酬/精算をβ範囲に含めるなら、payments流用ではなくworker専用の報酬/精算APIを設計し、公開対象フィールドを限定する。

今回の調査では実装修正・テスト修正・DB操作・外部サービス操作は実施していない。

2026-07-01追記:

- Vercel DashboardでFrontend Production Deploymentが `0fe8f7d fix: clarify unavailable admin settings`、branch `main`、Status `Ready`、Environment `Production` であることを人間が確認した。
- Production Aliasの `worker/rewards.html` では、旧 `/api/payments?limit=100` の500は再現しない。
- 報酬管理画面はβ版の報酬・精算詳細準備中文言へ更新され、見える範囲で「読み込み中...」が残る問題は解消済み。
- 本確認では実装修正、DB操作、外部サービス設定変更は実施していない。

admin主要画面確認詳細:

| 対象 | URL | 結果 | 確認内容 | 補足 / 後続確認 |
|------|-----|------|----------|----------------|
| adminログイン | `https://kajishift-frontend.vercel.app/admin/login.html` | OK | 画面表示OK。`/api/public/status` 200、主要静的ファイル200。重大Consoleエラーなし | 公開管理者登録導線は見えない。ログイン情報や個人情報の実値は記録しない |
| adminダッシュボード | `https://kajishift-frontend.vercel.app/admin/dashboard.html` | OK | Backend A案本番反映後に再確認。画面表示OK、`worker-test-submissions?...` が200。「ワーカーテスト審査待ちの読み込みに失敗しました」は出ていない。Console重大エラー、Network 500 / CORSエラーなし、Socket.io接続成功 | 2026-07-01時点の `/api/admin/worker-test-submissions...` 404は解消 |
| admin利用者管理 | `https://kajishift-frontend.vercel.app/admin/users.html` | OK | 画面表示OK。`me`、`users?...`、status、`unread-count` が200。500/CORSなし | CSV/Excel、停止などの書き込み・出力操作は実施していない。個人情報の実値は本文に記録しない |
| adminワーカー管理 | `https://kajishift-frontend.vercel.app/admin/workers.html` | OK | 画面表示OK。`workers?...`、status、`unread-count` が200。500/CORSなし | 停止・承認などの書き込み操作は実施していない。個人情報の実値は本文に記録しない |
| adminワーカーテスト審査 | `https://kajishift-frontend.vercel.app/admin/worker-test-submissions.html` | OK | Backend A案本番反映後に再確認。画面表示OK、`worker-test-submissions?...` が200。提出一覧は全0件で「対象の提出はありません」表示。Console重大エラー、Network 500 / CORSエラーなし | 2026-07-01時点の `/api/admin/worker-test-submissions...` 404は解消 |
| admin予約管理 | `https://kajishift-frontend.vercel.app/admin/bookings.html` | OK | 画面表示OK。各statusの `bookings?...` が200。500/CORSなし | 予約詳細・キャンセルなどの書き込み操作は実施していない。予約内容、住所、氏名等の実値は本文に記録しない |
| admin決済・売上 | `https://kajishift-frontend.vercel.app/admin/payments.html` | OK（決済可否は未確認） | 画面表示OK。Stripe本番有効化前として「決済一覧・売上KPI・報酬精算・キャンセル料管理は準備中」「実運用の決済確認はStripe DashboardまたはCSV」と明記されており、誤認防止としてはOK。500/CORSなし | Stripe本番有効化は社長確認待ちのため、本番決済可否はOK扱いしない。Stripe操作、Webhook再送、PaymentIntent作成、実決済は未実施 |
| admin問い合わせ | `https://kajishift-frontend.vercel.app/admin/support.html` | OK | 画面表示OK。`support?limit=1000` が200。固定サンプル削除・実データAPI読み込みの説明あり。500/CORSなし | 対応する、削除、CSVなどの書き込み・出力操作は実施していない。問い合わせ内容や個人情報の実値は本文に記録しない |
| admin設定 | `https://kajishift-frontend.vercel.app/admin/settings.html` | OK | 2026-07-02に時間を置いて再確認。`/api/auth/me`、`/api/notifications/unread-count`、services / areas / status系API、Preflightはいずれも200。429 / 500 / CORSエラーなし、Console重大エラーなし、Socket.io接続成功。サービスメニュー、対応エリア、システム設定、操作ログの各タブ表示を確認 | 前回の429は短時間の連続確認による一時的なrate limit扱いとする。β版として編集機能・操作ログが準備中表示になっている点はOK |

admin主要画面の総合判定:

- 大半のadmin画面は表示OK、主要GET 200、500/CORSなし。
- `admin/dashboard.html` と `admin/worker-test-submissions.html` は2026-07-02のBackend A案本番反映後に再確認し、worker-test-submissions API 404が解消したためOK扱いとする。
- `admin/settings.html` は2026-07-02再確認で429 / 500 / CORSエラーなし、主要API 200、Console重大エラーなしを確認したためOK扱いとする。
- WebSocketは一部スクショで初回接続失敗/再接続ログが見えるが、他画面では101や接続成功も見えるため、重大NGではなく要観察とする。
- admin主要画面全体は **OK（一部継続確認あり）**。Stripe本番有効化と通知基盤 / Slack継続判断は別途継続確認とする。

admin要確認項目の原因調査:

| 観点 | 結果 |
|------|------|
| Frontend dashboardの呼び出し箇所 | `admin/dashboard.html` の `loadPendingWorkerTests()` が `api.getAdminWorkerTestSubmissions({ status: 'needs_review,ai_reviewed,test_submitted', limit: 5 })` を呼ぶ |
| Frontend worker-test-submissionsの呼び出し箇所 | `js/admin-worker-test-submissions.js` が `api.getAdminWorkerTestSubmissions(params)` を呼ぶ |
| Frontend APIパス | `js/api.js` の `getAdminWorkerTestSubmissions()` は `/admin/worker-test-submissions` を生成する。API base URL配下では `/api/admin/worker-test-submissions...` になる |
| Backend現行ローカルコード | ローカルBackend現行コードには `src/routes/admin.js` の `router.get('/worker-test-submissions', ...)` と controller 実装が存在する |
| Backend `origin/main` / 本番との差分 | 2026-07-01時点では `git diff origin/main...HEAD` 上、worker-test-submissionsのadmin routes/controllerと `/api/workers/me/screening-test` マウントはローカルHEAD側にのみ存在していた。2026-07-02にBackend mainをpushし、Railway ProductionへA案として反映済み |
| 404の分類 | 2026-07-01時点ではFrontend本番が worker-test-submissions APIを呼ぶ一方で本番Backendに該当APIが未反映だったため、APIパス不一致ではなく **Backend未デプロイ / Frontend-Backend反映差分** と判断した。2026-07-02の本番反映後、`worker-test-submissions?...` は200となり404は解消 |
| リリース範囲の扱い | ワーカーテスト審査はA案として7月7日本番リリース範囲に含める。Backend A案本番反映後、admin dashboard と admin worker-test-submissions の読み取り確認はOK |
| settings 429の再確認 | 2026-07-02に時間を置いて再確認したところ、`/api/auth/me`、`/api/notifications/unread-count`、services / areas / status系API、Preflightはいずれも200。429 / 500 / CORSエラー、Console重大エラーはなし。Socket.io接続成功 |
| settings 429の分類 | 前回の429は短時間に多数admin画面を連続確認したことによる一時的なrate limit扱いとする。settings固有の不具合としては扱わない |
| 通常利用への影響 | 今回の再確認では通常表示に支障なし。ただし管理者が短時間に多数画面を開く、DevToolsでDisable cache確認する、複数タブで管理画面を操作する場合は429が再発する可能性があるため、管理者運用では注意 |
| 最小修正案 | worker-test-submissions APIをBackend mainへ反映するA案を採用し、2026-07-02に本番反映済み。429は管理画面のポーリング/API呼び出し削減、`/api/public/status`や通知取得の間隔調整、管理画面向けrate limit設計の見直しが将来候補 |
| 今回の扱い | Backend A案本番反映後の確認で、settings 429とworker-test-submissions 404はいずれも解消扱い。Stripe本番有効化と通知基盤 / Slack継続判断は継続確認 |

### DBバックアップ運用確認

| 確認項目 | 結果 | 記録 | スクリーンショット保存先またはメモ | 次対応 |
|----------|------|------|----------------------------------|--------|
| バックアップ保管先 | 代替運用 | Railway管理バックアップは未使用 / なし | `Screenshots/エビデンス_railway2026-06-25_postgres_backups.png`。Railway PITR off、Volume backupsなし、Pro plan限定表示あり | 既存Runbookの手動 `pg_dump` / restore drill運用で継続 |
| 保持期間 | OK | GitHub Actions artifact 7日保持 | `.github/workflows/database-backup.yml` の `retention-days: 7` と最新artifactの `expires_at=2026-07-05T20:41:03Z` を確認 | 直近7世代以上が必要な場合は保持期間延長または外部保管を検討 |
| 復元ドリル実施状況 | OK | GitHub Actions run `#34` | `weekly-restore-drill` jobが2026-06-28T20:41:09Z開始、2026-06-28T20:42:36Z完了、conclusion `success` | なし |
| 次回復元ドリル予定 | OK | cron `30 19 * * 0` | 週次restore drillは毎週日曜19:30 UTC（日本時間 月曜04:30）予定。日次backupは `0 18 * * *` | 実行後に最新runを再確認 |
| 責任者 | 未確認 | 未記入 | 個人名または役割名 | 未記入 |

### ステータス集計

| 項目 | 状態 | ブロッカー | 次対応 | 参照先 |
|------|------|------------|--------|--------|
| Railway証跡 | OK（一部未確認あり） | No | 2026-07-02のBackend A案反映でRailway最新Deployment successful / Active、`prisma migrate deploy` 実行、API起動、health/status正常を確認。`prisma generate` の明示ログ確認は必要に応じて継続 | 本ファイル、`docs/BETA_RELEASE_FINAL_CHECKLIST.md` |
| Vercel証跡 | OK（一部warningあり） | No | 2026-07-01にFrontend Production `0fe8f7d` 反映を確認。`builds` warningと個別Deployment URLのCORSは補足扱い。Production Alias基準では画面表示、API接続、CORS、operation status取得が正常 | 本ファイル、`docs/BETA_RELEASE_FINAL_CHECKLIST.md` |
| GitHub Actions / Backup | OK（一部未確認あり） | No | 最新run `#34` はbackup / weekly restore drillともsuccess、artifact 7日保持も確認済み。Node.js 20 warning有無はDashboardログ本文で追加確認 | 本ファイル、GitHub Actions |
| Stripe | 未確認 | No | Webhook/通知/再送確認 | 本ファイル、Stripe Dashboard |
| 外部監視・通知 | 未確認 | No | 監視設定とテスト通知を確認 | 本ファイル、`docs/BETA_OPERATIONS_RUNBOOK.md` |
| 本番主要画面 / 停止UI | OK（一部継続確認あり） | No | customer主要画面は重大NGなし。worker rewardsは2026-07-01再確認で `/api/payments?limit=100` 500と読み込み中残りが再現しないことを確認。admin settingsは2026-07-02再確認で429が再現せずOK。Backend A案反映後、admin dashboard / worker-test-submissions の404も解消。`KajishiftOps`明示確認、停止UIは継続確認 | 本ファイル、`docs/BETA_RELEASE_FINAL_CHECKLIST.md` |
| DBバックアップ運用 | 継続（一部OK） | No | Railway管理バックアップは未使用。GitHub Actionsで日次backup、週次restore drill、artifact 7日保持を確認。責任者は未確認 | 本ファイル、`docs/BETA_OPERATIONS_RUNBOOK.md` |

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

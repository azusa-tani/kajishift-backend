# KAJISHIFT リリース準備 専用チェックリスト

最終更新: 2026-07-03

## 目的

このチェックリストは、2026-07-07 の **本番決済なし限定公開** と、その後の **本番決済あり運用** を分けて、フロントエンド・バックエンド・インフラ・運用・計画自体の不備を確認するためのものです。

2026-07-07 はA案として、Stripe本番決済、正式な有料予約受付、本番カード登録、本番課金につながる導線を開放しない。B案の本番決済あり運用は、セキュリティ対策とStripe本番確認が完了した後に別Go/No-Goで判断する。

判定は次の3段階で記録します。

| 判定 | 意味 |
|------|------|
| OK | 実装・本番反映・確認証跡まで完了 |
| 要確認 | 実装済みだが、本番反映・外部設定・ドリル・証跡が未完了 |
| No-Go | このまま公開すると24時間無人運用の前提を満たさない |

## 最重要ブロッカー

| 項目 | 現状 | 判定 | 必要な対応 |
|------|------|------|------------|
| 最新バックエンドの本番反映 | ローカル実装済み | 要確認 | Railwayへデプロイし、`npx prisma migrate deploy` を実行する |
| 最新フロントエンドの本番反映 | ローカル実装済み | 要確認 | Vercelへデプロイし、停止バナー・予約/決済抑止を本番画面で確認する |
| DB永続運用モード | 実装・検証済み | OK | `GET /api/public/status`、DB永続status、検証DBでの停止/復帰を確認済み |
| 自動 `payment_paused` | 検証DBで疑似発火済み | OK | `payment_reconciliation_anomaly` から自動切替、通知2系統、予約/決済/カード抑止を確認済み |
| 自動 `maintenance` | 検証DBで疑似発火済み | OK | `api_5xx_error` 10件から自動切替、主要書き込み停止、問い合わせ例外を確認済み。DB完全停止時は外部監視 + overrideで補完 |
| 通知2系統 | 到達確認済み | OK | `OPS_ALERT_WEBHOOK_URLS` 2件で `deliveredTargets=2`, `failedTargets=0` |
| 自動バックアップ | 暗号化バックアップ成功 | OK | `npm run backup:database` で `.dump.enc` とmanifest作成済み。日次実行はGitHub Actions/Railwayで継続設定 |
| 復元ドリル | 検証DBへ復元済み | OK | `npm run backup:restore-drill -- <backup-file>` で復元成功 |
| 7月7日本番決済なし限定公開 | 社長確認済み | Go候補 | 本番決済、正式な有料予約受付、本番カード登録を開放しない。主要画面と問い合わせ・事前登録導線を公開前に再確認する |
| Stripe本番決済あり運用 | 未対応項目あり | No-Go | 管理画面アクセス制限、管理者MFA/2FA、管理者ログイン失敗時アカウントロック、脆弱性診断証跡、Stripe本番Webhook/決済確認を完了してから別Go判断 |

## 計画自体の精査結果

| 観点 | 不備・注意点 | 影響 | リリース前対応 |
|------|--------------|------|----------------|
| DB障害時の自動maintenance | DBへ接続できる範囲のヘルス失敗は自動停止できるが、DB完全停止時はDB保存できない | 本当にDB停止した時にDB永続モード変更ができない恐れ | 外部監視で検知し、Railway Variables の `BETA_OPERATION_MODE_OVERRIDE=maintenance` で表示・書き込み停止を補完する |
| アプリ内監視ジョブ | `setInterval` のアプリ内ジョブは、Railway再起動・複数インスタンス・スリープに左右される | 監視が抜ける、または重複実行される可能性 | 外部スケジューラ、Railway Cron、GitHub Actions等で定期実行する |
| 通知Webhook形式 | Slack/Discord向けpayloadへ対応済み | 通知先ごとの表示差は残る | 実通知2系統到達済み。通知先追加時は同じ到達テストを行う |
| 自動バックアップ | `npm run backup:database` は取得・検証スクリプトであり、日次実行やクラウド保存は別設定 | 自動バックアップが動いていないのに「整備済み」と誤認する恐れ | スケジューラ、保存先、暗号化、世代管理を実設定する |
| 復元確認 | 検証DBへの実復元ドリル済み | 継続運用では週次再実行が必要 | GitHub Actionsまたは運用手順で週次ドリルを継続する |
| `maintenance` の問い合わせ扱い | 計画では問い合わせ作成停止と記載がある一方、実装では障害報告経路を残す方針 | ドキュメントと実装の解釈がずれる | 「maintenance中も問い合わせ/障害報告は許可」と明記する |
| `payment_paused` 中の予約停止 | 実装では `payment_paused` 中に新規予約も止める方針へ強化 | 既存Runbookの「予約閲覧・チャット継続」と混同しやすい | 「決済障害時は未払い予約増加を防ぐため新規予約も止める」と明記する |
| 自動復旧 | 計画では復旧候補時刻を扱うが、自動 `normal` 復帰はしない | 復旧が人手判断に残る | 24時間無人でも自動復旧しない方針を明記し、復旧担当の確認タイミングを決める |
| 決済自動修復 | Stripe成功・DB未完了を補正できるが、通知メールや関連通知の再送は限定的 | DB状態は直ってもユーザー通知が不足する可能性 | 自動修復時の通知方針を確認する |
| Stripe Webhook再送 | 実Webhook成功は確認済みだが、同一イベント再送の本番相当確認は残る | 冪等性の実証が不足 | Stripe Dashboard/CLIで再送確認する |
| 本番証跡 | 実装・検証DB・通知・バックアップの証跡は更新済み | 本番デプロイ後の画面確認は別途必要 | 本番反映後に `GET /api/public/status`、停止UI、外部監視通知を最終確認する |

## フロントエンド チェックリスト

| 項目 | 判定 | 証跡 |
|------|------|------|
| Vercel本番へ最新コードをデプロイした |  |  |
| `js/config.js` の `KAJISHIFT_CONFIG_VERSION` が最新 |  |  |
| `GET /api/public/status` を本番フロントから取得できる |  |  |
| `normal` 時に通常操作できる |  |  |
| `booking_paused` 時に予約フォームが無効化される |  |  |
| `payment_paused` 時に予約作成と決済開始が無効化される |  |  |
| `maintenance` 時に全ページ上部バナーが表示される |  |  |
| APIの `503 OPERATION_PAUSED` が利用者向け文言で表示される |  |  |
| ログイン前ページにも停止状態が表示される |  |  |
| 領収書DLなど止めない操作が継続できる |  |  |
| スマホ表示で停止バナーが崩れない |  |  |
| キャッシュにより古い稼働状態が残らない |  |  |
| customer登録画面で未送信カード欄を表示しない | OK | Frontend `7bb0649`。カード登録は予約時または支払い設定で行う案内に変更 |
| worker報酬/精算画面で固定口座・固定報酬を表示しない | OK | Frontend `f83cebc`。報酬/精算詳細は準備中、完了した仕事一覧は実API由来 |
| worker dashboardでadmin API依存や固定報酬/固定実績を表示しない | OK | Frontend `bcc8d4e`。当月完了件数のみworker向けAPI由来 |
| customer/workerログイン画面で未実装LINEログインを表示しない | OK | Frontend `f16da09`。通常ログインは維持 |
| admin supportで固定問い合わせ・固定事故履歴を表示しない | OK | Frontend `56a133b`。実API連携済み問い合わせ管理は維持 |
| admin dashboardのKPIと準備中グラフを区別できる | OK | Frontend `aaecb6c`。KPIは実API、日別売上推移グラフは準備中 |
| admin settingsで未連携フォーム・固定操作ログを表示しない | OK | Frontend `0fe8f7d`。サービスメニュー/対応エリアは実API連携として維持 |
| customer決済画面で本番カード登録導線を表示しない | OK | 2026-07-03にProduction Aliasの `customer/payment.html` で「カード登録は準備中」のdisabled表示、カード追加ボタン/カード入力モーダル/カード番号入力欄/カード名義人入力欄/追加ボタンなしを確認 |
| 決済関連画面がA案向けに誤認防止されている | OK | 2026-07-03に `customer/payment.html`, `worker/rewards.html`, `admin/payments.html` を本番URLで確認。3画面とも本番決済、本番カード登録、正式な有料予約受付につながる導線なし。Console重大エラーなし、継続的な 500 / 404 / 429 / CORS なし |
| 問い合わせ受付導線が本番URLで利用できる | OK | 2026-07-03に `customer/support.html`, `worker/support.html` でテスト問い合わせを各1件送信し、`admin/dashboard.html`, `admin/support.html` で受付確認。管理側の更新・削除ボタンはDB更新を伴う可能性があるため未押下。Console重大エラーなし、継続的な 500 / 404 / 429 / CORS なし |

## β版で準備中または公開後対応とする画面機能

| 項目 | 判定 | 証跡 |
|------|------|------|
| Stripe本番決済、正式な有料予約受付、本番カード登録 | B案前対応 | 2026-07-07 A案では未開放。セキュリティ対策完了後に別Go/No-Go |
| 報酬/精算詳細、自動精算、振込状態表示 | β後対応 | 固定サンプルは削除済み。β中は運営から個別案内 |
| 返金/キャンセル料/決済管理の本格画面 | β後対応 | `admin/payments.html` は誤認防止済み。外部管理またはCSV/Stripe Dashboardで代替 |
| 日別売上推移グラフ | β後対応 | `admin/dashboard.html` で準備中表示済み |
| メールテンプレート編集、プッシュ通知設定、問い合わせ連絡先編集 | β後対応 | `admin/settings.html` で未連携フォーム削除済み |
| 操作ログ検索・CSV出力 | β後対応 | 固定操作ログ・未連携CSVボタン削除済み |
| LINEログイン | β後対応 | 未実装ボタン削除済み。メール/パスワードログインで代替 |

## 残る証跡取得タスク

| 項目 | 判定 | 証跡 |
|------|------|------|
| 本番主要画面の実ブラウザ確認 | 要確認 | customer/worker/admin主要画面、Console/Network重大エラーなしのスクリーンショット |
| 決済関連画面の誤認防止確認 | OK | 2026-07-03に `customer/payment.html`, `worker/rewards.html`, `admin/payments.html` を本番URLで確認済み。本番決済、本番カード登録、正式な有料予約受付につながる導線なし |
| 問い合わせ・事前登録・β利用希望受付 | 一部OK / 継続 | 問い合わせ受付導線は2026-07-03に本番URLでOK。customer/workerの事前登録、workerのβ利用希望/審査テスト導線は別途実ブラウザ確認を継続 |
| Stripe Webhook署名検証と同一イベント再送 | B案前必須 | Stripe Dashboard/CLI、Railwayログ、DB `stripe_events` |
| Staging本番相当決済E2E | B案前必須 | 予約作成、PaymentIntent、決済成功、Webhook、領収書DL |
| Stripe本番Webhook・本番決済確認 | B案前必須 | Live ModeのWebhook delivery 2xx、署名検証、本番決済/失敗/反映確認 |
| Railway/Vercel/Stripe/外部監視通知設定 | 要確認 | Dashboardスクリーンショット。値や秘密情報は記録しない |

## バックエンド チェックリスト

| 項目 | 判定 | 証跡 |
|------|------|------|
| Railway本番へ最新コードをデプロイした |  |  |
| `npx prisma migrate deploy` が成功した |  |  |
| `npx prisma generate` が成功した |  |  |
| `GET /api/health` が200を返す |  |  |
| `GET /api/public/status` が200を返す |  |  |
| `POST /api/admin/ops/mode` でDB永続モードを変更できる |  |  |
| 再起動後もDB永続モードが維持される |  |  |
| `payment_paused` で `POST /api/payments/intent` が503になる |  |  |
| `payment_paused` 中もStripe Webhookが200で受信される |  |  |
| `maintenance` で主要書き込み操作が停止する |  |  |
| 登録、カード、アップロード、お気に入り、プロフィール、ワーカー不可枠、管理者更新がガードされる |  |  |
| `POST /api/admin/ops/reconcile-payments` が実行できる |  |  |
| Stripe成功・DB未完了の不整合を検知できる |  |  |
| 金額不一致やmetadata不一致を検知できる |  |  |
| `ops_events` に監視イベントが残る |  |  |
| `ops_incidents` に停止/復旧証跡が残る |  |  |
| `stripe_events` に処理結果・失敗理由が残る |  |  |
| `npm run test:ops-guard` が成功する |  |  |
| `npm run test:ops-write-guards` が成功する |  |  |

## インフラ・外部サービス チェックリスト

| 項目 | 判定 | 証跡 |
|------|------|------|
| Railway本番環境変数を最新化した |  |  |
| Vercel本番環境変数/API接続先を確認した |  |  |
| `DATABASE_URL` / `DIRECT_URL` が本番DBを指している |  |  |
| StripeテストキーとWebhook Secretが正しく設定されている |  |  |
| `OPS_ALERT_WEBHOOK_URLS` を2系統以上設定した |  |  |
| 通知先1へテスト通知が届く |  |  |
| 通知先2へテスト通知が届く |  |  |
| Uptime監視でバックエンド `/api/health` を監視している |  |  |
| Uptime監視でフロントURLを監視している |  |  |
| Stripe DashboardでWebhook失敗通知を有効化した |  |  |
| Stripe Dashboardで支払い失敗/異常支払い通知を有効化した |  |  |
| Railwayのデプロイ失敗通知を有効化した |  |  |
| Vercelのデプロイ失敗通知を有効化した |  |  |
| Railway Pro/PITRまたは日次 `npm run backup:database` を設定した |  |  |
| バックアップ保存先が暗号化・アクセス制限されている |  |  |
| 直近7世代以上の保管方針を決めた |  |  |
| `pg_restore --list` が成功する |  |  |
| 検証DBへの実復元ドリルが成功する |  |  |
| RPO/RTOを決めた |  |  |

## 自動停止・復旧ドリル

| 項目 | 判定 | 証跡 |
|------|------|------|
| 疑似Webhook失敗で `payment_paused` が自動発火する |  |  |
| 疑似決済不整合で `payment_paused` が自動発火する |  |  |
| 疑似DB障害で `maintenance` 相当のユーザー保護が発火する |  |  |
| 自動停止時に通知2系統へ届く |  |  |
| 自動停止中もStripe Webhookは受信される |  |  |
| 停止中にフロントバナーが表示される |  |  |
| 停止中に予約・決済が事前抑止される |  |  |
| 復旧前に決済照合を実行した |  |  |
| 復旧後に予約作成が成功する |  |  |
| 復旧後にStripe決済が成功する |  |  |
| 復旧後にWebhook反映が成功する |  |  |
| 復旧後に領収書PDFが取得できる |  |  |
| `normal` 復帰後の証跡を記録した |  |  |

## リリースGo条件

### 2026-07-07 A案 Go条件

以下がすべてOKになるまで、本番決済なし限定公開はGoにしない。

- 最新バックエンド・フロントが本番反映済み。
- 本番DBマイグレーション済み。
- DB永続運用モードが本番で動作確認済み。
- 自動 `payment_paused` と自動 `maintenance` 相当のドリル済み。
- 通知が2系統で到達済み。
- 自動バックアップまたはRailway Pro/PITRが有効。
- 復元ドリル済み。
- Stripe本番決済、正式な有料予約受付、本番カード登録、本番課金につながる導線が未開放である。
- customer / worker / admin の主要画面が公開前再確認で重大な 500 / 404 / 429 / CORS を継続発生させない。
- 決済関連画面が本番決済未開放として誤認防止できている。
- 問い合わせ、事前登録、β利用希望受付として利用できる導線が確認済み。
- `docs/BETA_EXECUTION_RESULT.md` と `docs/BETA_RELEASE_GONOGO_CHECKLIST.md` の証跡・署名が更新済み。

### B案 本番決済開放Go条件

以下がすべてOKになるまで、Stripe本番決済あり運用はGoにしない。

- 管理画面アクセス制限が有効。
- 管理者MFA/2FAが有効。
- 管理者ログイン失敗時のアカウントロックが実装・テスト済み。
- `/api/admin/*` がCloudflare側またはBackend側で追加保護されている。
- OWASP ZAP Baseline Scan、`npm audit`、管理API認可確認、SQL Injection / XSS観点の主要フォーム確認が実施済み。
- Stripe本番Webhook署名検証、delivery 2xx、同一イベント再送の冪等性が確認済み。
- Stripe本番決済の成功、失敗、Webhook反映、領収書、停止復旧が限定テストで確認済み。
- B案Go/No-Goの証跡がdocsに保存済み。

## 現時点の判定

現時点は **2026-07-07 A案Go候補: 本番決済なし限定公開** です。

理由:
- 24時間無人向けの主要な安全装置は実装・検証済み。
- 通知2系統、暗号化バックアップ、検証DB復元ドリル、`payment_paused` / `maintenance` 疑似発火はPASS。
- 社長確認により、7月7日はStripe本番決済なしで限定公開し、本番決済あり運用はセキュリティ対策後に段階移行する方針。
- 残る7月7日前確認は、主要画面、決済関連画面の誤認防止、問い合わせ・事前登録・β利用希望受付、外部監視サービス側の通知設定。

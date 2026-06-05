# KAJISHIFT リリース準備 専用チェックリスト

最終更新: 2026-06-04

## 目的

このチェックリストは、一般公開に近い形で24時間予約・決済を開ける前に、フロントエンド・バックエンド・インフラ・運用・計画自体の不備を確認するためのものです。

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

以下がすべてOKになるまで、一般公開に近い24時間予約・決済開放はGoにしない。

- 最新バックエンド・フロントが本番反映済み。
- 本番DBマイグレーション済み。
- DB永続運用モードが本番で動作確認済み。
- 自動 `payment_paused` と自動 `maintenance` 相当のドリル済み。
- 通知が2系統で到達済み。
- 自動バックアップまたはRailway Pro/PITRが有効。
- 復元ドリル済み。
- Stripe Webhookが停止中も受信できる。
- 復旧後スモーク済み。
- `docs/BETA_EXECUTION_RESULT.md` と `docs/BETA_RELEASE_GONOGO_CHECKLIST.md` の証跡・署名が更新済み。

## 現時点の判定

現時点は **β公開Go: 24h自動停止ガードあり** です。

理由:
- 24時間無人向けの主要な安全装置は実装・検証済み。
- 通知2系統、暗号化バックアップ、検証DB復元ドリル、`payment_paused` / `maintenance` 疑似発火はPASS。
- 残る人間確認は、本番反映後の画面確認、外部監視サービス側の通知設定、日次バックアップ継続スケジュール、Stripe Dashboard同一イベント再送確認。

# KAJISHIFT β版 E2E エッジケースマトリクス

β版リリース前に、既存のロール別テスト仕様書に加えて実行する異常系・境界値テストを定義する。

## 認証・認可

| ID | シナリオ | 期待結果 |
|----|----------|----------|
| E-A01 | トークンなしで `GET /api/bookings` | 401 |
| E-A02 | 依頼者トークンで `POST /api/bookings/:id/complete` | 403 |
| E-A03 | `POST /api/auth/register` に `role=ADMIN` | 403 |
| E-A04 | 未承認ワーカーが `POST /api/bookings/:id/accept` | 403 |
| E-A05 | 他ユーザーの予約詳細取得 | 403 または 404 |
| E-A06 | 期限切れ JWT | 401 |

## 予約

| ID | シナリオ | 期待結果 |
|----|----------|----------|
| E-B01 | `PENDING` 予約で `POST /api/payments/intent` | 4xx |
| E-B02 | 2人のワーカーが同一予約を承諾 | 2件目は失敗 |
| E-B03 | 拒否済み予約を承諾 | 失敗 |
| E-B04 | `COMPLETED` 予約の更新 | 失敗 |
| E-B05 | `CANCELLED` 予約の作業完了 | 失敗 |
| E-B06 | 依頼者が `available=true` を指定 | 仕様どおり拒否または通常一覧 |
| E-B07 | `startDate` / `endDate` の UTC 日境界 | 期待件数 |

## Stripe 決済

| ID | シナリオ | 期待結果 |
|----|----------|----------|
| E-P01 | `4242424242424242` で決済成功 | `Payment.status=COMPLETED` |
| E-P02 | `4000000000000002` でカード拒否 | UI エラー、`FAILED` または `PENDING` |
| E-P03 | `4000002760003184` で 3DS 成功 | `COMPLETED` |
| E-P04 | Webhook 遅延中に画面リロード | 最終的に状態一致 |
| E-P05 | 同一 Stripe event 再送 | 二重更新なし |
| E-P06 | 決済ボタン連打 | 1 予約 1 PaymentIntent |
| E-P07 | フロント金額改ざん | サーバ計算額のみ採用 |
| E-P08 | 決済済み予約で再 Intent | 409 または 4xx |
| E-P09 | 未完了決済の領収書取得 | 4xx |
| E-P10 | 日本語領収書 PDF | 文字化けなし |

## キャンセル・返金

| ID | シナリオ | 期待結果 |
|----|----------|----------|
| E-C01 | 未決済予約キャンセル | `CANCELLED` |
| E-C02 | 決済済み予約キャンセル | 管理者返金手順へ誘導 |
| E-C03 | 返金後の領収書 | β返金方針どおり |

## リアルタイム・ファイル

| ID | シナリオ | 期待結果 |
|----|----------|----------|
| E-R01 | Socket 切断後の再接続 | 未読数が復元 |
| E-R02 | 不正 Origin の Socket 接続 | 拒否 |
| E-R03 | 再デプロイ後のアップロード画像 | 200 |
| E-R04 | チャット当事者以外のメッセージ取得 | 403 |

## レビュー・その他

| ID | シナリオ | 期待結果 |
|----|----------|----------|
| E-X01 | 未完了予約へのレビュー | 4xx |
| E-X02 | 二重レビュー | 4xx |
| E-X03 | ログイン失敗 6 回 | 429 |
| E-X04 | 本番 `GET /api/health/db` / `/api-docs` | 404 |

## β運用ガード

| ID | シナリオ | 期待結果 |
|----|----------|----------|
| E-O01 | `BETA_OPERATION_MODE=normal` | `GET /api/public/status` が `normal`、予約作成・決済開始が可能 |
| E-O02 | `BETA_OPERATION_MODE=booking_paused` | UIで予約フォーム停止、API `POST /api/bookings` が503、既存閲覧は200 |
| E-O03 | `BETA_OPERATION_MODE=payment_paused` | UIで新規予約・決済・カード登録を停止、API `POST /api/bookings` と `POST /api/payments/intent` が503、Webhookは受信継続 |
| E-O04 | `BETA_OPERATION_MODE=maintenance` | 予約・決済・レビュー・メッセージ送信・アップロード・プロフィール・管理者更新が503、問い合わせ作成と既存閲覧は継続 |
| E-O05 | `BETA_STOP_MESSAGE` / `BETA_RESUME_AT` | APIとUIバナーに同じ停止文言・復旧予定が表示される |
| E-O06 | `normal` 復旧後スモーク | 予約作成、Stripe決済、Webhook反映、領収書取得が通る |
| E-O07 | DB永続運用モード | `POST /api/admin/ops/mode` で切替後、再起動後も `GET /api/public/status` が同じmodeを返す |
| E-O08 | 自動 `payment_paused` | Webhook失敗/Payment不整合閾値超過で `payment_paused` に自動切替し通知される |
| E-O09 | 自動 `maintenance` | DBヘルス失敗閾値超過で `maintenance` に自動切替し通知される |
| E-O10 | 全書き込みガード | 登録、カード、アップロード、お気に入り、プロフィール、ワーカー不可枠、管理者更新がmaintenance中に停止 |
| E-O11 | 自動バックアップ | `npm run backup:database` が暗号化dumpとmanifestを作成し、7世代保持、`pg_restore --list`、週次復元ドリルが成功 |

## 2026-05-18 実行結果

| ID | 結果 | 証跡 |
|----|------|------|
| E-A01 | PASS | トークンなし `GET /api/bookings` が401 |
| E-A02 | PASS | 依頼者トークンで `POST /api/bookings/:id/complete` が403 |
| E-A03 | PASS | 公開登録 `role=ADMIN` が403 |
| E-A05 | PASS | 他ユーザー予約詳細が403 |
| E-A06 | PASS | 期限切れJWTが401 |
| E-B01 | PASS | PENDING予約の `POST /api/payments/intent` が409 |
| E-B02 | PASS | 二重承諾の2件目が409 |
| E-B04 | PASS | COMPLETED予約更新が409 |
| E-B05 | PASS | CANCELLED予約の作業完了が409 |
| E-B06 | PASS | 依頼者の `available=true` は通常一覧として200 |
| E-B07 | PASS | `startDate` / `endDate` 指定で200 |
| E-P01 | PASS | `pi_3TYLwcFX94mMTqKm1U6EO6vw` がsucceeded、DBはCOMPLETED |
| E-P02 | PASS | `pi_3TYLwkFX94mMTqKm04SyWvIk` がcard_declined、DBはFAILED |
| E-P03 | PASS | `pi_3TYLxfFX94mMTqKm1jQ545Bl` がrequires_action |
| E-P05 | 条件付き | 実Webhook反映はPASS。Stripe Dashboard/CLIからの同一イベント再送は公開直前運用確認 |
| E-P08 | PASS | 決済済み予約の再Intentが409 |
| E-P09 | PASS | 存在しない/未完了領収書が404/409系4xx |
| E-P10 | PASS | 日本語フォント入りPDFが200で生成 |
| E-R03 | PASS | DBフォールバック実装後、再デプロイ後の `/uploads/...` が200 |
| E-R04 | PASS | チャット当事者以外の取得が403 |
| E-X01 | PASS | 未完了予約へのレビューが409 |
| E-X02 | PASS | 二重レビューが409 |
| E-X03 | PASS | ログイン連続失敗で429 |
| E-X04 | PASS | 本番 `GET /api/health/db` / `/api-docs` が404 |

## 2026-05-19 監視・停止・復旧ガード確認

| ID | 結果 | 証跡 |
|----|------|------|
| E-O01 | PASS | `npm run test:ops-guard` で `normal` のcapability行列を確認 |
| E-O02 | PASS | `npm run test:ops-guard` で `booking_paused` は新規予約のみ停止、既存予約更新は許可 |
| E-O03 | PASS | `npm run test:ops-guard` で `payment_paused` は新規予約・決済開始・SetupIntent・カード管理を停止 |
| E-O04 | PASS | `npm run test:ops-guard` で `maintenance` は主要書き込み操作を停止し、問い合わせ作成は障害連絡用に許可 |
| E-O05 | PASS | `BETA_STOP_MESSAGE` / `BETA_RESUME_AT` の反映を単体テストで確認 |
| E-O06 | 手順化 | 本番切替後にRunbookの復旧後スモークとして実行 |

## 2026-05-19 24時間無人向け自動停止確認

| ID | 結果 | 証跡 |
|----|------|------|
| E-O07 | 実装済み/本番反映待ち | `system_settings` 永続化、`ops_incidents` 証跡、管理者APIを追加 |
| E-O08 | 実装済み/疑似発火待ち | `opsAutoPauseService` がWebhook失敗・決済不整合から `payment_paused` へ自動切替 |
| E-O09 | 実装済み/検証環境発火待ち | `opsMonitorJob` がDBヘルス失敗から `maintenance` へ自動切替 |
| E-O10 | PASS | `npm run test:ops-write-guards` で主要書き込みガードを静的検査 |
| E-O11 | 手順化 | `npm run backup:database` と外部スケジューラ/Pro/PITRをGo条件に追加 |

## 2026-06-04 24h Auto Ops最終確認

| ID | 結果 | 証跡 |
|----|------|------|
| E-O01 | PASS | `npm run test:ops-guard` |
| E-O03 | PASS | `npm run test:ops-guard`、フロント `node tests\test-ops-ui-static.js` |
| E-O04 | PASS | `npm run test:ops-guard`、`npm run test:ops-write-guards` |
| E-O07 | PASS | `npm run prisma:migrate:deploy` で `20260519073000_add_ops_automation` 適用 |
| E-O08 | PASS | `npm run test:payment-reconciliation`、`npm run ops:monitor`、検証DBで `payment_reconciliation_anomaly` から `payment_paused` 疑似発火、通知2系統到達 |
| E-O09 | PASS | 検証DBで `api_5xx_error` 10件から `maintenance` 疑似発火、通知2系統到達。DB完全停止時は外部監視 + `BETA_OPERATION_MODE_OVERRIDE=maintenance` 手順で補完 |
| E-O10 | PASS | `npm run test:ops-write-guards` |
| E-O11 | PASS | `npm run backup:database` で暗号化 `.dump.enc` とmanifestを作成し、`npm run backup:restore-drill -- <backup-file>` で検証DBへの復元成功 |

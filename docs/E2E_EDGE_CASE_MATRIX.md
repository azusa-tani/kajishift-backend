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

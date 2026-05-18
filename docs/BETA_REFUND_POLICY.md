# KAJISHIFT β版 返金運用方針

β版では Stripe テストモードのみを使用するため実課金は発生しない。ただし、本番相当の運用検証として、決済済み予約のキャンセル時の取り扱いを定義する。

## 基本方針

- β版の返金は自動化を必須とせず、Stripe Dashboard と管理者運用で処理する。
- `Payment.status` は返金完了後に `REFUNDED` へ更新する。
- 返金対象の予約は `Booking.status` を `CANCELLED` にする。

## 返金対象

| ケース | 方針 |
|--------|------|
| 未決済予約のキャンセル | `Booking.status=CANCELLED` のみ。Stripe 操作なし |
| 決済成功後、作業前キャンセル | Stripe Dashboard で返金し、DB を `REFUNDED` に更新 |
| 作業完了後キャンセル | 原則返金対象外。個別判断 |
| Stripe テスト決済失敗 | `Payment.status=FAILED` または `PENDING` のまま再試行 |

## β版の運用手順

1. 管理者が対象予約と決済を確認する。
2. Stripe Dashboard で PaymentIntent ID（`pi_...`）を確認する。
3. 必要に応じて Stripe Dashboard 上で返金する。
4. 管理者 API または DB 管理手順で `Payment.status=REFUNDED` にする。
5. 依頼者・ワーカーへ通知する。

## 一般公開前に必要な追加実装

- 管理者用返金 API: `POST /api/admin/payments/:id/refund`
- Stripe `charge.refunded` Webhook の自動処理
- 返金済み領収書の表示方針
- ワーカー報酬精算との連動

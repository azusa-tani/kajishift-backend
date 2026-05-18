# KAJISHIFT β版 予約・決済フロー

この文書は、β版における予約、決済、作業完了、レビュー、領収書発行の公式フローを定義する。

## 基本方針

- β版の決済は Stripe テストモードのみを使用し、実課金は行わない。
- 決済タイミングは前払いとし、予約が `CONFIRMED` になった後、作業完了前に決済する。
- ワーカーへの報酬支払いは β版では Stripe Connect を使わず、社内運用による手動精算とする。

## 標準フロー

| 順序 | アクター | 状態・処理 | API |
|------|----------|------------|-----|
| 1 | 依頼者 | 予約作成 | `POST /api/bookings` |
| 2 | ワーカー | 予約承諾、予約が `CONFIRMED` になる | `POST /api/bookings/:id/accept` |
| 3 | 依頼者 | Stripe PaymentIntent を作成 | `POST /api/payments/intent` |
| 4 | 依頼者 | Stripe.js でテストカード決済を確定 | Stripe.js |
| 5 | Stripe | Webhook で決済成功を通知 | `POST /api/webhooks/stripe` |
| 6 | バックエンド | `Payment.status` を `COMPLETED` に更新 | Webhook 内部処理 |
| 7 | ワーカー | 作業完了、`Booking.completedAt` を記録 | `POST /api/bookings/:id/complete` |
| 8 | 依頼者 | レビュー投稿 | `POST /api/reviews` |
| 9 | 依頼者 | 領収書 PDF ダウンロード | `GET /api/payments/:id/receipt` |

## 決済可能条件

| 予約状態 | 決済 Intent 作成 | 理由 |
|----------|------------------|------|
| `PENDING` | 不可 | ワーカー未確定のため金額・提供者が確定しない |
| `CONFIRMED` | 可 | β版の標準決済タイミング |
| `IN_PROGRESS` | 可 | 作業開始後の救済ケースとして許容 |
| `COMPLETED` | 不可 | 作業完了後の新規決済は β版では扱わない |
| `CANCELLED` | 不可 | キャンセル済み予約は決済しない |

## 二重決済防止

- 1予約につき有効な PaymentIntent は 1 件のみとする。
- 既に `COMPLETED` の `Payment` がある予約では新規 Intent を作成しない。
- Webhook は Stripe event ID または PaymentIntent ID を基準に冪等に処理する。

## β版で扱わないこと

- Stripe live key による実課金
- Stripe Connect によるワーカー自動送金
- 作業完了後の後払いフロー
- 公開登録による管理者作成

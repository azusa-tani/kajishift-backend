# フロントエンド Stripe β統合ガイド

この文書は、Vercel 側のバニラ JS フロントエンドで β版 Stripe Test Mode 決済を実装するための API 契約と画面要件を定義する。

## 設定

`js/config.js` または同等の設定源に以下を設定する。

```js
window.APP_CONFIG = {
  API_BASE_URL: 'https://kajishift-backend-production.up.railway.app/api',
  SOCKET_SERVER_URL: 'https://kajishift-backend-production.up.railway.app',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_xxx',
  BETA_MODE: true
};
```

## 必須 UI

- 全ページに「β版 / Stripe Test Mode / 実課金なし」を表示する。
- カード番号・CVC は自社フォームで収集せず、必ず Stripe Elements を使う。
- 決済ボタンは処理中に disabled にし、二重送信を防止する。
- 決済成功後も Webhook 反映に数秒かかる可能性があるため、履歴画面を polling または再取得する。

## 決済フロー

1. 依頼者が `CONFIRMED` 予約の決済ボタンを押す。
2. `POST /api/payments/intent` を呼び、`clientSecret` を取得する。
3. `stripe.confirmCardPayment(clientSecret, { payment_method: { card } })` を実行する。
4. 成功後、決済履歴 `GET /api/payments` を再取得する。

## カード登録フロー

1. `POST /api/cards/setup-intent` で `clientSecret` を取得する。
2. Stripe Elements でカードを入力し、SetupIntent を confirm する。
3. 返却された `payment_method` を `POST /api/cards` に送信する。

## 廃止済み API

| API | β版の期待 |
|-----|-----------|
| `POST /api/payments` | 410 |
| `POST /api/cards` with `cardNumber` | 410 |

## テストカード

| 用途 | 番号 |
|------|------|
| 成功 | `4242 4242 4242 4242` |
| 拒否 | `4000 0000 0000 0002` |
| 3DS | `4000 0027 6000 3184` |

## PWA / Service Worker

- `/api/*` は長期キャッシュしない。
- 決済・通知・チャットは常に network-first または no-store とする。

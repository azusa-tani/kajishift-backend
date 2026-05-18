# KAJISHIFT β版 Go / No-Go チェックリスト

## Staging 必須

| 項目 | 判定 | 証跡 |
|------|------|------|
| `npm run prisma:migrate:deploy` 成功 |  |  |
| `npm run prisma:generate` 成功 |  |  |
| `npm run test:stripe-beta` 成功 |  |  |
| `docs/E2E_EDGE_CASE_MATRIX.md` 全項目実行 |  |  |
| 管理者・依頼者・ワーカー TEST_SPEC 実行 |  |  |
| Stripe Dashboard の PaymentIntent と DB `transactionId` が一致 |  |  |

## Production スモーク 20 項目

| # | 項目 | 判定 | 証跡 |
|---|------|------|------|
| 1 | 依頼者ログイン |  |  |
| 2 | ワーカー一覧 |  |  |
| 3 | 予約作成 |  |  |
| 4 | ワーカー承諾 |  |  |
| 5 | Stripe テスト決済 |  |  |
| 6 | Webhook 反映 |  |  |
| 7 | チャット送信 |  |  |
| 8 | 作業完了 |  |  |
| 9 | `completedAt` 確認 |  |  |
| 10 | レビュー投稿 |  |  |
| 11 | 領収書 PDF |  |  |
| 12 | 通知既読 |  |  |
| 13 | 管理者ログイン |  |  |
| 14 | ワーカー審査表示 |  |  |
| 15 | 問い合わせ作成 |  |  |
| 16 | 管理者返信 |  |  |
| 17 | `GET /api/health` 200 |  |  |
| 18 | `GET /api/health/db` 404 |  |  |
| 19 | `role=ADMIN` 公開登録 403 |  |  |
| 20 | β バナー表示 |  |  |

## No-Go 条件

- Stripe live key が設定されている。
- 旧カード番号 POST が受け付けられる。
- `GET /api/health/db` が本番で 200 を返す。
- Production に `password123` の seed アカウントが存在する。
- アップロードファイルが再デプロイ後に参照できない。

## 署名

| 役割 | 氏名 | Go / No-Go | 日付 | コメント |
|------|------|------------|------|----------|
| リード QA |  |  |  |  |
| バックエンド責任者 |  |  |  |  |
| フロントエンド責任者 |  |  |  |  |
| プロダクトオーナー |  |  |  |  |

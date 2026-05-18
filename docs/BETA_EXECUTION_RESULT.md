# KAJISHIFT β公開 実行結果

最終更新: 2026-05-18

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

## 残課題

| 項目 | 状態 | 理由 |
|------|------|------|
| Railway Dashboardでの自動バックアップ画面確認 | 条件付き | CLIは未ログインのため、Dashboard上のバックアップID/時刻は運用担当者の最終確認が必要 |
| Staging分離 | 条件付き | 今回はProduction URLで直接スモーク。β後は独立Stagingを整備する |
| Webhook手動再送 | 条件付き | 実決済Webhookは通過。Stripe Dashboard/CLIからの同一イベント再送はCLI未導入のため未実施 |

## Go / No-Go

現時点の判定は **条件付きGo** です。

条件:
- β公開前にRailway DashboardでDB自動バックアップの存在と直近バックアップ時刻を確認する。
- 本番seedアカウントの強い一時パスワードを安全な経路で管理者へ共有し、公開後は必要に応じて再ローテーションする。
- Stripe Dashboardで本番Webhookイベントの配信履歴を1回確認する。

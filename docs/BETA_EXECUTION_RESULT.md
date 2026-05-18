# KAJISHIFT β公開 実行結果

最終更新: 2026-05-18

## 実行済み

| 項目 | 結果 | 証跡 |
|------|------|------|
| 公開ADMIN登録拒否 | PASS | `POST /api/auth/register role=ADMIN` が本番で403 |
| 誤作成テストADMIN無効化 | PASS | `admin-check-*` / `admin-test-*` は `SUSPENDED` |
| 管理者削除API | PASS | 管理者削除は403。500を返さないよう修正済み |
| Stripe βスモーク | PASS | `npm run test:stripe-beta` 成功 |
| Stripe決済確定 | PASS | `bookingId=bbb1ebf4-3111-4dcb-919b-db31952763a0`, `PaymentIntent=pi_3TYKXpFX94mMTqKm15d0ewBK` |
| Webhook反映 | PASS | `Payment.status=COMPLETED`, `transactionId=pi_3TYKXpFX94mMTqKm15d0ewBK` |
| 旧決済API拒否 | PASS | `POST /api/payments` が410 |
| 旧カード番号POST拒否 | PASS | `POST /api/cards` にカード番号を送る旧方式が410 |
| 再決済・PENDING決済拒否 | IMPLEMENTED | 409を返すよう修正・push済み。本番反映待ちの確認では旧挙動500が残存 |
| ロール別API E2E | PASS/PARTIAL | 依頼者・ワーカー・管理者ログイン、予約詳細、チャット、作業完了、領収書PDF、レビュー、通知既読、管理者ユーザー/決済一覧 |
| 二重レビュー拒否 | IMPLEMENTED | 409を返すよう修正・push済み。本番反映前確認では旧挙動500 |
| 本番ヘルスチェック | PASS | `GET /api/health` が200 |
| DB診断非公開 | PASS | `GET /api/health/db` が404 |
| API Docs非公開 | PASS | `GET /api-docs` が404 |
| Vercel β設定 | PASS | `js/config.js` に `2026-05-18-stripe-beta`, `pk_test_...`, `BETA_MODE=true` |
| アップロード作成・参照 | PASS/PARTIAL | `POST /api/upload` 201、`/uploads/...` 200。再デプロイ後の永続性は未確認 |
| フロント変更 | PASS/PARTIAL | コミット `4d83f73` をpush。Vercel本番再デプロイはQueued/Initializing継続 |

## 残課題

| 項目 | 状態 | 理由 |
|------|------|------|
| Railway最新デプロイ確認 | BLOCKED | 再決済/PENDING決済/二重レビューのHTTPステータス修正が本番でまだ確認できていない |
| Vercel最新デプロイ完了 | BLOCKED | `npx vercel --prod` は投入済みだが、Vercel側でQueued/Initializingが継続 |
| アップロード再デプロイ後永続性 | PARTIAL | 作成・参照は通過。再デプロイ後も残ることは未確認 |
| Railwayバックアップ取得確認 | BLOCKED | CLI未認証のためDashboard上のバックアップ有無は未確認 |
| 本番seed弱パスワード | NO-GO | 本番テストで `password123` のseedアカウントを使用している |
| Staging分離 | NOT READY | 今回はProduction URLでのスモーク確認。独立Stagingは未整備 |

## Go / No-Go

現時点の判定は **No-Go** です。

理由:
- 決済・Webhookの中核は通過したが、最新修正の本番反映確認が未完了。
- Vercel最新デプロイが完了していない。
- 本番に `password123` のseedアカウントが残っている。
- バックアップ取得状況と再デプロイ後アップロード永続性がDashboard上で未確認。

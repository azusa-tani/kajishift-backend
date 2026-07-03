# KAJISHIFT β版 Go / No-Go チェックリスト

## 2026-07-07 リリース方針

2026-07-07 は **A案: 本番決済なし限定公開** としてGo/No-Goを判定する。Stripe本番決済は未開放のままとし、正式な有料予約受付、本番カード登録、本番課金につながる導線は公開範囲に含めない。

Stripe本番決済あり運用は、以下のセキュリティ対策とStripe本番確認が完了した後に、別途B案Go/No-Goとして判断する。

- 管理画面アクセス制限
- 管理者MFA/2FA
- 管理者ログイン失敗時のアカウントロック
- 脆弱性診断またはペネトレーションテスト証跡
- Stripe本番Webhook、本番決済、返金/失敗系を含む本番相当確認

## Staging 必須

| 項目 | 判定 | 証跡 |
|------|------|------|
| `npx prisma migrate deploy` 成功 | OK | `20260518083000_add_file_content`、`20260519073000_add_ops_automation` 適用済み |
| `npx prisma migrate status` 成功 | OK | Database schema is up to date |
| Stripe βフロー成功 | 既存証跡 | Test Modeで成功・拒否・3DS要求・旧API拒否を確認済み。2026-07-07 A案では本番決済開放条件に含めない |
| β運用ガード | OK | `GET /api/public/status`、`GET /api/health.operation`、`npm run test:ops-guard` |
| 24h自動停止ガード | OK | DB永続モード、自動停止、API 5xx検知、決済照合、管理者API、`npm run ops:monitor` PASS。検証DBで `payment_paused` / `maintenance` 疑似発火PASS |
| 停止モードUI | OK | 公開状態取得、上部バナー、503専用パネル、予約/決済/カード/チャット抑止、Service Workerキャッシュ除外を実装 |
| 監視・通知Runbook | OK | 通知本文2系統前提、通知失敗OpsEvent、`OPS_ALERT_WEBHOOK_URLS` 2件到達を確認 |
| バックアップ・切り戻しRunbook | OK | 暗号化 `npm run backup:database`、7世代保持、検証DB復元ドリル、GitHub Actions日次/週次復元ドリル雛形、切り戻し手順 |
| `docs/E2E_EDGE_CASE_MATRIX.md` 全項目実行 | OK/条件付き | APIでMust項目確認。Socket切断再接続とStripe Dashboard再送は運用確認扱い |
| 管理者・依頼者・ワーカー TEST_SPEC 実行 | OK | Production URLで主要API E2Eと主要ページ200を確認 |
| Stripe Dashboard の PaymentIntent と DB `transactionId` が一致 | 既存証跡 | Test Modeの `PaymentIntent` とDB `transactionId` の一致を確認済み。Live ModeはB案移行時に別途確認 |

## Production スモーク 20 項目

| # | 項目 | 判定 | 証跡 |
|---|------|------|------|
| 1 | 依頼者ログイン | OK | `customer1@example.com` でAPIログイン成功 |
| 2 | ワーカー一覧 | OK | `GET /api/workers` 200 |
| 3 | 予約作成 | OK | `bookingId=44809532-f0c6-4980-9052-0da94f97dd67` ほか |
| 4 | ワーカー承諾 | OK | 未割当予約を作成し `POST /api/bookings/:id/accept` 200 |
| 5 | Stripe テスト決済 | 既存証跡 | Test Modeで `PaymentIntent=pi_3TYLwcFX94mMTqKm1U6EO6vw` succeeded。A案では本番決済を実行しない |
| 6 | Webhook 反映 | 既存証跡 | Test Modeで `Payment.status=COMPLETED`。Live WebhookはB案移行前の必須確認 |
| 7 | チャット送信 | OK | `POST /api/messages` 201相当 |
| 8 | 作業完了 | OK | `POST /api/bookings/:id/complete` 成功 |
| 9 | `completedAt` 確認 | OK | 作業完了APIで確認 |
| 10 | レビュー投稿 | OK | 初回レビュー投稿成功 |
| 11 | 領収書 PDF | OK | `GET /api/payments/:id/receipt` 200 |
| 12 | 通知既読 | OK | `PUT /api/notifications/read-all` 成功 |
| 13 | 管理者ログイン | OK | `admin@kajishift.com` でAPIログイン成功 |
| 14 | ワーカー審査表示 | OK | `GET /api/admin/workers` 系の管理機能はユーザー/決済一覧と同権限で確認 |
| 15 | 問い合わせ作成 | OK | `POST /api/support` 201 |
| 16 | 管理者返信 | OK | `PUT /api/admin/support/:id` 200 |
| 17 | `GET /api/health` 200 | OK | Productionで200 |
| 18 | `GET /api/health/db` 404 | OK | Productionで404 |
| 19 | `role=ADMIN` 公開登録 403 | OK | Productionで403 |
| 20 | β バナー表示 | OK | Vercel `js/config.js` で `BETA_MODE=true` |

## 2026-07-07 A案 Go 条件

| 項目 | 判定 | 証跡 / 確認方法 |
|------|------|----------------|
| リリース範囲が本番決済なし限定公開として合意済み | OK | 社長確認結果によりA案で進行 |
| Stripe本番決済を有効化しない | 必須 | Stripe Live Modeの決済受付、live key切替、正式課金開始を行わない |
| 正式な有料予約受付を開始しない | 必須 | 予約導線を確認し、課金確定・本番決済完了を前提にしない運用とする |
| 本番カード登録・本番課金につながる導線を出さない | OK | `customer/register.html` の未送信カード欄削除済み。2026-07-03に `customer/payment.html` で「カード登録は準備中」disabled表示、カード追加ボタン/カード入力モーダル/カード番号入力欄/カード名義人入力欄/追加ボタンなしを確認 |
| 問い合わせ・事前登録・β利用希望受付として利用できる | 必須 | 新規登録、問い合わせ、管理者確認、β利用希望の受付導線を再確認 |
| customer / worker / admin 主要画面が重大エラーなし | 必須 | 公開直前に下記「再確認対象画面」を実ブラウザで確認 |
| 決済関連画面が準備中・誤認防止表示になっている | OK | 2026-07-03に `customer/payment.html`, `worker/rewards.html`, `admin/payments.html` をProduction Aliasで確認。3画面とも本番決済、本番カード登録、正式な有料予約受付につながる導線なし。Console重大エラーなし、継続的な 500 / 404 / 429 / CORS なし |
| Stripe本番決済開放前の残タスクがdocsに明記されている | OK | 本チェックリストの「B案移行前 必須残タスク」 |

## 2026-07-03 A案決済関連画面確認

| 画面 | 判定 | 確認結果 |
|------|------|----------|
| `customer/payment.html` | OK | 本番URLで表示確認済み。「カード登録は準備中」のdisabled表示あり。「カードを追加」ボタン、カード入力モーダル、カード番号入力欄、カード名義人入力欄、「追加する」ボタンなし。カード登録不可、本番決済・カード登録はセキュリティ対応完了後、問い合わせ・事前登録・β利用希望受付のみ受け付ける旨を表示。`/api/auth/me`, `/api/payments?limit=100`, `/api/public/status`, `/api/notifications/unread-count` は確認範囲で200。Console重大エラーなし、継続的な 500 / 404 / 429 / CORS なし |
| `worker/rewards.html` | OK | 本番URLで表示確認済み。報酬・精算情報は準備中で、β版では詳細表示は準備中、運営から個別案内の趣旨を表示。決済開始導線、カード登録導線なし。Console重大エラーなし、継続的な 500 / 404 / 429 / CORS なし |
| `admin/payments.html` | OK | 本番URLで表示確認済み。「β版での注意」として、決済一覧・売上KPI・報酬精算・キャンセル料管理は実データ連携前と表示。β運用中の決済確認はStripe DashboardまたはCSV/Excel出力で行う旨、返金・キャンセル料・報酬精算の本格管理は今後対応予定と表示。決済状況一覧は準備中、サンプル決済履歴は実決済と誤認しないよう非表示。本番決済操作、カード登録、返金・決済確定などの実操作導線なし。`/api/auth/me`, `/api/public/status`, `/api/notifications/unread-count` は確認範囲で200。Console重大エラーなし、継続的な 500 / 404 / 429 / CORS なし |

上記により、A案「本番決済なし限定公開」の決済関連画面はOK扱いとする。ただし、Stripe本番決済・本番Webhook確認は未実施であり、B案移行前の必須残タスクとして残す。

## 公開前 再確認対象画面

| 区分 | 画面 | 確認ポイント |
|------|------|--------------|
| customer | `/customer/register.html` | 事前登録として利用可能。カード番号/CVV/有効期限など未送信カード欄がない |
| customer | `/customer/login.html`, `/customer/dashboard.html` | ログイン、主要メニュー、β表示、重大なConsole/Networkエラーなし |
| customer | `/customer/booking.html`, `/customer/select-worker.html`, `/customer/bookings.html` | テスト用予約導線、ワーカー候補表示、正式課金前提の誤認がない |
| customer | `/customer/payment.html` | 本番決済未開放として誤認がない。本物のカード情報入力や実課金を行わない |
| worker | `/worker/register.html`, `/worker/login.html`, `/worker/dashboard.html` | ワーカー事前登録・ログイン・主要メニューが確認できる |
| worker | `/worker/jobs.html`, `/worker/calendar.html`, `/worker/profile.html` | 案件、予定、プロフィール確認で重大エラーなし |
| worker | `/worker/rewards.html` | 報酬/精算詳細が準備中で、固定口座・固定報酬・本番精算済みの誤認がない |
| worker | `/worker/screening-test.html` | β利用希望/ワーカーテスト導線として確認できる |
| admin | `/admin/login.html`, `/admin/dashboard.html` | 管理者ログイン、KPI、worker-test-submissions API 404なし |
| admin | `/admin/users.html`, `/admin/workers.html`, `/admin/bookings.html` | 事前登録者、ワーカー、予約状況を確認できる |
| admin | `/admin/worker-test-submissions.html` | ワーカーテスト提出確認ができる |
| admin | `/admin/payments.html` | Stripe本番有効化前として準備中・誤認防止表示になっている |
| admin | `/admin/support.html`, `/admin/settings.html` | 問い合わせ受付・設定画面表示。未連携機能が実運用済みと誤認されない |

## B案移行前 必須残タスク

| 項目 | 必須対応 | 完了条件 |
|------|----------|----------|
| 管理画面アクセス制限 | Cloudflare Access等で `/admin/*` を保護 | 管理者以外がアクセスできず、証跡スクリーンショットがある |
| 管理者MFA/2FA | Cloudflare Accessまたはアプリ内MFAで必須化 | MFAなしで管理画面へ進めないことを確認 |
| 管理者ログイン失敗時のアカウントロック | アプリ側で管理者アカウント単位のロックを実装 | 例: 5回失敗で30分ロック。テスト証跡あり |
| 脆弱性診断/ペネトレーションテスト証跡 | OWASP ZAP Baseline Scan、`npm audit`、管理API認可確認 | Critical/High未対応なし、または対応記録あり |
| `/api/admin/*` 保護 | Cloudflare側保護またはBackend追加制限 | Railway直URLを含め、未許可の管理APIアクセスが拒否される |
| Stripe本番Webhook確認 | Live Mode webhook endpointと署名検証を確認 | Dashboard delivery 2xx、APIログ、`stripe_events` 証跡 |
| Stripe本番決済確認 | 本番決済開始、成功、失敗、Webhook反映、領収書確認 | 本番開放前の限定テストで証跡あり |

## No-Go 条件

- 2026-07-07 A案の範囲で、Stripe live key を使った本番決済受付を開始している。
- 正式な有料予約受付、本番カード登録、本番課金につながる導線が利用者に開いている。
- 決済画面が本番決済可能であるかのように見える。
- 旧カード番号 POST が受け付けられる。
- `GET /api/health/db` が本番で 200 を返す。
- Production に弱い固定seedパスワードが存在する。
- アップロードファイルが再デプロイ後に参照できない。
- `payment_paused` / `maintenance` 中に `POST /api/payments/intent` が成功する。
- `booking_paused` / `payment_paused` / `maintenance` 中に新規予約作成が成功する。
- Stripe Webhook が停止モード中に受信できない。
- 決済異常やWebhook失敗が閾値を超えても `payment_paused` に自動切替されない。
- DBヘルス失敗またはAPI 5xx急増が閾値を超えても `maintenance` に自動切替されない。
- 日次自動バックアップまたはRailway Pro/PITRが未設定。
- 通知先が1系統のみ、または通知到達が確認できない。
- 検証DBへの復元ドリルが実行できない。
- 事前登録、問い合わせ、β利用希望受付、主要画面表示のいずれかで継続的な 500 / 404 / 429 / CORS エラーが発生する。

## 署名

| 役割 | 氏名 | Go / No-Go | 日付 | コメント |
|------|------|------------|------|----------|
| リード QA | GPT-5.5 | 2026-07-07 A案Go候補: 本番決済なし限定公開 | 2026-07-03 | 社長確認によりA案で進行。Stripe本番決済、正式な有料予約受付、本番カード登録は未開放。B案移行前に管理画面アクセス制限、MFA、管理者アカウントロック、脆弱性診断、Stripe本番Webhook/決済確認を別Go判定する |
| バックエンド責任者 |  |  |  |  |
| フロントエンド責任者 |  |  |  |  |
| プロダクトオーナー |  |  |  |  |

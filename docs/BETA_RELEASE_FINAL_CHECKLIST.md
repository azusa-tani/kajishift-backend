# KAJISHIFT β公開前 最終チェックリスト

最終更新: 2026-07-06

## 前提判定

- 現時点の実確認後判定: **2026-07-07 A案Go候補**
- 条件: **本番決済なし限定公開**。Stripe本番決済、正式な有料予約受付、本番カード登録、本番課金につながる導線は公開範囲に含めない。
- Stripe本番決済あり運用は、管理画面アクセス制限、管理者MFA/2FA、管理者ログイン失敗時アカウントロック、脆弱性診断証跡、Stripe本番Webhook/本番決済確認が完了した後に別Go/No-Goで判断する。
- 24h自動停止ガード、本番最新デプロイ反映、本番読み取り系、GitHub Actions日次バックアップ/復元ドリルは既存証跡上PASS。
- 本番での予約作成、PaymentIntent作成、領収書DLの再実行は、本番データ保護のため行わない。
- 本番書き込みを伴う追加E2EはStagingで実施する。

## 2026-07-03 決済関連画面 本番URL確認

7月7日 A案「本番決済なし限定公開」の観点で、以下3画面をProduction Aliasで確認済み。証跡上、個人名、メールアドレス、住所、userId、APIキー、Secret、DB接続文字列、決済情報の実値は記録しない。

| 画面 | 判定 | 確認結果 |
|------|------|----------|
| `https://kajishift-frontend.vercel.app/customer/payment.html` | OK | 「カード登録は準備中」のdisabled表示あり。「カードを追加」ボタン、カード入力モーダル、カード番号入力欄、カード名義人入力欄、「追加する」ボタンなし。カード登録不可、本番決済・カード登録はセキュリティ対応完了後、問い合わせ・事前登録・β利用希望受付のみ受け付ける旨を表示。`/api/auth/me`, `/api/payments?limit=100`, `/api/public/status`, `/api/notifications/unread-count` は確認範囲で200 |
| `https://kajishift-frontend.vercel.app/worker/rewards.html` | OK | 報酬・精算情報は準備中。β版では詳細表示は準備中、運営から個別案内の趣旨を表示。決済開始導線、カード登録導線なし |
| `https://kajishift-frontend.vercel.app/admin/payments.html` | OK | 「β版での注意」として、決済一覧・売上KPI・報酬精算・キャンセル料管理は実データ連携前と表示。β運用中の決済確認はStripe DashboardまたはCSV/Excel出力で行う旨、返金・キャンセル料・報酬精算の本格管理は今後対応予定と表示。決済状況一覧は準備中、サンプル決済履歴は実決済と誤認しないよう非表示。本番決済操作、カード登録、返金・決済確定などの実操作導線なし。`/api/auth/me`, `/api/public/status`, `/api/notifications/unread-count` は確認範囲で200 |

共通結果:

- 本番カード登録、本番決済、正式な有料予約受付につながる導線なし。
- Console重大エラーなし。
- 継続的な 500 / 404 / 429 / CORS なし。
- A案「本番決済なし限定公開」としてOK。
- Stripe本番決済・本番Webhook確認は未実施。B案移行前の必須残タスクとして残す。

## 2026-07-03 問い合わせ導線 本番URL確認

7月7日 A案「本番決済なし限定公開」の観点で、問い合わせ受付導線をProduction Aliasで確認済み。証跡上、個人名、メールアドレス、問い合わせ本文、問い合わせID、userId風の値、住所、予約ID、APIキー、Secret、DB接続文字列、決済情報の実値は記録しない。

| 画面 | 判定 | 確認結果 |
|------|------|----------|
| `https://kajishift-frontend.vercel.app/customer/support.html` | OK | 依頼者ログイン後、問い合わせフォームが正常表示。件名、問い合わせ種別、返信先メールアドレス、本文を入力でき、テスト問い合わせを1件送信。送信後に受付完了メッセージを確認。`POST /api/support` は201、`/api/auth/me`, `/api/public/status`, `/api/notifications/unread-count` は確認範囲で200 |
| `https://kajishift-frontend.vercel.app/worker/support.html` | OK | ワーカーログイン後、問い合わせフォームが正常表示。件名、問い合わせ種別、返信先メールアドレス、本文を入力でき、テスト問い合わせを1件送信。送信後に受付完了メッセージを確認。`POST /api/support` は201、`/api/public/status` 系は確認範囲で200 |
| `https://kajishift-frontend.vercel.app/admin/dashboard.html` | OK | customer/worker側から送信したテスト問い合わせが「未対応の問い合わせ」に表示されたことを確認。「すべて見る」導線から問い合わせ管理へ進める状態を確認。「対応する」ボタンはDB更新を伴う可能性があるため未押下 |
| `https://kajishift-frontend.vercel.app/admin/support.html` | OK | 問い合わせ一覧が正常表示され、customer/worker側から送信したテスト問い合わせを確認。問い合わせステータス「新規」、アサイン「未アサイン」を確認。`対応する`, `自分にアサイン`, `対応開始`, `削除` はDB更新・削除を伴う可能性があるため未押下。`GET /api/support?limit=1000`, `/api/auth/me`, `/api/public/status`, `/api/notifications/unread-count` は確認範囲で200 |

共通結果:

- Console重大エラーなし。
- 継続的な 500 / 404 / 429 / CORS なし。
- 本番決済、返金、カード登録、正式有料予約受付への導線なし。
- A案「本番決済なし限定公開」として問い合わせ受付導線はOK。
- Stripe本番決済・本番Webhook確認は未実施。B案移行前の必須残タスクとして残す。

## 2026-07-06 事前登録・β利用希望受付導線 静的確認

7月7日 A案「本番決済なし限定公開」の観点で、事前登録・β利用希望受付導線を確認した。公開登録画面は2026-07-03に未送信の実ブラウザ確認済み。認証後画面は実ブラウザ確認未実施のため、今回はコードベースの静的確認として扱い、最終判定は保留する。確認者は `KAJISHIFT運用担当`。個人名、メールアドレス、住所、問い合わせ本文、問い合わせID、userId風の値、予約ID、submissionId、APIキー、Secret、DB接続文字列、決済情報の実値は記録しない。

静的確認対象:

- `worker/screening-test.html`
- `admin/users.html`
- `admin/workers.html`
- `admin/worker-test-submissions.html`
- `admin/worker-test-submission-detail.html`
- `js/worker-screening-test.js`
- `js/admin-worker-test-submissions.js`
- `js/admin-worker-test-submission-detail.js`
- `js/api.js`
- `js/auth.js`
- `js/worker-notification-badge.js`
- `src/index.js`
- `src/routes/admin.js`
- `src/routes/workerTestSubmissions.js`
- `src/controllers/adminController.js`
- `src/controllers/workerTestSubmissionController.js`
- `src/services/adminService.js`
- `src/services/workerTestSubmissionService.js`

| 画面 | 役割 | 静的確認結果 |
|------|------|--------------|
| `worker/screening-test.html` | ワーカー本人の審査テスト回答、提出状況、提出済み回答の確認 | 本番決済、カード登録、正式有料予約受付の実行導線は見つからない。更新系は「回答を送信する」に紐づく `POST /api/workers/me/screening-test` |
| `admin/users.html` | 依頼者一覧の読み取り表示 | 本番決済、カード登録、正式有料予約受付の実行導線は見つからない。更新/出力系として停止/有効化、新規管理者登録、CSV/Excel出力が存在 |
| `admin/workers.html` | ワーカー一覧、本人確認有無、審査状態の読み取り表示 | 本番決済、カード登録、正式有料予約受付の実行導線は見つからない。更新/出力系として停止、CSV/Excel出力が存在 |
| `admin/worker-test-submissions.html` | ワーカー審査テスト提出一覧の読み取り表示 | 本番決済、カード登録、正式有料予約受付の実行導線は見つからない。詳細リンクは読み取り画面への遷移 |
| `admin/worker-test-submission-detail.html` | 審査提出詳細、AI一次判定、管理者最終判定の確認 | 本番決済、カード登録、正式有料予約受付の実行導線は見つからない。更新系として「合格にする」「不合格にする」が `POST /api/admin/worker-test-submissions/:id/final-review` に紐づく |

API確認:

- 読み取り系: `GET /api/auth/me`, `GET /api/workers/me/screening-test`, `GET /api/admin/users`, `GET /api/admin/workers`, `GET /api/admin/worker-test-submissions`, `GET /api/admin/worker-test-submissions/:id`, `GET /api/notifications/unread-count`
- 更新/出力系: `POST /api/workers/me/screening-test`, `PUT /api/admin/users/:id`, `POST /api/admin/register`, `PUT /api/admin/workers/:id`, `POST /api/admin/worker-test-submissions/:id/final-review`, `GET /api/admin/reports/users/export/csv|excel`, `GET /api/admin/reports/workers/export/csv|excel`
- 対象画面・関連JSから、`/payments/intent`, `/cards/setup-intent`, `/cards`, `/bookings` の書き込み系API呼び出しは見つからなかった。

判定:

- 静的確認ベースでは、A案「本番決済なし限定公開」を止める大きなNGは見つからない。
- ただし、認証後画面の実ブラウザ確認、Console/Network確認、共通ナビの誤認リスク確認は未実施のため、認証後画面としての最終OK判定は保留。
- 共通ナビに `予約管理`、`決済・売上`、ワーカー側に `仕事を探す`、`報酬` などの表示があるため、A案期間中に正式予約・決済・報酬精算が利用可能と誤認されないかは実ブラウザで確認する。
- 本番確認時は、審査テスト送信、停止/有効化、新規管理者登録、合格/不合格、CSV/Excel出力を押下しない運用が必要。

残課題:

- 既存テストアカウントを使った認証後実ブラウザ読み取り確認。
- 認証後画面のConsole重大エラー、Networkの継続的な 500 / 404 / 429 / CORS 確認。
- `/payments/intent`, `/cards/setup-intent`, `/cards`, `/bookings` の意図しない書き込み系リクエストが発生しないことの実ブラウザNetwork確認。
- 共通ナビと画面文言のA案期間中の誤認リスク確認。

## 2026-07-06 admin詳細リンク404修正後 実ブラウザ再確認

Frontend commit `aed5147 fix: 静的HTMLリンクの404を修正` の本番反映後、Production Aliasでadmin詳細導線を実ブラウザ確認した。確認者は `KAJISHIFT運用担当`。個人名、メールアドレス、住所、電話番号、審査回答本文、userId、workerId、submissionId、予約ID、APIキー、Secret、DB接続文字列、決済情報の実値は記録しない。URLのID実値は記録せず、既存の詳細リンクから遷移した結果のみ記録する。

| 画面 / 導線 | 判定 | 確認結果 |
|-------------|------|----------|
| `admin/workers.html` の既存詳細/審査リンク | OK | 既存リンクから `worker-detail.html` が正常表示された。修正前に発生していた `.html` なしURL起因の404は、この導線では解消 |
| `admin/worker-test-submissions.html` の既存詳細リンク | OK | 既存リンクから `worker-test-submission-detail.html` が正常表示された。修正前に発生していた `.html` なしURL起因の404は、この導線では解消 |

共通結果:

- Console重大エラーなし。
- Network主要GETは200。
- 意図しないPOST/PUT/PATCH/DELETEは確認されていない。
- 停止、承認/却下、合格/不合格、削除、CSV/Excel出力などの更新・出力系操作は未実施。
- 確認範囲では、本番決済、カード登録、正式有料予約受付につながる実行導線は見当たらない。
- worker側の優先度Cリンクは未対応の残課題として残す。

## 2026-07-06 worker静的HTMLリンク404修正後 実ブラウザ再確認

Frontend commit `8f32009 fix: worker側の静的HTMLリンク404を修正` はpush済み。Production Aliasでworker側の仕事詳細導線を実ブラウザ確認した。確認者は `KAJISHIFT運用担当`。bookingId、userId、workerId、氏名、メールアドレス、住所、電話番号、審査回答本文、APIキー、Secret、DB接続文字列、決済情報の実値は記録しない。URLのID実値は記録せず、既存リンクから遷移した結果のみ記録する。

| 画面 / 導線 | 判定 | 確認結果 |
|-------------|------|----------|
| `worker/jobs.html` の既存仕事詳細リンク | OK | 既存リンクから `worker/job-detail.html` へ遷移でき、静的HTMLリンク起因の404は発生しなかった |
| `worker/dashboard.html` の既存仕事詳細リンク | OK | 既存リンクから `worker/job-detail.html` へ遷移でき、静的HTMLリンク起因の404は発生しなかった |
| `worker/job-detail.html` から `worker/chat.html` へのリンク | コード確認済み / 実クリック未確認 | コード上は `.html` 付きに修正済み。ただしPENDING未割当案件では `worker/job-detail.html` 側が403表示となるため、該当導線からの実クリック確認は未完了 |
| `worker/chat.html` 直接表示 | OK | 既存URL直接入力では正常表示された |

補足:

- PENDING未割当案件から `worker/job-detail.html` を開くと、現行 `GET /api/bookings/:id` のworker権限制御により403となる。
- この403は静的HTMLリンク修正とは別課題として扱う。
- 既存 `GET /api/bookings/:id` には詳細住所、依頼者情報、自由記述、決済情報などが含まれ得るため、未承諾workerにそのまま開放するのは避ける。
- 未承諾workerに案件詳細を見せる場合は、個人情報・詳細住所・決済情報を返さないworker公開案件専用APIの追加を検討する。
- A案では本番決済・正式有料予約受付は未開放のため、workerの仕事詳細閲覧・承諾導線を公開範囲に含めないなら即No-Goではなく残課題扱いとする。
- 更新系操作、承諾、送信、DB操作、本番決済、カード登録、正式予約受付操作は未実施。

## 2026-07-06 A案Frontend誤認防止修正・実Chrome確認

7月7日 A案「本番決済なし限定公開」の観点で、Frontendローカル作業ツリーに誤認防止修正を実施した。確認者は `KAJISHIFT運用担当`。この記録には、個人名、メールアドレス、住所、電話番号、問い合わせ本文、審査回答本文、問い合わせID、userId風の値、workerId、bookingId、予約ID、submissionId、APIキー、Secret、DB接続文字列、決済情報の実値を記録しない。

修正概要:

- `index.html` / `flow.html` は、`β版受付中`、`事前登録`、`β利用希望`、`お問い合わせ` 中心の文言へ変更。
- 本番決済、正式予約、カード登録は未開始である注記をトップ、利用の流れ、関連ページに追加。
- `customer/booking.html` の予約作成導線はA案中に停止し、予約作成API `POST /bookings` に進まないようガード。
- `customer/select-worker.html` / `js/select-worker.js` は、ワーカー選択からの予約確定導線をA案中に停止。
- `customer/booking-detail.html` / `js/booking-detail.js` は、決済導線、Stripe.js、カード入力UI、PaymentIntent導線をA案中に停止。
- `customer/favorites.html` は、正式予約へ進む導線をβ利用希望・問い合わせ寄りに変更。
- `worker/jobs.html`, `worker/dashboard.html`, `worker/job-detail.html` は、承諾、辞退、作業完了導線をA案中に停止または準備中表示へ変更。
- `legal.html` / `terms.html` は、正式サービス前提の決済・予約・キャンセル料記載にβ受付中注記を追加。
- `js/auth.js` / `js/config.js` は、共通バナー文言とA案限定公開フラグをA案方針に合わせた。

実Chrome確認結果:

| 対象 | 判定 | 確認結果 |
|------|------|----------|
| `index.html`, `flow.html`, `legal.html`, `terms.html` | OK | `β版受付中`、`事前登録`、`β利用希望`、`お問い合わせ` 中心の導線と、本番決済・正式予約未開始の注記を確認 |
| customer主要画面 | OK（一部残課題あり） | `customer/booking.html` で `POST /bookings` は発生せず、`customer/booking-detail.html` ではStripe.js / Stripe入力UIは表示されず、`/payments/intent` も発生しなかった。`customer/favorites.html` のAPI取得失敗時TypeErrorは追加修正後に解消し、API失敗時も画面が落ちず `お気に入り情報を取得できませんでした` と表示されることを確認 |
| worker主要画面 | OK（一部残課題あり） | worker側の受注・作業系POST/PATCH/DELETEは発生しなかった。承諾、辞退、作業完了はA案中に停止または準備中表示 |
| Network | OK | 実Chrome巡回中、本番DB更新・決済系APIのPOST/PUT/PATCH/DELETEは発生していない。`/payments/intent` も発生していない |

未実施:

- 登録送信、予約作成、予約確定、決済、カード登録、承諾、辞退、作業完了、問い合わせ更新・削除、CSV/Excel出力。
- DB操作、Stripe操作、Railway操作、Cloudflare操作、Webhook再送、外部サービス操作。
- commit / push / deploy。

残課題:

- `customer/select-worker.html` はコード上予約確定停止ガード済みで、確認中に予約確定・DB更新系通信は発生していない。ただし認証済み状態での画面本体到達確認は未完了。
- `worker/job-detail.html` の403は既知の残課題。A案でworkerの仕事詳細閲覧・承諾導線を公開範囲に含めない場合は即No-Goではなく残課題扱い。
- 管理画面の予約管理・問い合わせ更新系ボタンはA案中の残課題。A案期間中は押下しない運用、または追加抑止の検討が必要。
- 既存正式機能コードはA案フラグ配下で一部残存している。A案中は表示・実行抑止済みだが、正式公開前に再点検する。
- 本修正はローカルFrontend作業ツリーでの確認であり、未commit / 未deploy。commit、push、Vercel本番反映後にProduction Aliasで再確認する。

## 2026-07-07 A案Frontend追加ステータス・通知文言修正 本番反映確認

7月7日 A案「本番決済なし限定公開」の本番画面確認で、依頼者画面の一部に正式予約確定済みに見える文言が残っていたため、Frontendで追加修正を実施し、GitHub `main` とVercel Production Aliasへの反映を確認した。確認者は `KAJISHIFT運用担当`。この記録には、個人名、メールアドレス、住所、電話番号、問い合わせ本文、審査回答本文、問い合わせID、userId風の値、workerId、bookingId、予約ID、submissionId、APIキー、Secret、DB接続文字列、決済情報の実値を記録しない。

追加修正commit:

- Frontend `57fee81 fix: A案向けに予約詳細ステータス文言を調整`
  - 対象: `js/booking-detail.js`
  - `customer/booking-detail.html` の `CONFIRMED` 表示を、A案フラグ有効時に `予約確定` ではなく `β確認済み（正式予約は未開始）` と表示するよう調整。
- Frontend `36c7459 fix: A案向けに依頼者予約ステータス文言を調整`
  - 対象: `customer/dashboard.html`, `js/customer-bookings.js`
  - `customer/dashboard.html` の「今後の予約」と `customer/bookings.html` の予約一覧で、A案フラグ有効時に `予約確定` ではなく `β確認済み（正式予約は未開始）` と表示するよう調整。
- Frontend `d1f1de1 fix: A案向けにダッシュボード通知文言を調整`
  - 対象: `customer/dashboard.html`
  - ダッシュボード「お知らせ」欄で、A案フラグ有効時のみ通知タイトル・本文・バッジをA案向け表示に変換。
  - 変換例: `予約が確定しました` は `β利用希望を確認しました`、個人名入り予約承認通知は `β利用希望の確認状況が更新されました。`、`作業が完了しました` は `β確認ステータスが更新されました`、予約系通知バッジは `β利用希望`。

本番反映確認結果:

| 対象 | 判定 | 確認結果 |
|------|------|----------|
| GitHub反映 | OK | `origin/main` が `d1f1de1` を指していることを確認。対象追加commitはいずれもpush済み |
| Vercel Production deployment | OK | Vercel Production deployment が `d1f1de1` 対象でsuccess。手動deploy / 再deployは未実施 |
| `customer/booking-detail.html` | OK | `予約確定` は表示されず、`β確認済み（正式予約は未開始）` を表示。本番決済・正式予約未開始の注記も表示 |
| `customer/dashboard.html` | OK | 「今後の予約」で `β確認済み（正式予約は未開始）` を表示。「お知らせ」欄では、正式予約確定、個人名入り予約承認、作業完了済みに見える通知文言がA案向け汎用文言へ表示上変換されることを確認 |
| `customer/bookings.html` | OK | 予約一覧で `予約確定` は表示されず、`β確認済み（正式予約は未開始）` を表示 |
| 決済導線 | OK | Stripe.js、カード入力UI、決済ボタンは表示されず、`/payments/intent` は発生しなかった |
| Network / Console | OK | 本番DB更新・決済系APIのPOST/PUT/PATCH/DELETEは発生していない。Console重大エラーなし |

未実施:

- 手動deploy、再deploy、DB操作、Stripe操作、Railway操作、Cloudflare操作、Webhook再送、外部サービス操作。
- 登録送信、予約作成、予約確定、決済、カード登録、承諾、辞退、作業完了、問い合わせ更新・削除。
- commit / push（Backend docs更新としては未実施）。

残課題:

- 実ユーザーtoken・実通知データでの最終目視確認は、必要に応じて読み取り限定で実施する。
- 管理画面の更新系ボタン確認は別確認範囲として継続する。
- `worker/job-detail.html` の403は既知の残課題として継続する。
- B案移行前には、管理画面アクセス制限、管理者MFA/2FA、管理者ログイン失敗時ロック、脆弱性診断、`/api/admin/*` 追加保護、Stripe本番Webhook・本番決済確認を実施する。

判定区分:

| 判定 | 意味 |
|------|------|
| OK | β公開前条件として確認済み、または既存証跡で代替可能 |
| 要確認 | β公開直前に人間がDashboard、画面、ログで確認する |
| 継続 | β公開後も定期運用・Staging整備として継続する |
| No-Go | 未解消の場合、β公開を止める |

## 2026-06-05 Cursor実確認サマリー

本確認では、本番データ保護のため、予約作成、PaymentIntent作成、決済実行、領収書DL再実行、本番DBを書き換える管理操作は実行していない。

追加切り分け結果:

- BackendのローカルHEADとGitHub `origin/main` は `d85486e9ec45000965257dfbdc7e67455be87368` で一致しているが、24h Auto Ops対応ファイルは未コミットの作業ツリーに残っている。
- `origin/main` の `src/index.js` には `/api/public` router登録と `health.operation` が存在せず、`src/routes/public.js` も存在しない。
- FrontendのローカルHEADとGitHub `origin/main` は `98e51c933bab46184eaebb0d1fe129cb86f05796` で一致しているが、ops UI対応は未コミットの作業ツリーに残っている。
- `origin/main` の `js/config.js` は `KAJISHIFT_CONFIG_VERSION='2026-05-18-stripe-beta'` で、ops版 `2026-06-03-24h-auto-ops` は未push。
- Railway/VercelのRedeployはGitHub `main` の既存commitを再ビルドしているだけのため、未pushの24h Auto Ops対応は反映されない。
- 2026-06-05にBackend commit `9683f446cb72be909c447d6871168b0c1679edb1`、Frontend commit `ad83fffc4682df6a5a29aa768f15864f7a785a9e` をGitHub `main` へpush済み。
- push後、本番 `/api/public/status` はHTTP 200で `mode=normal`、`/api/health` はHTTP 200で `operation.mode=normal` を返すことを確認済み。
- push後、本番 `js/config.js` はops版marker `2026-06-03-24h-auto-ops` を含むことを確認済み。
- GitHub Actions `Database backup and restore drill` の手動実行は `npm ci` が `package-lock.json` 不在で失敗。原因はBackend `.gitignore` が `package-lock.json` を除外していたこと。
- 対応として `.gitignore` から `package-lock.json` 除外を削除し、lockfileをGit管理対象に戻す。workflowは再現性重視で `npm ci` を維持する。
- ローカルWindowsで `npm ci --ignore-scripts` を試行したところ、lockfile不足ではなく Prisma engine DLL の `EPERM unlink` で停止。Linux GitHub Actions runnerでは該当DLLロックは想定されないため、Actions再実行で確認する。
- `package-lock.json` 追加後の手動実行では、backup job の `Create encrypted backup` で `pg_dump` version mismatch が発生。Railway PostgreSQL は18.3、GitHub ActionsのUbuntu標準 `postgresql-client` は16.14だった。
- 対応として `.github/workflows/database-backup.yml` をPGDG公式APTリポジトリから `postgresql-client-18` をインストールする構成へ変更し、`PG_DUMP_PATH=/usr/lib/postgresql/18/bin/pg_dump` と `PG_RESTORE_PATH=/usr/lib/postgresql/18/bin/pg_restore` を明示する。restore drill jobにも `npm ci` を追加する。
- PostgreSQL 18 client修正後の一度目の再実行では、backup job は成功しartifactも作成されたが、weekly restore drill job の `Run restore drill against verification DB` がexit code 2で失敗。`restore-drill.js` は `pg_restore` の終了コードをそのまま返すため、exit code 2は接続、権限、schema衝突、復元対象DB状態、またはdump内容に対する `pg_restore` 側の失敗を示していた。
- 対応として `restore-drill.js` に復元先URLの秘匿表示、backup file存在/サイズ、暗号化key形式、`pg_restore --version`、復号後サイズ、`pg_restore --list`、`pg_restore --verbose --exit-on-error --single-transaction` の詳細ログを追加。workflowにはartifact一覧表示と再帰的なbackup file探索を追加する。
- 2026-06-05にGitHub Actions `Database backup and restore drill #6` を `workflow_dispatch` で再実行し、Status `Success`、Total duration 2m 44s、Artifacts 1を確認。
- `backup` job はPASSし、encrypted backup artifact `kajishift-db-backup` を作成済み。artifact sizeは61.9 KB。
- `weekly-restore-drill` job はPASSし、検証DBへのrestore drill成功を確認。
- AnnotationsにNode.js 20 actions deprecated warningが出ているが、workflow自体は成功しているためβ公開ブロッカーではなく、β公開後の改善項目とする。

## 2026-06-15 予約時のワーカー空き状況連動 完了

β向け最小実装として、予約作成後のワーカー選択画面で、予約条件に対して対応可能かつ空いているワーカーだけを候補表示する連動を追加済み。API E2E、手動ブラウザE2E、clean URL代表導線クリック確認まで完了しており、β判定上は完了扱いとする。詳細な確認結果は `docs/LOCAL_E2E_CHECK.md` を参照する。

対象コミット:

- Backend: `ad322c0 feat: filter available workers for bookings`
- Frontend: `de76199 feat: show available workers during booking selection`
- Frontend: `7cfdf83 fix: preserve query params in clean urls`
- Backend docs: `4910c67 docs: record manual booking e2e result`
- Backend docs: `b65022f docs: record clean url navigation check`

追加API:

- `GET /api/bookings/:id/available-workers`

候補除外条件:

- 同時間帯に `CONFIRMED` / `IN_PROGRESS` の既存予約があるワーカー
- 対象時間帯と `WorkerUnavailableSlot` が重なるワーカー
- JSON v1形式の `availabilityText` で対象曜日・時間帯に対応不可と判定できるワーカー
- JSON v1形式の `serviceAreaText` で予約住所の市区町村と明確に合わないワーカー

時間帯判定:

- 現行フロントでは `booking-form.js` が日付と `startTime` を結合して `scheduledDate` を作成している。
- バックエンドの可用性判定は `scheduledDate` の絶対時刻 + `duration` を基準にする。
- `startTime` は表示・互換用の扱い。
- この扱いは既存の `src/utils/jstSlot.js` / `workerUnavailableSlotService` の設計と整合している。

二重予約防止:

- 候補表示時だけでなく、`updateBooking` などで `workerId` を設定する際にも最終可用性チェックを行う。
- 対応不可、既存予約重複、利用不可スロット重複の場合は `409` を返す。

フロントエンド挙動:

- `select-worker.js` は予約IDがある場合、新APIを優先して候補ワーカーを取得する。
- 既存カードUI、ラジオ選択、ソート、予約確定導線は流用。
- 候補0件時のメッセージ表示あり。
- `409` 時は選択解除、候補再取得、別ワーカー選択案内を行う。

確認済み:

- `node tests/test-booking-availability.js`
- `npm run test:ops-write-guards`
- `node --check` 対象JS
- `GET http://localhost:3000/api/health`
- `GET http://localhost:5500/customer/select-worker`
- モックによる既存予約重複、非重複、`WorkerUnavailableSlot`、`updateBooking` `409` 確認
- API E2E: OK。予約作成、`GET /api/bookings/:id/available-workers`、Available Worker表示、Busy Worker除外、予約確定まで確認済み。
- 手動ブラウザE2E: OK。ローカルブラウザでAvailable Worker表示、Busy Worker非表示、予約確定アラート、予約詳細の `CONFIRMED` 表示を確認済み。
- clean URL対策: OK。クエリ付き `.html?...` リンクをclean URLへ統一し、`.html?` 検索結果0件を確認済み。
- clean URL代表導線クリック確認: OK。customer予約一覧/詳細/予約変更/ワーカー選択/通知/チャット、worker通知/仕事詳細、adminワーカー管理/予約詳細の主要導線でクエリ維持を確認済み。

未実施・残課題:

- 外部クライアントが `scheduledDate` に時刻を含めず、`startTime` だけに時刻を入れる場合は、現行契約とズレる可能性がある。
- サービス対応可否は正規化モデルがないため、今回の最小実装では厳密なサービス別スキル判定はしていない。
- `availabilityText` / `serviceAreaText` は読めるJSON v1のみ判定し、判定不能な自由記述は既存運用を壊さないため許容している。
- `admin/support?id=...` の実クリック確認は未確認。
- `admin/worker-test-submissions?status=...` のURL欄でのstatusクエリ保持は補足確認余地あり。ただし主要なcustomer / worker / admin導線は確認済み。

## 2026-06-17 β向けUI誤認防止・未連携表示整理

βで実ユーザーまたは運用者が触る可能性がある画面について、未送信入力欄、固定サンプル、未実装ボタン、未連携の保存UIが実データ・実処理として誤認されないように整理済み。これは本格実装完了ではなく、β運用で誤認を避けるための最小安全対策として扱う。

対象コミット:

- Frontend: `7bb0649 fix: remove unused card fields from customer registration`
- Frontend: `f83cebc fix: hide sample worker reward account details`
- Frontend: `bcc8d4e fix: remove admin report dependency from worker dashboard`
- Frontend: `f16da09 fix: hide unavailable line login buttons`
- Frontend: `56a133b fix: remove static admin support incident data`
- Frontend: `aaecb6c fix: clarify admin dashboard chart placeholders`
- Frontend: `0fe8f7d fix: clarify unavailable admin settings`

完了扱い:

- `customer/register.html`: 会員登録時に送信・保存されないカード番号/CVV/有効期限等の入力欄を削除済み。カード登録は予約時または支払い設定で行う案内へ変更済み。
- `worker/rewards.html`: 固定口座、固定報酬、固定精算履歴、workerで利用できない `api.getPayments()` 呼び出しを削除済み。完了した仕事一覧は実API由来として残し、金額表示は外している。
- `worker/dashboard.html`: admin専用 `getAdminWorkerReport` 依存と固定報酬/固定実績表示を削除済み。当月完了件数のみworker向け予約API由来として表示。
- LINEログイン: `customer/login.html` / `worker/login.html` の未実装LINEログインボタンと `alert('実装予定')` を削除済み。通常メール/パスワードログインは維持。
- `admin/support.html`: 固定問い合わせ、固定事故履歴、固定ステータスを削除済み。問い合わせ一覧、詳細、ステータス更新、アサイン、削除、CSV出力は実API連携済みとして維持。
- `admin/dashboard.html`: KPIカードは既存レポートAPI由来として維持。日別売上推移グラフplaceholderはβ版では準備中である旨へ変更済み。
- `admin/settings.html`: サービスメニュー/対応エリア管理は実API連携済みとして維持。未連携のメールテンプレート、プッシュ通知、問い合わせ連絡先フォーム、固定操作ログ、固定ページング、未連携CSVボタンは削除済み。

準備中またはβ後対応:

- 報酬/精算詳細、自動精算、振込状態、固定口座表示はβ版では準備中。必要に応じて運営から個別案内する。
- 返金、キャンセル料、決済/売上/報酬精算の本格管理はβ版では外部管理または運用確認で代替し、画面上は準備中扱い。
- 日別売上推移グラフ、メールテンプレート編集、プッシュ通知設定、問い合わせ連絡先編集、操作ログ検索/CSV出力は準備中。
- LINEログインはβ版では未提供。通常ログイン導線で代替する。

未確認・要証跡のまま残す項目:

- Stripe Webhook署名検証のDashboard/ログ証跡、同一イベント再送確認。
- Stripe Dashboard、Railway、Vercel、外部監視の通知設定スクリーンショット。
- Stagingでの本番相当決済E2E、予約作成、PaymentIntent作成、Webhook、領収書DL。
- 本番主要画面の実ブラウザE2E、Console/Network重大エラーなしの証跡。

| 対象 | 実確認結果 | 確認方法 | 期待結果 | 証跡ファイル/ログの保存先 | 判定 | 残課題 | 扱い |
|------|------------|----------|----------|----------------------------|------|--------|------|
| Railway最新デプロイ確認 | Backend commit `9683f446cb72be909c447d6871168b0c1679edb1` をGitHub `main` へpush後、本番 `/api/public/status` 200 normal、`/api/health.operation` ありを確認 | `GET https://kajishift-backend-production.up.railway.app/api/health`, `GET /api/public/status`, `git ls-remote origin main` | `health.operation` あり、`/api/public/status` が200で `normal` | Shell実行ログ、本ファイル | OK | Railway Deployments画面で該当commit SHAとActive状態のスクショ保存 | 証跡スクショ待ち |
| Vercel最新デプロイ確認 | Frontend commit `ad83fffc4682df6a5a29aa768f15864f7a785a9e` をGitHub `main` へpush後、本番 `js/config.js` にops版markerを確認 | `GET https://kajishift-frontend.vercel.app/js/config.js?check=...`, `git ls-remote origin main` | ops版config marker、Production API URL、Beta modeが確認できる | Shell実行ログ、本ファイル | OK | Vercel Deployments画面でProduction Aliasとcommit SHAのスクショ保存 | 証跡スクショ待ち |
| 現在稼働中commit/deploy ID | Backend `origin/main=9683f446cb72be909c447d6871168b0c1679edb1`、Frontend `origin/main=ad83fffc4682df6a5a29aa768f15864f7a785a9e`。本番読み取りで最新機能反映を確認 | `git rev-parse HEAD`, `git ls-remote origin main`, Railway/Vercel Dashboard | 稼働中デプロイIDと対象commitが、24h Auto Opsを含む新commitと一致 | `docs/BETA_EXECUTION_RESULT.md`, Dashboardスクショ | OK（Dashboardスクショ待ち） | Railway/VercelのDeployments画面で稼働中commitを記録 | 証跡スクショ待ち |
| 本番 `prisma migrate deploy` 確認 | `npx prisma migrate status` で対象DBは `Database schema is up to date`。14 migrations確認 | `npx prisma migrate status` | `20260519073000_add_ops_automation` まで適用済み | Shell実行ログ、Prisma migration status | OK | Railway deploy log上の `prisma migrate deploy` 成功スクショは別途保存 | 主要確認はPASS、証跡スクショ待ち |
| 本番環境変数確認 | ローカル `.env` では必要名の存在、通知2系統、Stripe test key prefix、CORS非wildcard、復元guardを確認。Railway実値はDashboardで証跡保存する | dotenvを読み、値を表示せず存在・prefix・件数のみ確認 | 必須envあり、URLや秘密値はログに出さない | Shell実行ログ、本ファイル | OK（Dashboard証跡待ち） | Railway VariablesでProductionの `DATABASE_URL`, Stripe, operation mode, backup, CORSを目視確認し証跡保存 | 継続 |
| Vercel API URL確認 | ローカル `js/config.js` はProduction APIを指す。本番配信configもops版markerを確認済み | `ReadFile js/config.js`, 本番 `config.js` fetch | ProductionフロントがProduction APIを指す | `kajishift-frontend/js/config.js`, Shell実行ログ | OK（Network証跡待ち） | ブラウザNetworkログで `/api/public/status` 取得を確認し証跡保存 | 継続 |
| 本番読み取り系確認 | push後、本番 `/api/health` はHTTP 200 + `operation.mode=normal`、`/api/public/status` はHTTP 200 + `data.currentMode=normal`。フロント `/`, `/index.html`, `/customer/login.html`, `/worker/login.html` は200 | fetchによるGETのみ | health 200 + operation、public status 200 normal、主要ページ200 | Shell実行ログ、本ファイル | OK | ブラウザ画面/Networkのスクショ保存 | 証跡スクショ待ち |
| 外部監視/通知設定確認 | アプリ内通知2系統は到達済み。Uptime/Railway/Vercel/Stripe通知はDashboard証跡を保存する | 既存通知テスト結果、Runbook確認 | 2系統通知、外部監視、各Dashboard通知が有効 | `docs/BETA_EXECUTION_RESULT.md`, `docs/BETA_OPERATIONS_RUNBOOK.md` | OK（Dashboard証跡待ち） | 監視サービス、Railway、Vercel、Stripeの通知設定スクショ保存 | 継続 |
| 日次バックアップ継続設定 | GitHub Actions `Database backup and restore drill #6` を `workflow_dispatch` で再実行し、Status `Success`、Total duration 2m 44s、Artifacts 1を確認。`backup` job PASS、artifact `kajishift-db-backup` 61.9 KB、`weekly-restore-drill` PASS | GitHub Actions run #6、workflowファイル、artifact、restore drillログ | schedule有効、secrets設定、PostgreSQL 18 client導入、backup job成功、artifact作成、restore drill成功 | GitHub Actions画面、artifact `kajishift-db-backup` | OK | Node.js 20 actions deprecated warningはβ公開後に改善 | β公開前確認済み |
| ローカルガード系テスト | PASS | `npm run test:ops-guard`, `npm run test:ops-write-guards`, `npm run test:payment-reconciliation`, フロント `node tests\test-ops-ui-static.js` | 全てPASS | Shell実行ログ | OK | なし | β公開前確認済み |

## 1. デプロイ確認

| チェック | 確認方法 | 期待結果 | 証跡ファイル/ログの保存先 | 判定 |
|----------|----------|----------|----------------------------|------|
| [x] Railwayにバックエンド最新コードがデプロイ済み | Backend commit `9683f446cb72be909c447d6871168b0c1679edb1` push後、本番API読み取りで `/api/public/status` 200、`health.operation` あり | 最新コミットが `Success` / `Active`、`/api/public/status` が200 | Shell実行ログ、Railway Deploymentsのスクリーンショット待ち、`docs/BETA_EXECUTION_RESULT.md` | OK（Dashboardスクショ待ち） |
| [x] Vercelにフロントエンド最新コードがデプロイ済み | Frontend commit `ad83fffc4682df6a5a29aa768f15864f7a785a9e` push後、本番 `js/config.js` でops版markerを確認 | 最新コミットがProductionへ反映済み、ops版config markerあり | Shell実行ログ、Vercel Deploymentsのスクリーンショット待ち、フロント `docs/RELEASE_TEST_RESULTS.md` | OK（Dashboardスクショ待ち） |
| [x] 現在稼働しているコミット/デプロイIDを確認 | Backend `9683f446cb72be909c447d6871168b0c1679edb1`、Frontend `ad83fffc4682df6a5a29aa768f15864f7a785a9e`。本番読み取りで機能反映を確認 | バックエンド/フロントの稼働中デプロイIDと対象commitが追跡可能 | `docs/BETA_EXECUTION_RESULT.md` 追記欄、Railway/Vercelスクリーンショット待ち | OK（Dashboardスクショ待ち） |
| [x] 本番で `prisma migrate deploy` が完了 | `npx prisma migrate status` を実行。DB schema is up to date、14 migrations確認 | `20260519073000_add_ops_automation` まで適用済み | Shell実行ログ、Railway deploy logスクリーンショット待ち | OK（deploy log証跡待ち） |
| [ ] 本番起動時にPrisma client生成が成功 | Railway build/deploy logで `prisma generate` または `postinstall` を確認 | Prisma Clientが最新schemaで生成済み | Railway build log | 要確認 |

## 2. 環境変数確認

| チェック | 確認方法 | 期待結果 | 証跡ファイル/ログの保存先 | 判定 |
|----------|----------|----------|----------------------------|------|
| [ ] 本番 `DATABASE_URL` が正しい接続先 | Cursor上の `.env` は存在確認済み、`npx prisma migrate status` で対象DB接続OK。Railway Variablesは目視確認する。値は記録しない | Production DBを指し、検証DBやローカルDBではない | Shell実行ログ、確認者/確認時刻のみ `docs/BETA_EXECUTION_RESULT.md` に記録 | Dashboard確認待ち |
| [ ] `DIRECT_URL` が必要に応じて本番DBを指す | Cursor上の `.env` では未設定。Railway Variablesで必要性と接続先を確認 | Prisma migration用接続先が必要な場合は本番DB | Railway Variables確認メモ | ユーザー確認待ち |
| [x] `OPS_ALERT_WEBHOOK_URLS` が2系統設定済み | Cursor上で件数のみ確認。URL値は記録しない | 2件以上、Slack/Discord等の有効Webhook | 通知テスト結果 `deliveredTargets=2`, `failedTargets=0` | OK |
| [x] operation mode関連環境変数が正しい | Cursor上では `BETA_OPERATION_MODE` 未設定でdefault normal、`BETA_OPERATION_MODE_OVERRIDE` 未設定 | 通常時はdefault `normal`、緊急overrideは未設定 | Shell実行ログ、Railway Variables確認メモ待ち | OK（Railway確認待ち） |
| [x] バックアップ関連の環境変数名が正しい | Cursor上で `BACKUP_ENCRYPTION_KEY`, `RESTORE_DATABASE_URL`, `RESTORE_DRILL_CONFIRM`, `PG_DUMP_PATH`, `PG_RESTORE_PATH` の存在を確認 | 暗号化キーあり、復元先は検証DB、`RESTORE_DRILL_CONFIRM=verification-db` | Shell実行ログ、`docs/BETA_EXECUTION_RESULT.md`、バックアップmanifest | OK（GitHub secrets確認待ち） |
| [x] Stripe関連の本番/テスト混在がない | Cursor上で `STRIPE_SECRET_KEY=sk_test_...`, `STRIPE_PUBLISHABLE_KEY=pk_test_...` prefixを確認。Dashboard環境は目視確認 | β方針どおりStripe Test Modeで統一。意図しないlive/test混在なし | Shell実行ログ、Stripe Dashboard確認メモ待ち | OK（Dashboard確認待ち） |
| [x] Vercel側API URLが本番APIを向く | 本番配信 `js/config.js` にops版markerを確認。API URLはProduction Railwayを指す | ProductionフロントからProduction APIへ通信し、最新ops configが配信される | Shell実行ログ、Vercel Variables確認メモ、ブラウザNetworkスクリーンショット待ち | OK（Networkスクショ待ち） |
| [x] CORS originが本番フロントに限定 | Cursor上では `CORS_ORIGIN` 存在、wildcardではないことを確認。Railway Variablesで実値を目視確認 | `*` ではなく本番Vercel originを許可 | Shell実行ログ、Railway Variables確認メモ待ち | OK（Railway確認待ち） |

## 3. 本番読み取り系確認

| チェック | 確認方法 | 期待結果 | 証跡ファイル/ログの保存先 | 判定 |
|----------|----------|----------|----------------------------|------|
| [x] `GET /api/health` が正常応答 | 本番でHTTP 200 + `operation.mode=normal` を確認 | HTTP 200、`operation` に現在状態が含まれる | Shell実行ログ、スクリーンショット待ち | OK |
| [x] `GET /api/public/status` が `normal` を返す | 本番でHTTP 200 + `data.currentMode=normal` を確認 | `mode` / `currentMode` が `normal`、停止対象なし | Shell実行ログ、`docs/BETA_EXECUTION_RESULT.md` | OK |
| [x] フロントが最新statusを取得 | 本番 `js/config.js` がops版markerを含み、API側 `/api/public/status` が200。ブラウザNetworkは目視確認待ち | stale cacheではなく最新statusを取得 | Shell実行ログ、ブラウザNetworkスクリーンショット待ち | OK（Networkスクショ待ち） |
| [x] ログイン画面が表示される | 本番フロント `/`, `/index.html`, `/customer/login.html`, `/worker/login.html` をGET | HTMLがHTTP 200で返る | Shell実行ログ、スクリーンショット待ち | OK（画面目視待ち） |
| [ ] 主要ページが表示される | 顧客/ワーカー/管理者の主要ページを読み取り中心で確認 | 200表示、重大なConsole errorなし | スクリーンショット、Consoleログ | 要確認 |
| [ ] 停止UI読み込みに問題がない | `KajishiftOps` の読み込み、Service Worker更新、status取得を確認 | 停止バナー/503パネル用JS/CSSが最新 | ブラウザNetwork/Consoleログ | 要確認 |
| [x] 本番で予約作成・PaymentIntent作成・領収書DLを再実行しない | 既存Productionスモーク証跡を参照 | 本番データを増やさず、既存証跡で代替 | `docs/BETA_RELEASE_GONOGO_CHECKLIST.md` | OK |

## 4. 監視・通知確認

| チェック | 確認方法 | 期待結果 | 証跡ファイル/ログの保存先 | 判定 |
|----------|----------|----------|----------------------------|------|
| [ ] 外部監視が有効 | Uptime監視サービスでBackend `/api/health` とFrontend URLを確認。CursorからDashboard確認不可 | 5分程度の監視頻度で有効、失敗時通知あり | 監視Dashboardスクリーンショット | 継続 |
| [ ] Railway通知が有効 | Railway project通知設定を確認。CursorからDashboard確認不可 | Deploy失敗、runtime異常を通知 | Railway通知設定スクリーンショット | 継続 |
| [ ] Vercel通知が有効 | Vercel project通知設定を確認。CursorからDashboard確認不可 | Deploy失敗を通知 | Vercel通知設定スクリーンショット | 継続 |
| [ ] Stripe通知が有効 | Stripe DashboardでWebhook失敗、支払い失敗/異常通知を確認。CursorからDashboard確認不可 | Webhook失敗・決済異常が担当者へ通知 | Stripe Dashboardスクリーンショット | 継続 |
| [x] 通知2系統が到達確認済み | `sendOpsAlert` テスト結果を確認 | `configuredTargets=2`, `deliveredTargets=2`, `failedTargets=0` | `docs/BETA_EXECUTION_RESULT.md`、通知先の受信ログ | OK |
| [ ] 異常時の通知先が明記済み | Runbookと共有先を確認 | 通知先、確認担当、一次対応者が明確 | `docs/BETA_OPERATIONS_RUNBOOK.md`、運用連絡先 | 要確認 |
| [ ] 一次対応手順が明記済み | Runbookの障害時確認順序と停止/復帰手順を確認 | DB/Stripe/API/フロントの確認順序が明確 | `docs/BETA_OPERATIONS_RUNBOOK.md` | OK |

## 5. バックアップ・復元確認

| チェック | 確認方法 | 期待結果 | 証跡ファイル/ログの保存先 | 判定 |
|----------|----------|----------|----------------------------|------|
| [x] 暗号化バックアップが成功 | `npm run backup:database` の実行結果を確認 | `.dump.enc` と `.manifest.json` 作成 | `backups/` 配下のmanifest、`docs/BETA_EXECUTION_RESULT.md` | OK |
| [x] 復元ドリルが検証DBで成功 | `npm run backup:restore-drill -- <backup-file>` 実行結果を確認 | `target=verification-db`, `encrypted=true`、復元成功 | restore drill log、`docs/BETA_EXECUTION_RESULT.md` | OK |
| [x] 日次バックアップ継続スケジュールが設定済み | `.github/workflows/database-backup.yml` に `0 18 * * *` の日次scheduleを確認。`Database backup and restore drill #6` は `workflow_dispatch` で成功し、backup/restore drillともPASS | 24時間以内のRPOを満たす日次実行、PostgreSQL 18 client導入、backup job成功、artifact作成、restore drill成功 | GitHub Actions run #6、artifact `kajishift-db-backup` | OK |
| [ ] バックアップ保管先が確認済み | 保存先、暗号化、アクセス権限を確認 | 権限が限定され、平文dumpが残らない | 保管先設定メモ、manifest | 要確認 |
| [ ] 保持期間が確認済み | `BACKUP_RETENTION_COUNT` と保管ポリシーを確認 | 直近7世代以上を保持 | Railway/GitHub Actions設定、manifest | 要確認 |
| [x] 復元手順が確認済み | Runbookの復元手順を確認 | 検証DBで実復元済み、本番DBへ誤復元しないguardあり | `docs/BETA_OPERATIONS_RUNBOOK.md` | OK |
| [x] 週次復元ドリルの継続予定がある | `.github/workflows/database-backup.yml` の日曜cronと手動実行 `Database backup and restore drill #6` の `weekly-restore-drill` PASSを確認 | 週1回の復元確認が継続される | GitHub Actions workflow、run #6 | OK |

## 6. 決済・Webhook確認

| チェック | 確認方法 | 期待結果 | 証跡ファイル/ログの保存先 | 判定 |
|----------|----------|----------|----------------------------|------|
| [x] Stripe Test Mode Webhook直近イベントが `processed` | DB `stripe_events` 直近レコードを確認 | Test Modeの `payment_intent.succeeded` が `processed` | `docs/BETA_EXECUTION_RESULT.md` | 既存証跡 |
| [x] Stripe Test Mode Webhook failed件数が0 | DB `stripe_events` のfailed件数を確認 | `failedStripeEvents=0` | `docs/BETA_EXECUTION_RESULT.md` | 既存証跡 |
| [ ] Webhook署名検証が有効 | `STRIPE_WEBHOOK_SECRET` とWebhook controllerの署名検証ログを確認 | 署名なし/不正署名が拒否される | Railway Variables確認メモ、Stripe Dashboard | 要確認 |
| [x] 決済異常時に `payment_paused` へ遷移できる | 検証DBで疑似 `payment_reconciliation_anomaly` を作成 | `auto:payment_anomaly_threshold` で `payment_paused` | `docs/BETA_EXECUTION_RESULT.md` | OK |
| [x] `payment_paused` で予約/決済/カード操作が抑止される | 検証DBのcapabilityと静的ガードテストを確認 | `createBooking`, `createPaymentIntent`, `cardWrite` が停止 | `npm run test:ops-guard`、`docs/E2E_EDGE_CASE_MATRIX.md` | OK |
| [ ] Stripe Live Mode Webhook確認 | B案移行前にLive endpoint、署名検証、delivery 2xxを確認 | Live Mode webhookが署名検証付きで受信される | Stripe Dashboard delivery log、Railway log、DB `stripe_events` | B案前必須 |
| [ ] Stripe Live Mode本番決済確認 | B案移行前に限定テストで本番決済、失敗、Webhook反映、領収書を確認 | 正式開放前にLive決済全体の証跡がある | Stripe Dashboard、API log、画面スクリーンショット | B案前必須 |
| [ ] 同一イベント再送時の冪等性 | Stripe DashboardまたはStripe CLIで同一eventを再送 | 重複処理されず、既存 `stripe_events` とPayment状態が壊れない | Stripe Dashboard delivery log、API log | B案前必須 |
| [ ] Stagingで本番相当決済E2Eを実施 | Stagingで予約、PaymentIntent、決済成功、Webhook、領収書DLを通す | 本番データを汚さず決済全体を再確認 | Staging E2Eログ | B案前必須 |

## 7. 運用モード・停止ガード確認

| チェック | 確認方法 | 期待結果 | 証跡ファイル/ログの保存先 | 判定 |
|----------|----------|----------|----------------------------|------|
| [x] 本番運用モードが `normal` | 本番 `GET /api/public/status` で `data.currentMode=normal`, `blockedOperations=[]` を確認 | `currentMode=normal`, `blockedOperations=[]` | Shell実行ログ、`docs/BETA_EXECUTION_RESULT.md` | OK |
| [x] `payment_paused` 切替手順が明記済み | Runbookの受付停止・復旧手順を確認 | 管理者APIまたは自動サーキットで切替可能 | `docs/BETA_OPERATIONS_RUNBOOK.md` | OK |
| [x] `maintenance` 切替手順が明記済み | Runbookの受付停止・復旧手順、override手順を確認 | 管理者API、自動サーキット、緊急override手順が明確 | `docs/BETA_OPERATIONS_RUNBOOK.md` | OK |
| [x] 停止時に予約/決済/カード操作が抑止される | `npm run test:ops-guard`, `npm run test:ops-write-guards` | 書き込みAPIのガード漏れなし | テスト実行ログ、`docs/E2E_EDGE_CASE_MATRIX.md` | OK |
| [x] フロント停止UIが表示される | フロント静的テストと実装確認 | バナー、ボタン抑止、503パネル、Service Worker除外あり | フロント `docs/RELEASE_TEST_RESULTS.md` | OK |
| [x] 復帰手順が明記済み | Runbookのnormal復帰前チェックを確認 | DB/Payment/Webhook/通知確認後に手動で `normal` へ戻す | `docs/BETA_OPERATIONS_RUNBOOK.md` | OK |
| [ ] 本番デプロイ後の停止UI読み取り確認 | 本番フロントでstatus取得とUI読み込みを確認 | 最新JS/CSSが読み込まれ、停止UIが利用可能 | ブラウザNetwork/Consoleログ | 要確認 |

## 8. 既知事象・残リスク

| チェック | 確認方法 | 期待結果 | 証跡ファイル/ログの保存先 | 判定 |
|----------|----------|----------|----------------------------|------|
| [x] Windowsローカル短命Node通知テスト終了時のPrisma系assertを記録 | 通知送信後 `deliveredTargets=2` の後に終了時assertが出た事象を記録 | 通知/DB処理完了後の終了時事象として扱う。本番常駐APIのブロッカーにしない | 本ファイル、`docs/BETA_EXECUTION_RESULT.md` 追記推奨 | OK |
| [ ] Staging未分離または未整備リスクを記載 | 現在のStaging有無を確認 | 本番書き込みE2Eを避けるため、Staging整備を継続課題化 | `docs/RELEASE_READINESS_CHECKLIST.md` | 継続 |
| [x] DB完全停止時の対応方針を記載 | RunbookのDB完全停止時手順を確認 | 外部監視で検知し、`BETA_OPERATION_MODE_OVERRIDE=maintenance` で補完 | `docs/BETA_OPERATIONS_RUNBOOK.md` | OK |
| [x] 日次バックアップ継続設定の未実施状況を明記 | GitHub Actions `Database backup and restore drill #6` でbackup job、artifact作成、weekly restore drillがすべてPASS | backup job成功、restore drill job成功 | 本ファイル、GitHub Actions run #6 | OK |
| [ ] 外部監視の未実施状況を明記 | Uptime/Railway/Vercel/Stripe通知設定を確認 | 設定済みならOKへ更新。未設定ならβ公開後も即時整備する | 監視Dashboardスクリーンショット | 継続 |
| [ ] 本番相当E2E未実施状況を明記 | Staging E2E実行状況を確認 | 本番では再実行せず、Stagingで継続実施 | Staging E2Eログ | 継続 |
| [ ] Node.js 20 actions deprecated warning | GitHub Actions run #6のAnnotationsで確認。workflow自体はSuccessのためβ公開ブロッカーではない | Actionsの推奨バージョンへ更新する | GitHub Actions annotations | 継続 |

## 9. Go / No-Go 判定

| 項目 | 内容 |
|------|------|
| 判定 | **2026-07-07 A案Go候補: 本番決済なし限定公開** |
| 条件 | Stripe本番決済、正式な有料予約受付、本番カード登録、本番課金につながる導線を未開放にする。Backend/Frontend本番反映、`/api/public/status` normal、`/api/health.operation` normal、GitHub Actions backup/restore drill PASSは既存証跡を参照 |
| 未完了項目 | 本番決済あり運用に必要な管理画面アクセス制限、管理者MFA/2FA、管理者ログイン失敗時アカウントロック、脆弱性診断/ペネトレーションテスト証跡、Stripe Live Mode Webhook/本番決済確認 |
| 7月7日公開前に必須で潰す項目 | customer / worker / admin 主要画面の実ブラウザ再確認、決済関連画面の誤認防止確認、問い合わせ・事前登録・β利用希望受付の確認、正式課金導線がないことの確認 |
| A案後に継続対応する項目 | B案移行計画として、Cloudflare Access等の管理画面保護、`/api/admin/*` 保護、管理者アカウントロック実装、OWASP ZAP / `npm audit` / 管理API認可確認、Stripe本番Webhook/本番決済E2E、Staging整備、週次復元ドリル |
| 判断理由 | 社長確認により7月7日は本番決済なし限定公開で進行するため、Stripe本番決済のセキュリティ確認4項目は7月7日A案Go条件から切り離し、B案移行前の必須残タスクとして管理する。A案では事前登録、問い合わせ、β利用希望受付、主要画面確認を公開範囲とする |

## Stagingで実施する本番相当E2E

| チェック | 確認方法 | 期待結果 | 証跡ファイル/ログの保存先 | 判定 |
|----------|----------|----------|----------------------------|------|
| [ ] 予約作成 | Staging顧客で予約作成 | Booking作成、一覧/詳細表示 | Staging E2Eログ | 継続 |
| [ ] PaymentIntent作成 | Staging予約から決済開始 | Stripe PaymentIntent作成、DB `transactionId` 保存 | Stripe Dashboard、DB確認ログ | 継続 |
| [ ] Stripe決済完了 | 成功カード/3DS/拒否カードを実行 | 成功、追加認証、拒否が期待どおり | Stripe Dashboard、API log | 継続 |
| [ ] Webhook受信 | Stripe event deliveryを確認 | API 200、`stripe_events.status=processed` | Stripe Dashboard delivery log | 継続 |
| [ ] 支払いステータス反映 | Webhook後のPaymentと画面を確認 | `COMPLETED` 反映、UI表示更新 | DB確認ログ、画面スクリーンショット | 継続 |
| [ ] 領収書DL | 完了済みPaymentのPDF取得 | HTTP 200、PDF生成 | API log、ブラウザ確認 | 継続 |
| [ ] 異常時 `payment_paused` 発火 | 疑似不整合またはWebhook失敗閾値を作る | `payment_paused`、通知2系統、予約/決済/カード停止 | OpsEvent/OpsIncident、通知ログ | 継続 |
| [ ] フロント停止UI表示 | `payment_paused` / `maintenance` をStagingで切替 | バナー、ボタン抑止、503表示、復帰後解除 | 画面スクリーンショット、Networkログ | 継続 |

## 共有用サマリー

KAJISHIFT の2026-07-07公開方針は **A案Go候補: 本番決済なし限定公開** です。Stripe本番決済、正式な有料予約受付、本番カード登録、本番課金につながる導線は未開放とし、問い合わせ・事前登録・β利用希望受付を中心に公開します。暗号化バックアップ、検証DBへの復元ドリル、通知2系統到達、`payment_paused` / `maintenance` 疑似発火、ガード系テスト、フロント停止UI静的テストはPASS済みです。Stripe本番決済あり運用は、管理画面アクセス制限、管理者MFA/2FA、管理者ログイン失敗時アカウントロック、脆弱性診断証跡、Stripe Live Mode Webhook/本番決済確認が完了した後に、別途B案Go/No-Goとして判断します。

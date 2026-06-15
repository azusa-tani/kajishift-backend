# ローカルE2E手動確認手順

## 目的

予約時のワーカー空き状況連動を、ローカル環境の実ブラウザで確認するための手順です。依頼者として予約を作成し、ワーカー選択画面で利用可能ワーカーだけが表示され、予約確定まで既存フローどおり進むことを確認します。

## 前提

- Backend API: `http://localhost:3000/api`
- Frontend: `http://localhost:5500`
- Backend起動: `npm run dev`
- Frontend起動: `npx serve . -l 5500`
- 既存の全削除型seedである `prisma/seed.js` / `npm run seed` は、この手順では実行しない。
- ローカルE2E用seedは `npm run seed:e2e-local` を使う。このseedはE2E専用メールアドレスを `upsert` する非破壊seedで、`deleteMany()` は使っていない。
- 古い `node src/index.js` プロセスが `3000` 番を握っていると、seed済みアカウントでも `401` になる可能性がある。確認前に現行コードのBackendで起動し直す。

## 事前準備

1. Backendを現行コードで起動する。

   ```powershell
   cd "C:\Users\谷口 梓\Desktop\kajishift-backend"
   npm run dev
   ```

2. Frontendを配信する。

   ```powershell
   cd "C:\Users\谷口 梓\Desktop\kajishift-frontend"
   npx serve . -l 5500
   ```

3. E2E用seedを実行する。

   ```powershell
   cd "C:\Users\谷口 梓\Desktop\kajishift-backend"
   npm run seed:e2e-local
   ```

4. Backend healthを確認する。

   ```powershell
   curl.exe http://localhost:3000/api/health
   ```

5. ブラウザでログイン画面を開けることを確認する。

   ```text
   http://localhost:5500/customer/login
   ```

## 使用アカウント

Customer:

- Email: `e2e-customer@example.com`
- Password: `KajiShiftE2E!2026`

Worker:

- Available Worker: `e2e-worker-available@example.com`
- Busy Worker: `e2e-worker-busy@example.com`

## 推奨予約条件

直近のAPI E2Eでは、既存予約との衝突を避けるため次の条件を使用しています。

- 日付: `2026-06-18`
- 時刻: `10:00`
- 利用時間: `2`
- 住所: `札幌市中央区南1条西1丁目1-1`
- サービス種別: `掃除`

`npm run seed:e2e-local` は既存データを削除しないため、同じ日時にE2E予約が残っている場合、翌日以降の平日 `10:00` に確認枠をずらします。seed実行時に表示される `bookingInput.date` / `bookingInput.startTime` / `bookingInput.duration` を優先して入力してください。

## 手動確認手順

1. ブラウザで `http://localhost:5500/customer/login` を開く。
2. `e2e-customer@example.com` / `KajiShiftE2E!2026` でログインする。
3. Customerダッシュボードに遷移することを確認する。
4. `http://localhost:5500/customer/booking` を開く、または画面の予約導線から予約作成画面へ進む。
5. 日付にseedが表示した `bookingInput.date` を入力する。
6. 開始時間に `10:00` を選択する。
7. 利用時間に `2時間` を選択する。
8. 依頼内容で `掃除` を選択する。
9. 市区町村で `札幌市` を選択する。
10. 詳細住所に `札幌市中央区南1条西1丁目1-1` を入力する。
11. 任意入力欄には、必要に応じて `E2E manual check` など確認用の文言を入力する。
12. 予約を作成する。
13. `customer/select-worker.html?id=<bookingId>` に遷移することを確認する。
14. ワーカー候補一覧に `E2E 対応可能ワーカー` が表示されることを確認する。
15. ワーカー候補一覧に `E2E 予約重複ワーカー` が表示されないことを確認する。
16. `E2E 対応可能ワーカー` を選択する。
17. 予約確定を実行する。
18. 予約詳細画面への遷移、または画面上の成功表示が既存フローどおり動くことを確認する。

## DevToolsでの追加確認

可能であれば、ブラウザのDevToolsで次も確認します。

- ApplicationタブまたはConsoleで `localStorage.token` が保存されている。
- ApplicationタブまたはConsoleで `localStorage.user` が保存されている。
- Networkタブで `GET /api/bookings/:id/available-workers` が呼ばれている。
- `GET /api/bookings/:id/available-workers` のレスポンスに `E2E 対応可能ワーカー` が含まれる。
- 同レスポンスに `E2E 予約重複ワーカー` が含まれない。
- ワーカー確定時の `PUT /api/bookings/:id` が成功する。

Consoleで確認する場合:

```javascript
localStorage.getItem('token')
JSON.parse(localStorage.getItem('user'))
```

## 期待結果

- Customerでログインできる。
- 予約作成できる。
- `customer/select-worker.html?id=<bookingId>` に遷移する。
- Available Workerが候補表示される。
- Busy Workerが候補表示されない。
- Available Workerで予約確定できる。
- 予約ステータスが `CONFIRMED` になる。
- 通常操作で `409` などのエラーが表示されない。

## 現時点のステータス

| 項目 | 状態 | メモ |
|------|------|------|
| API E2E | 確認済み | 予約作成、候補取得、Available Workerでの予約確定まで確認済み |
| 実ブラウザ手動E2E | 確認済み | 人間によるローカルブラウザ操作で、Available Worker表示、Busy Worker非表示、予約確定アラート表示を確認 |
| Playwright等の自動UI E2E | 未導入 | 今回は依存追加せず、手動確認手順のみ整備 |

## 手動ブラウザ確認結果

実施後に以下を更新してください。

| 項目 | 記録 |
|------|------|
| 実施日 | 2026-06-15 |
| 確認者 | ユーザー（ローカルブラウザ手動確認） |
| Backend URL | `http://localhost:3000/api` |
| Frontend URL | `http://localhost:5500` |
| ブラウザ | Google Chrome |
| 使用したseed | `npm run seed:e2e-local` |
| 使用アカウント | `e2e-customer@example.com` |
| 日付 | 2026-06-19 |
| 時刻 | 10:00 |
| 利用時間 | 2 |
| 住所 | `札幌市中央区南1条西1丁目1-1` |
| 作成されたbookingId | `6679f5c8-ba82-4338-9bd9-982bc04ed946` |
| 結果 | OK |
| メモ | `select-worker?id=<bookingId>` でワーカー選択画面が表示され、`E2E 対応可能ワーカー` が候補に表示、`E2E 予約重複ワーカー` は非表示。Available Worker選択後、`予約が確定しました！` のアラート表示を確認。予約詳細画面で `予約確定` 表示、DevToolsで `localStorage.token` / `localStorage.user`、`available-workers` 呼び出し、APIレスポンスの `status: "CONFIRMED"` をスクリーンショットで確認。 |

## clean URL代表導線クリック確認結果

| 項目 | 記録 |
|------|------|
| 実施日 | 2026-06-15 |
| 確認者 | ユーザー（ローカルブラウザ手動確認） |
| Backend URL | `http://localhost:3000/api` |
| Frontend URL | `http://localhost:5500` |
| ブラウザ | Google Chrome |
| 使用した主なbookingId | `6679f5c8-ba82-4338-9bd9-982bc04ed948`, `d27303a7-6aa5-49f4-b70a-22c7fd6596c5`, `55defe4d-adc4-4c7a-aebd-5c99ac37600b`, `56fcba96-deb4-4681-9b13-c19536c48b0f` |
| 確認結果 | OK（一部補足確認あり） |
| NG詳細 | clean URLのクエリ欠落によるNGはなし |
| 未確認項目 | `admin/support?id=...` の実クリック確認、`admin/worker-test-submissions?status=...` のURL欄でのstatusクエリ保持は未確認 |

| 確認対象 | URL形式 | 結果 | メモ |
|----------|----------|------|------|
| customer 予約一覧 → 予約詳細 | `booking-detail?id=<bookingId>` | OK | `customer/bookings` から予約詳細に遷移し、予約情報とAPIレスポンスが表示された。`?id=` は維持された。 |
| customer 予約詳細 → 予約変更 | `booking?id=<bookingId>` | OK | 予約詳細から予約変更画面へ遷移し、既存予約情報が読み込まれた。 |
| customer 予約詳細 → ワーカー選択 | `select-worker?id=<bookingId>` | OK | 未確定予約でワーカー選択画面へ遷移し、予約ID不足エラーは出なかった。 |
| customer 通知 → 予約詳細 | `booking-detail?id=<bookingId>` | OK | `customer/notifications` の予約関連通知から予約詳細に遷移し、予約情報とAPIレスポンスが表示された。 |
| customer チャット導線 | `chat?bookingId=<bookingId>` | OK | URL欄への直接入力で同じチャット画面が表示され、メッセージ取得が確認できた。通常導線の `chat?booking=<bookingId>` も表示確認済み。 |
| worker 通知 → 仕事詳細 | `job-detail?id=<bookingId>` | OK | `worker/notifications` の「仕事詳細を見る」から仕事詳細に遷移し、`?id=` は維持された。 |
| worker 仕事一覧 → 仕事詳細 | `job-detail?id=<bookingId>` | OK | `worker/jobs` から仕事詳細へ遷移した。別予約では権限により `403 Forbidden` が表示されたが、URLのクエリ欠落ではない。 |
| admin ダッシュボード → ワーカー管理 | `workers?status=pending` | OK | `admin/dashboard` からワーカー管理へ遷移し、`?status=pending` は維持された。 |
| admin ダッシュボード → ワーカーテスト審査 | `worker-test-submissions?status=needs_review,ai_reviewed,test_submitted` | OK（補足あり） | ワーカーテスト審査画面の表示と関連API取得は確認済み。URL欄ではstatusクエリなしの表示だったため、statusクエリ保持の厳密確認は未確認。 |
| admin 予約詳細 | `booking-detail?id=<bookingId>` | OK | `admin/booking-detail?id=<bookingId>` で予約詳細が表示され、`?id=` は維持された。 |
| admin サポート詳細 | `support?id=<id>` | 未確認 | 直接URLのHTTP 200は確認済みだが、実ブラウザのクリック確認は未実施。 |

## 手動確認チェックリスト

- [x] Backendを現行コードで起動し直した
- [x] `npm run seed:e2e-local` を実行した
- [x] `http://localhost:3000/api/health` が正常
- [x] `http://localhost:5500/customer/login` が表示される
- [x] Customerでログインできる
- [x] `localStorage.token` が保存される
- [x] `localStorage.user` が保存される
- [x] 予約作成画面へ遷移できる
- [x] 推奨条件で予約作成できる
- [x] `customer/select-worker?id=<bookingId>` へ遷移する
- [x] `GET /api/bookings/:id/available-workers` が呼ばれる
- [x] Available Workerが候補に表示される
- [x] Busy Workerが候補に表示されない
- [x] Available Workerを選択できる
- [x] 予約確定できる
- [x] 確定後ステータスが `CONFIRMED` になる
- [x] 画面上の完了表示または遷移が既存フローどおり動く
- [x] `409` などの予期しないエラーが出ない

## NG時の記録欄

NGが発生した場合は、以下を埋めてください。

| 項目 | 記録 |
|------|------|
| 発生画面 | 未記入 |
| 発生操作 | 未記入 |
| エラーメッセージ | 未記入 |
| Networkの失敗API | 未記入 |
| HTTPステータス | 未記入 |
| 再現条件 | 未記入 |
| スクリーンショット保存先またはメモ | 未記入 |
| 次の対応案 | 未記入 |

## 既知の注意点

- Cursor環境では実ブラウザのクリック・入力操作ツールが使えないため、自動UI操作は未実施。実画面操作はユーザーのローカルブラウザ手動確認で実施済み。
- API E2Eでは、予約作成、候補取得、Available Workerでの予約確定まで確認済み。
- 既存予約が残っている場合、同じ日時ではAvailable Workerも候補から外れる可能性がある。
- Available Workerが出ない場合は、`npm run seed:e2e-local` を再実行し、seedが表示した翌日以降の平日 `10:00` の条件で確認する。
- `prisma/seed.js` / `npm run seed` は全削除型seedのため、この手順では実行しない。
- `npm run seed:e2e-local` は非破壊用で、E2E専用メールアドレスを `upsert` する。

## トラブルシュート

### ログインが401になる

- 古いBackendプロセスを停止し、現行コードで `npm run dev` を起動し直す。
- `npm run seed:e2e-local` を再実行する。
- APIでログインできるか確認する。

```powershell
$body = @{ email = 'e2e-customer@example.com'; password = 'KajiShiftE2E!2026' } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method Post -ContentType 'application/json' -Body $body
```

### Available Workerが出ない

- 入力した予約日時がseed出力の `bookingInput` と一致しているか確認する。
- 同じ日時に既存予約が残っていないか確認する。
- `npm run seed:e2e-local` を再実行し、seedが表示した翌日以降の平日 `10:00` にずらす。
- Networkタブで `GET /api/bookings/:id/available-workers` のレスポンスを確認する。

### Busy Workerが出てしまう

- `npm run seed:e2e-local` を再実行する。
- seed実行結果に `busyBookingId` が表示されていることを確認する。
- Networkタブで `GET /api/bookings/:id/available-workers` のレスポンスに `e2e-worker-busy@example.com` または `E2E 予約重複ワーカー` が含まれていないか確認する。

### APIが失敗する

- `http://localhost:3000/api/health` が `OK` を返すか確認する。
- Frontendが `http://localhost:5500` から配信されているか確認する。
- DevTools Consoleで `window.API_BASE_URL` またはAPIクライアントの接続先が `http://localhost:3000/api` になっているか確認する。
- `localStorage.token` が保存されているか確認する。
- Networkタブで失敗しているAPIのステータスコードとレスポンス本文を確認する。

## 直近のAPI E2E実績

参考として、直近のAPI E2Eでは以下を確認済みです。

- Booking ID: `cabe914a-65e4-445a-bc05-868e2761e39f`
- 予約条件: `2026-06-18 10:00`
- 利用時間: `2`
- 住所: `札幌市中央区南1条西1丁目1-1`
- Available Workerは候補に含まれた。
- Busy Workerは候補に含まれなかった。
- Available Workerで予約確定成功。
- 確定後ステータス: `CONFIRMED`

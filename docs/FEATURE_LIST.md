# KAJISHIFT 機能一覧

本ドキュメントは **本リポジトリ（kajishift-backend）** のルーティング・コントローラ・サービス・Prisma スキーマを解析して整理した機能一覧である。フロントエンドの画面名・URL は **このリポジトリにソースが含まれないため、API 名から想起した推測**を `推測` と明記している。

**凡例（リリース対象か）**

| 値 | 意味 |
|----|------|
| はい | 本番で利用想定の機能 |
| 要検討 | 運用ポリシー次第（デバッグ・診断系など） |
| はい（注意） | 本番利用可だが設定・秘匿に注意 |

---

| 大分類 | 中分類 | 機能名 | 機能概要 | 対象ユーザー | 関連画面 | 関連API | 関連ファイル | リリース対象か | 備考 |
|--------|--------|--------|----------|--------------|----------|---------|--------------|----------------|------|
| インフラ・共通 | ヘルス・診断 | API 生存確認 | サーバ稼働と時刻を返す | 運用・監視 | なし（監視ツール想定） | `GET /api/health` | `src/index.js` | はい | |
| インフラ・共通 | ヘルス・診断 | DB 診断 | DB 接続・テーブル一覧・マイグレーション・ユーザー数等を返す | 運用（**高権限情報に近い**） | なし | `GET /api/health/db` | `src/index.js` | 要検討 | 本番では認証なしのため露出リスクあり。**推測**: 本番無効化または認証付きにする運用が望ましい。 |
| インフラ・共通 | ドキュメント | Swagger UI | OpenAPI ドキュメントのブラウザ表示 | 開発者・社内 | なし | `GET /api-docs` | `src/index.js`, `src/config/swagger.js` | 要検討 | 本番公開はポリシー次第。 |
| インフラ・共通 | 静的配信 | アップロードファイル配信 | `uploads` 配下を静的配信 | 全ロール（URL を知る者） | プロフィール画像表示等（**推測**） | `GET /uploads/*` | `src/index.js` | はい（注意） | 実ファイルのパス設計と権限の整合に注意。 |
| インフラ・共通 | リアルタイム | Socket.io 接続 | JWT 認証後、ユーザー別ルームに参加し通知・未読数・メッセージをプッシュ | 依頼者・ワーカー・管理者（ログイン済） | 通知ベル・チャット（**推測**） | Socket.io（HTTP サーバ同一） | `src/config/socket.js`, `src/index.js` | はい | イベント例: `connected`, `notification`, `unread-count`, `message`。 |
| 認証・アカウント | 登録・ログイン | ユーザー登録 | メール・パスワード・名前・ロール等で登録。ワーカーは本人確認書類を multipart で受け付け可能 | 未登録（CUSTOMER / WORKER / ADMIN 指定） | 新規登録（**推測**） | `POST /api/auth/register` | `src/routes/auth.js`, `src/controllers/authController.js`, `src/services/authService.js` | はい | `uploadSingle('idDocument')` 利用。 |
| 認証・アカウント | 登録・ログイン | ログイン | メール・パスワードで JWT 発行 | 全ロール | ログイン（**推測**） | `POST /api/auth/login` | 同上 | はい | `authLimiter` 適用。 |
| 認証・アカウント | セッション | 現在ユーザー（認証） | トークンからユーザー情報取得 | ログイン済み全ロール | マイページヘッダー等（**推測**） | `GET /api/auth/me` | 同上 | はい | |
| 認証・アカウント | パスワード | パスワード忘れ | リセット用メール送信トリガー | 全ロール | パスワード再設定申請（**推測**） | `POST /api/auth/forgot-password` | 同上, `src/services/emailService.js` | はい | `passwordResetLimiter`。 |
| 認証・アカウント | パスワード | パスワード再設定 | トークン＋新パスワードで更新 | 全ロール | パスワード再設定フォーム（**推測**） | `POST /api/auth/reset-password` | 同上, `prisma/schema.prisma`（PasswordResetToken） | はい | |
| ユーザー・プロフィール | マイアカウント | 自分の情報取得 | ログインユーザーのプロフィール取得 | ログイン済み全ロール | マイページ（**推測**） | `GET /api/users/me` | `src/routes/users.js`, `src/controllers/userController.js`, `src/services/userService.js` | はい | `GET /api/auth/me` と役割が近い。**推測**: フロントはどちらかに統一。 |
| ユーザー・プロフィール | マイアカウント | 自分の情報更新 | 名前・電話・住所等の更新 | ログイン済み全ロール | プロフィール編集（**推測**） | `PUT /api/users/me` | 同上 | はい | |
| ユーザー・プロフィール | マイアカウント | パスワード変更 | 現在パスワード確認のうえ変更 | ログイン済み全ロール | アカウント設定（**推測**） | `PUT /api/users/me/password` | 同上 | はい | |
| ユーザー・プロフィール | 参照 | ユーザー詳細（ID） | UUID 指定でユーザー情報取得 | ログイン済み全ロール | ユーザー詳細モーダル等（**推測**） | `GET /api/users/:id` | 同上 | はい | 権限はサービス層で制御。 |
| 予約 | CRUD | 予約一覧・検索 | ステータス・日付・サービス種別・ページネーション。ワーカー向け `available` 等 | 依頼者・ワーカー・管理者 | 予約一覧・ワーカー案件ボード（**推測**） | `GET /api/bookings` | `src/routes/bookings.js`, `src/controllers/bookingController.js`, `src/services/bookingService.js` | はい | クエリ詳細は `docs/FRONTEND_INTEGRATION.md`。 |
| 予約 | CRUD | 予約作成 | サービス種別・日時・住所等で新規予約 | 依頼者 | 予約フォーム（**推測**） | `POST /api/bookings` | 同上 | はい | 顧客のみ。 |
| 予約 | CRUD | 予約詳細 | 単体取得 | 依頼者・ワーカー・管理者 | 予約詳細（**推測**） | `GET /api/bookings/:id` | 同上 | はい | |
| 予約 | CRUD | 予約更新 | 日時・メモ・ステータス等の更新 | 依頼者・ワーカー・管理者 | 予約編集（**推測**） | `PUT /api/bookings/:id` | 同上 | はい | ロール別ルールはサービス層。 |
| 予約 | CRUD | 予約キャンセル | 予約のキャンセル処理 | 依頼者・ワーカー・管理者 | 予約詳細（**推測**） | `DELETE /api/bookings/:id` | 同上 | はい | |
| 予約 | ワークフロー | 予約承諾 | ワーカーが案件を承諾 | ワーカー | 案件詳細（**推測**） | `POST /api/bookings/:id/accept` | 同上 | はい | |
| 予約 | ワークフロー | 予約拒否 | ワーカーが拒否（理由オプション） | ワーカー | 案件詳細（**推測**） | `POST /api/bookings/:id/reject` | 同上 | はい | |
| 予約 | ワークフロー | 作業完了 | ステータス COMPLETED・`completedAt` 設定 | ワーカー | 作業完了ボタン（**推測**） | `POST /api/bookings/:id/complete` | 同上 | はい | 通知生成あり。 |
| ワーカー | 検索 | ワーカー一覧 | キーワード・エリア・時給・評価・承認状態で検索（公開） | 未ログイン・依頼者 | ワーカー検索（**推測**） | `GET /api/workers` | `src/routes/workers.js`, `src/controllers/workerController.js`, `src/services/workerService.js` | はい | 認証不要。 |
| ワーカー | 検索 | ワーカー詳細 | 公開プロフィール取得 | 未ログイン・依頼者 | ワーカー詳細（**推測**） | `GET /api/workers/:id` | 同上 | はい | |
| ワーカー | プロフィール | ワーカー本人プロフィール更新 | bio・hourlyRate 等 | ワーカー | ワーカー設定（**推測**） | `PUT /api/workers/me` | 同上 | はい | `authenticate` 必須。 |
| ワーカー | スケジュール | 利用不可スロット一覧 | 期間指定で一覧 | ワーカー | カレンダー／シフト（**推測**） | `GET /api/workers/me/unavailable-slots` | `src/routes/workerUnavailableSlots.js`, `src/controllers/workerUnavailableSlotController.js`, `src/services/workerUnavailableSlotService.js`, `src/index.js`（マウント） | はい | `authorize('WORKER')`。仕様: `docs/WORKER_UNAVAILABLE_SLOTS_API.md`。 |
| ワーカー | スケジュール | 利用不可スロット追加 | 単一または一括 | ワーカー | 同上 | `POST /api/workers/me/unavailable-slots` | 同上 | はい | |
| ワーカー | スケジュール | 利用不可スロット同期 | 期間内を全削除のうえ置換 | ワーカー | 同上 | `PUT /api/workers/me/unavailable-slots/sync` | 同上 | はい | |
| ワーカー | スケジュール | 利用不可スロット削除 | クエリまたは UUID で削除 | ワーカー | 同上 | `DELETE /api/workers/me/unavailable-slots`, `DELETE /api/workers/me/unavailable-slots/:id` | 同上 | はい | |
| レビュー | 評価 | レビュー投稿 | 完了予約に対する星・コメント | 依頼者 | レビュー投稿（**推測**） | `POST /api/reviews` | `src/routes/reviews.js`, `src/controllers/reviewController.js`, `src/services/reviewService.js` | はい | |
| レビュー | 評価 | ワーカー別レビュー一覧 | 公開一覧 | 未ログイン・全ロール | ワーカー詳細内レビュー（**推測**） | `GET /api/reviews/:workerId` | 同上 | はい | 認証不要。 |
| メッセージ | チャット | メッセージ一覧 | 予約単位のページネーション | 依頼者・ワーカー（当事者） | 予約チャット（**推測**） | `GET /api/messages/:bookingId` | `src/routes/messages.js`, `src/controllers/messageController.js`, `src/services/messageService.js` | はい | |
| メッセージ | チャット | メッセージ送信 | 予約に紐づくメッセージ作成・Socket 通知 | 依頼者・ワーカー | 同上 | `POST /api/messages` | 同上, `src/config/socket.js` | はい | `sendMessage` でリアルタイム配信。 |
| 決済 | 決済処理 | 決済実行 | bookingId・方法で決済レコード作成／更新し COMPLETED 等 | 依頼者 | 決済画面（**推測**） | `POST /api/payments` | `src/routes/payments.js`, `src/controllers/paymentController.js`, `src/services/paymentService.js` | はい | `credit_card` / `bank_transfer` / `cash`。実 PG 連携は**推測**: アプリ内は記録中心の可能性。 |
| 決済 | 履歴 | 決済履歴一覧 | ステータス・ページネーション | 依頼者（主） | 支払い履歴（**推測**） | `GET /api/payments` | 同上 | はい | |
| 決済 | 領収書 | 領収書 PDF | PDFKit＋Noto Sans JP で PDF 生成 | 依頼者（支払本人） | 領収書ダウンロード（**推測**） | `GET /api/payments/:id/receipt` | `src/services/receiptService.js`, 上記 controller | はい | `Payment.status === COMPLETED` のみ。 |
| カード | 保存済み決済手段 | カード一覧 | 登録カード一覧 | 依頼者 | 支払い方法管理（**推測**） | `GET /api/cards` | `src/routes/cards.js`, `src/controllers/cardController.js`, `src/services/cardService.js` | はい | スキーマ: `CreditCard`。 |
| カード | 保存済み決済手段 | カード追加 | 番号・有効期限等（CVV は保存しない旨スキーマ） | 依頼者 | 同上 | `POST /api/cards` | 同上 | はい（注意） | **本番 PCI DSS**: トークン化 PG 利用が一般的。**推測**: 開発用の直保存実装の可能性—コードレビュー推奨。 |
| カード | 保存済み決済手段 | カード更新・削除 | 期限・名義・デフォルト変更／削除 | 依頼者 | 同上 | `PUT /api/cards/:id`, `DELETE /api/cards/:id` | 同上 | はい（注意） | 同上。 |
| サポート | チケット | 問い合わせ一覧 | 自分のチケット一覧 | 依頼者・ワーカー・管理者 | サポート一覧（**推測**） | `GET /api/support` | `src/routes/support.js`, `src/controllers/supportController.js`, `src/services/supportService.js` | はい | |
| サポート | チケット | 問い合わせ作成 | 件名・本文 | 同上 | 問い合わせフォーム（**推測**） | `POST /api/support` | 同上 | はい | |
| サポート | チケット | 問い合わせ詳細 | 単体取得 | 同上 | チケット詳細（**推測**） | `GET /api/support/:id` | 同上 | はい | |
| 通知 | アプリ内通知 | 通知一覧・未読数 | フィルタ・ページネーション／未読件数 | ログイン済み全ロール | 通知一覧・バッジ（**推測**） | `GET /api/notifications`, `GET /api/notifications/unread-count` | `src/routes/notifications.js`, `src/controllers/notificationController.js`, `src/services/notificationService.js` | はい | |
| 通知 | アプリ内通知 | 既読化・削除 | 個別／一括既読／削除 | ログイン済み全ロール | 同上 | `PUT /api/notifications/read-all`, `PUT /api/notifications/:id/read`, `DELETE /api/notifications/:id` | 同上 | はい | |
| ファイル | アップロード | ファイルアップロード | PROFILE_IMAGE / ID_DOCUMENT / GENERAL | ログイン済み全ロール | 登録・プロフィール（**推測**） | `POST /api/upload` | `src/routes/upload.js`, `src/controllers/uploadController.js`, `src/services/uploadService.js`, `src/middleware/upload.js` | はい | |
| ファイル | アップロード | ファイル一覧・メタ取得 | 自分のファイル | ログイン済み全ロール | マイファイル（**推測**） | `GET /api/upload`, `GET /api/upload/:id` | 同上 | はい | |
| ファイル | アップロード | ダウンロード・削除 | ストリーム配信／削除 | ログイン済み全ロール | 同上 | `GET /api/upload/:id/download`, `DELETE /api/upload/:id` | 同上 | はい | |
| お気に入り | ワーカー保存 | お気に入り CRUD・確認 | ワーカーをお気に入り登録／一覧／削除／存在確認 | 依頼者 | ワーカー詳細の星アイコン等（**推測**） | `GET /api/favorites`, `POST /api/favorites`, `DELETE /api/favorites/:id`, `DELETE /api/favorites/worker/:workerId`, `GET /api/favorites/check/:workerId` | `src/routes/favorites.js`, `src/controllers/favoriteController.js`, `src/services/favoriteService.js` | はい | モデル: `Favorite`。 |
| 管理者 | ユーザー管理 | ユーザー一覧・更新・削除 | ロール・ステータスフィルタ | 管理者 | 管理画面ユーザー（**推測**） | `GET /api/admin/users`, `PUT /api/admin/users/:id`, `DELETE /api/admin/users/:id` | `src/routes/admin.js`, `src/controllers/adminController.js`, `src/services/adminService.js` | はい | `authorize('ADMIN')`。 |
| 管理者 | ユーザー管理 | 管理者アカウント新規登録 | 既存管理者が新管理者を作成 | 管理者 | 管理者招待（**推測**） | `POST /api/admin/register` | 同上 | はい（注意） | 強いオペレーション。監査ログの有無は**推測**。 |
| 管理者 | ワーカー管理 | ワーカー一覧・詳細・更新・削除 | 審査状態・稼働管理 | 管理者 | 管理画面ワーカー（**推測**） | `GET /api/admin/workers`, `GET /api/admin/workers/:id`, `PUT /api/admin/workers/:id`, `DELETE /api/admin/workers/:id` | 同上 | はい | |
| 管理者 | ワーカー管理 | ワーカー承認／却下 | approvalStatus 更新 | 管理者 | 審査キュー（**推測**） | `PUT /api/admin/workers/:id/approve` | 同上 | はい | |
| 管理者 | レポート | 集計レポート（JSON） | 予約／売上／ユーザー／ワーカー統計 | 管理者 | ダッシュボード（**推測**） | `GET /api/admin/reports/bookings`, `/revenue`, `/users`, `/workers` | `src/services/adminService.js`, `src/controllers/adminController.js` | はい | CSV/Excel は `exportService.js`。 |
| 管理者 | レポート | レポート CSV／Excel エクスポート | 各レポートのファイルダウンロード | 管理者 | レポート画面（**推測**） | `GET /api/admin/reports/*/export/csv`, `.../export/excel` | `src/controllers/adminController.js`, `src/services/exportService.js` | はい | bookings, revenue, users, workers の4系統。 |
| 管理者 | レポート | チャート・比較・カスタムレポート | グラフ用データ・前期比・複合条件 | 管理者 | 分析画面（**推測**） | `GET /api/admin/reports/chart/:reportType`, `GET /api/admin/reports/comparison/:reportType`, `POST /api/admin/reports/custom` | 同上 | はい | |
| 管理者 | 通知 | システム通知一斉送信 | ロール／ユーザー指定・メールオプション | 管理者 | お知らせ配信（**推測**） | `POST /api/admin/notifications/system` | 同上, `src/services/notificationService.js`, `emailService.js` | はい | |
| 管理者 | サポート | チケット更新・削除 | ステータス・管理者回答・削除 | 管理者 | 管理サポート（**推測**） | `PUT /api/admin/support/:id`, `DELETE /api/admin/support/:id` | `src/routes/admin.js`, `src/controllers/supportController.js` | はい | 一般 `PUT /api/support` は無し—管理者経路のみ更新の設計。 |
| 管理者 | マスタ | システム設定 | キー・バリュー形式の設定取得／更新 | 管理者 | システム設定（**推測**） | `GET /api/admin/settings`, `PUT /api/admin/settings` | `src/controllers/adminController.js`, `prisma`（SystemSettings） | はい | |
| 管理者 | マスタ | サービスメニュー CRUD | 掲載メニュー管理 | 管理者 | メニュー管理（**推測**） | `GET/POST /api/admin/services`, `PUT/DELETE /api/admin/services/:id` | 同上, `ServiceMenu` | はい | 予約の `serviceType` 文字列との連動は**推測**。 |
| 管理者 | マスタ | 対応エリア CRUD | エリアマスタ管理 | 管理者 | エリア管理（**推測**） | `GET/POST /api/admin/areas`, `PUT/DELETE /api/admin/areas/:id` | 同上, `Area` | はい | |
| 管理者 | デバッグ | ユーザー統計デバッグ | ユーザー一覧抜粋と集計 | 管理者 | デバッグコンソール（**推測**） | `GET /api/admin/debug/users` | `src/routes/admin.js`（インライン） | 要検討 | 本番では無効化または IP 制限を**推奨**。 |
| セキュリティ・ミドルウェア | 横断 | 認証・ロール制限 | JWT 検証・`authorize(role)` | 全 API | — | （各ルート） | `src/middleware/auth.js`, `src/middleware/security.js` | はい | Helmet・レート制限・`src/config/env.js`。 |

---

## 補足

- **フロント専用ファイル**（HTML/JS の画面名・ルーティング）は本リポジトリに含まれないため、「関連画面」はすべて API からの **推測** である。
- **Prisma モデル**（`prisma/schema.prisma`）: `User`, `Booking`, `Payment`, `Review`, `Message`, `SupportTicket`, `Notification`, `File`, `PasswordResetToken`, `Favorite`, `WorkerUnavailableSlot`, `ServiceMenu`, `Area`, `SystemSettings`, `CreditCard` が本一覧の主要ドメインと対応する。
- **メール**（パスワードリセット・通知・システム通知）: `src/services/emailService.js` を経由する想定だが、SMTP 未設定時の挙動は環境依存のため **推測で記載しない**（実装を参照）。

---

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-05-08 | 初版。ルート・ソケット・スキーマに基づき一覧化。 |

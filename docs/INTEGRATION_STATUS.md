# フロントエンド・バックエンド連携状況

最終更新日: 2026年3月（最新）

## 📋 更新履歴

- **2026年3月26日**: 接続設定・環境変数の最終調整
  - ✅ バックエンドCORS設定を本番運用向けに簡素化（`CORS_ORIGIN`優先）
  - ✅ Prisma seed設定を `package.json` に追加
  - ✅ Railway外部接続用 `DATABASE_URL` の利用手順をドキュメントへ反映

- **2026年3月**: フロントエンドのVercel移行完了
  - ✅ NetlifyからVercelへ移行（クレジット問題回避）
  - ✅ GitHubとVercelの連携設定完了（CI/CD構築）
  - ✅ 静的HTMLサイトとしてデプロイ成功
  - ✅ 3ロールログイン画面確認済み（依頼者・ワーカー・管理者）
  - ✅ 法務ページ公開完了（利用規約・プライバシーポリシー・特定商取引法）
  - ✅ 本番URL確立: `https://kajishift-frontend.vercel.app`
  - ⚠️ **重要**: Railwayの環境変数`CORS_ORIGIN`を`https://kajishift-frontend.vercel.app`に更新する必要があります

- **2026年3月23日**: バックエンドのRailway移行対応
  - ✅ バックエンド本番URLをRenderからRailwayへ移行
  - ✅ フロントエンド接続先APIを`https://kajishift-backend-production.up.railway.app/api`に更新
  - ✅ WebSocket接続先を`https://kajishift-backend-production.up.railway.app`に更新

- **2026年3月2日**: トップページUI改善
  - ✅ 「ご利用の流れ」ボタンのスタイル改善（`index.html`、`css/style.css`）
    - ボタンサイズを拡大（パディング: `16px 32px`、フォントサイズ: `var(--font-size-lg)`）
    - 中央配置を確実にするため`justify-content: center`と`margin: 0 auto`を追加
    - 矢印アイコンのサイズを`1em`（テキストと同じサイズ）に調整
  - ✅ 特徴カードのアイコンを画像に変更（`index.html`、`css/style.css`）
    - お金のアイコン（💰）→ `object_gamaguchi.png`
    - カレンダーのアイコン（📅）→ `business_karenda.png`
    - 盾のアイコン（🛡️）→ `business_tate.png`
    - アイコンサイズを`3.5rem`（56px）に設定し、中央配置を実装

- **2026年2月27日**: チャットページメニュー機能追加、ユーザーテスト仕様書作成
  - ✅ チャットページにメニューボタンとドロップダウンメニューを追加（`customer/chat.html`）
  - ✅ ワーカープロフィールモーダルを追加（チャットページから直接アクセス可能）
  - ✅ チャットメニューのスタイルを追加（`css/style.css`）
  - ✅ 管理者・依頼者・ワーカーのユーザーテスト仕様書を作成
    - `docs/TEST_SPEC_ADMIN.md`: 管理者テスト仕様書（38項目）
    - `docs/TEST_SPEC_CUSTOMER.md`: 依頼者テスト仕様書（35項目）
    - `docs/TEST_SPEC_WORKER.md`: ワーカーテスト仕様書（30項目）
    - `docs/TEST_SPEC_OVERVIEW.md`: テスト仕様書概要
  - ✅ 各テスト仕様書にテスト用アカウント情報とテスト実行フローを追記

- **2026年2月25日**: 未連携APIエンドポイントのフロントエンド連携完了
  - ✅ 予約完了API連携（`/api/bookings/:id/complete`）
  - ✅ サポートAPI連携（作成・詳細取得）
  - ✅ レビューAPI連携（投稿・一覧取得）
  - ✅ お気に入りAPI連携（5つのエンドポイント）
  - ✅ ファイルアップロードAPI連携（5つのエンドポイント）
  - ✅ システム設定API連携（GET/PUT）
  - ✅ ExcelエクスポートAPI連携（4つのエンドポイント）
  - ✅ `api.js`に不足していたメソッドを追加（`completeBooking`, `acceptBooking`, `rejectBooking`, `downloadExcel`）
  - ✅ `worker/job-detail.html`と`worker/jobs.html`に作業完了機能と正しいAPI呼び出しを実装

- **2026年2月25日**: フロントエンドUI改善
  - ✅ ヘッダー: 「依頼者ログイン」「ワーカーログイン」に変更（`index.html`）
  - ✅ フッター: 「管理者」リンクを追加（`index.html`）
  - ✅ ロゴ: マークをKAJISHIFTテキストの中央上部に配置、サイズを48pxに拡大（`css/style.css`）
  - ✅ ヒーローセクションのサブタイトルを白文字に変更（テキストシャドウ付き）
  - ✅ ヘッダー・フッターリンクのスタイルを統一

- **2026年2月24日**: 管理者登録機能追加
  - ✅ 管理者登録API (`POST /api/admin/register`) 実装・連携完了
  - ✅ 管理者登録フォーム（`admin/users.html`）実装完了
  - ✅ セキュリティ強化（管理者ログインページから新規登録リンクを削除）

- **2026年2月18日**: フロントエンド連携完了
  - ✅ 管理者詳細ページ（ユーザー詳細、ワーカー詳細、予約詳細）実装
  - ✅ 問い合わせ詳細表示・チャット閲覧機能実装
  - ✅ ワーカープロフィール表示（顧客側）実装
  - ✅ チャット画像添付機能実装
  - ✅ ワーカー基本情報編集機能実装
  - ✅ 仕事辞退機能実装
  - ✅ 領収書ダウンロード機能修正
  - ✅ 設定管理（サービスメニュー・エリア編集）完成
  - ✅ カード管理機能完成
  - ✅ CSVエクスポート機能完成（予約・ユーザー・ワーカー・売上レポート）
  - ✅ 全APIエンドポイントのフロントエンド連携完了

## 📊 連携状況サマリー

- **連携済み・テスト完了**: 71項目（全APIエンドポイント実装完了・連携完了）✨ 2026年2月25日更新
- **連携していない・テスト未実行**: 0項目（バックエンド実装完了）
- **フロントエンド連携**: ✅ 完了（47ページ/機能実装完了）

---

## ✅ 連携済み・テスト完了

### 認証API

| エンドポイント | メソッド | 状態 | 備考 |
|--------------|---------|------|------|
| `/api/auth/register` | POST | ✅ 連携済み・テスト完了 | 顧客・ワーカー・管理者登録対応、ワーカー追加フィールド対応 |
| `/api/auth/login` | POST | ✅ 連携済み・テスト完了 | JWTトークン発行、全ロール対応 |
| `/api/auth/me` | GET | ✅ 連携済み・テスト完了 | 現在のユーザー情報取得 |

### ユーザーAPI

| エンドポイント | メソッド | 状態 | 備考 |
|--------------|---------|------|------|
| `/api/users/me` | GET | ✅ 連携済み・テスト完了 | ユーザー情報取得（ダッシュボードで使用） |
| `/api/users/me` | PUT | ✅ 連携済み・テスト完了 | ユーザー情報更新 |
| `/api/users/:id` | GET | ✅ 連携済み・テスト完了 | ユーザー詳細取得 |

### 予約API

| エンドポイント | メソッド | 状態 | 備考 |
|--------------|---------|------|------|
| `/api/bookings` | GET | ✅ 連携済み・テスト完了 | 予約一覧取得、複数ステータス対応、available フィルター対応 |
| `/api/bookings` | POST | ✅ 連携済み・テスト完了 | 予約作成 |
| `/api/bookings/:id` | GET | ✅ 連携済み・テスト完了 | 予約詳細取得 |
| `/api/bookings/:id` | PUT | ✅ 連携済み・テスト完了 | 予約更新（ワーカー選択含む） |
| `/api/bookings/:id` | DELETE | ✅ 連携済み・テスト完了 | 予約キャンセル |

### ワーカーAPI

| エンドポイント | メソッド | 状態 | 備考 |
|--------------|---------|------|------|
| `/api/workers` | GET | ✅ 連携済み・テスト完了 | ワーカー一覧取得（承認済みのみ） |
| `/api/workers/:id` | GET | ✅ 連携済み・テスト完了 | ワーカー詳細取得 |
| `/api/workers/me` | PUT | ✅ 連携済み・テスト完了 | ワーカープロフィール更新 |

### メッセージAPI

| エンドポイント | メソッド | 状態 | 備考 |
|--------------|---------|------|------|
| `/api/messages/:bookingId` | GET | ✅ 連携済み・テスト完了 | メッセージ一覧取得（ページネーション対応） |
| `/api/messages` | POST | ✅ 連携済み・テスト完了 | メッセージ送信 |

### 決済API

| エンドポイント | メソッド | 状態 | 備考 |
|--------------|---------|------|------|
| `/api/payments` | GET | ✅ 連携済み・テスト完了 | 決済履歴取得（ページネーション対応） |
| `/api/payments` | POST | ✅ 連携済み・テスト完了 | 決済処理 |

### 通知API

| エンドポイント | メソッド | 状態 | 備考 |
|--------------|---------|------|------|
| `/api/notifications/unread-count` | GET | ✅ 連携済み・テスト完了 | 未読通知数取得（ダッシュボードで使用） |
| `/api/notifications` | GET | ✅ 連携済み・テスト完了 | 通知一覧取得 |
| `/api/notifications/read-all` | PUT | ✅ 連携済み・テスト完了 | すべて既読にする |
| `/api/notifications/:id/read` | PUT | ✅ 連携済み・テスト完了 | 個別既読にする |

### 管理者API

| エンドポイント | メソッド | 状態 | 備考 |
|--------------|---------|------|------|
| `/api/admin/users` | GET | ✅ 連携済み・テスト完了 | ユーザー一覧取得（ページネーション対応） |
| `/api/admin/workers` | GET | ✅ 連携済み・テスト完了 | ワーカー一覧取得（ページネーション対応） |
| `/api/admin/workers/:id/approve` | PUT | ✅ 連携済み・テスト完了 | ワーカー承認/却下 |
| `/api/admin/reports/bookings` | GET | ✅ 連携済み・テスト完了 | 予約レポート取得 |
| `/api/admin/reports/revenue` | GET | ✅ 連携済み・テスト完了 | 売上レポート取得 |
| `/api/admin/reports/users` | GET | ✅ 連携済み・テスト完了 | ユーザー統計レポート取得 |
| `/api/admin/reports/workers` | GET | ✅ 連携済み・テスト完了 | ワーカー統計レポート取得 |
| `/api/admin/reports/bookings/export/csv` | GET | ✅ 実装済み | 予約レポートCSVエクスポート |
| `/api/admin/reports/bookings/export/excel` | GET | ✅ 実装済み・連携完了 | 予約レポートExcelエクスポート ✨ 2026年2月25日連携完了 |
| `/api/admin/reports/revenue/export/csv` | GET | ✅ 実装済み | 売上レポートCSVエクスポート |
| `/api/admin/reports/revenue/export/excel` | GET | ✅ 実装済み・連携完了 | 売上レポートExcelエクスポート ✨ 2026年2月25日連携完了 |
| `/api/admin/reports/users/export/csv` | GET | ✅ 実装済み | ユーザーレポートCSVエクスポート |
| `/api/admin/reports/users/export/excel` | GET | ✅ 実装済み・連携完了 | ユーザーレポートExcelエクスポート ✨ 2026年2月25日連携完了 |
| `/api/admin/reports/workers/export/csv` | GET | ✅ 実装済み | ワーカーレポートCSVエクスポート |
| `/api/admin/reports/workers/export/excel` | GET | ✅ 実装済み・連携完了 | ワーカーレポートExcelエクスポート ✨ 2026年2月25日連携完了 |
| `/api/admin/notifications/system` | POST | ✅ 実装済み | システム通知作成 |
| `/api/admin/reports/chart/:reportType` | GET | ✅ 実装済み | グラフ用データ取得 |
| `/api/admin/reports/comparison/:reportType` | GET | ✅ 実装済み | 比較レポート取得 |
| `/api/admin/reports/custom` | POST | ✅ 実装済み | カスタムレポート取得 |
| `/api/admin/register` | POST | ✅ 実装済み・連携完了 | 管理者を新規登録（既存管理者のみが実行可能）✨ 2026年2月24日追加 |

### サポートAPI

| エンドポイント | メソッド | 状態 | 備考 |
|--------------|---------|------|------|
| `/api/support` | GET | ✅ 連携済み・テスト完了 | サポートチケット一覧取得（ページネーション対応） |
| `/api/support` | POST | ✅ 実装済み・連携完了 | サポートチケット作成 ✨ 2026年2月25日連携完了 |
| `/api/support/:id` | GET | ✅ 実装済み・連携完了 | サポートチケット詳細取得 ✨ 2026年2月25日連携完了 |

### レビューAPI

| エンドポイント | メソッド | 状態 | 備考 |
|--------------|---------|------|------|
| `/api/reviews` | POST | ✅ 実装済み・連携完了 | レビュー投稿（認証必須、依頼者のみ） ✨ 2026年2月25日連携完了 |
| `/api/reviews/:workerId` | GET | ✅ 実装済み・連携完了 | ワーカーのレビュー一覧取得（公開、ページネーション対応） ✨ 2026年2月25日連携完了 |

### お気に入りAPI

| エンドポイント | メソッド | 状態 | 備考 |
|--------------|---------|------|------|
| `/api/favorites` | GET | ✅ 実装済み・連携完了 | お気に入り一覧取得 ✨ 2026年2月25日連携完了 |
| `/api/favorites` | POST | ✅ 実装済み・連携完了 | お気に入り追加 ✨ 2026年2月25日連携完了 |
| `/api/favorites/:id` | DELETE | ✅ 実装済み・連携完了 | お気に入り削除 ✨ 2026年2月25日連携完了 |
| `/api/favorites/worker/:workerId` | DELETE | ✅ 実装済み・連携完了 | ワーカーIDでお気に入り削除 ✨ 2026年2月25日連携完了 |
| `/api/favorites/check/:workerId` | GET | ✅ 実装済み・連携完了 | お気に入り状態確認 ✨ 2026年2月25日連携完了 |

### ファイルアップロードAPI

| エンドポイント | メソッド | 状態 | 備考 |
|--------------|---------|------|------|
| `/api/upload` | POST | ✅ 実装済み・連携完了 | ファイルアップロード ✨ 2026年2月25日連携完了 |
| `/api/upload` | GET | ✅ 実装済み・連携完了 | ファイル一覧取得 ✨ 2026年2月25日連携完了 |
| `/api/upload/:id` | GET | ✅ 実装済み・連携完了 | ファイル情報取得 ✨ 2026年2月25日連携完了 |
| `/api/upload/:id/download` | GET | ✅ 実装済み・連携完了 | ファイルダウンロード ✨ 2026年2月25日連携完了 |
| `/api/upload/:id` | DELETE | ✅ 実装済み・連携完了 | ファイル削除 ✨ 2026年2月25日連携完了 |

---

## ✅ 追加実装済みAPI（フロントエンド連携完了）

### 予約API（追加機能）

| エンドポイント | メソッド | 状態 | 備考 |
|--------------|---------|------|------|
| `/api/bookings/:id/accept` | POST | ✅ 実装済み・連携完了 | 予約承諾（ワーカーのみ） |
| `/api/bookings/:id/reject` | POST | ✅ 実装済み・連携完了 | 予約拒否（ワーカーのみ、拒否理由オプション） |
| `/api/bookings/:id/complete` | POST | ✅ 実装済み・連携完了 | 作業完了（ワーカーのみ） ✨ 2026年2月25日連携完了 |

### 管理者API（追加機能）

| エンドポイント | メソッド | 状態 | 備考 |
|--------------|---------|------|------|
| `/api/admin/users/:id` | PUT | ✅ 実装済み・連携完了 | ユーザー情報更新（ステータス変更含む） |
| `/api/admin/users/:id` | DELETE | ✅ 実装済み・連携完了 | ユーザー削除 |
| `/api/admin/workers/:id` | PUT | ✅ 実装済み・連携完了 | ワーカー情報更新（ステータス変更含む） |
| `/api/admin/workers/:id` | DELETE | ✅ 実装済み・連携完了 | ワーカー削除 |
| `/api/admin/support/:id` | PUT | ✅ 実装済み・連携完了 | サポートチケット更新（アサイン、ステータス変更） |
| `/api/admin/support/:id` | DELETE | ✅ 実装済み・連携完了 | サポートチケット削除 |

### システム設定API

| エンドポイント | メソッド | 状態 | 備考 |
|--------------|---------|------|------|
| `/api/admin/settings` | GET | ✅ 実装済み・連携完了 | システム設定取得 ✨ 2026年2月25日連携完了 |
| `/api/admin/settings` | PUT | ✅ 実装済み・連携完了 | システム設定更新 ✨ 2026年2月25日連携完了 |
| `/api/admin/services` | GET | ✅ 実装済み・連携完了 | サービスメニュー一覧取得 |
| `/api/admin/services` | POST | ✅ 実装済み・連携完了 | サービスメニュー作成 |
| `/api/admin/services/:id` | PUT | ✅ 実装済み・連携完了 | サービスメニュー更新 |
| `/api/admin/services/:id` | DELETE | ✅ 実装済み・連携完了 | サービスメニュー削除 |
| `/api/admin/areas` | GET | ✅ 実装済み・連携完了 | 対応エリア一覧取得 |
| `/api/admin/areas` | POST | ✅ 実装済み・連携完了 | 対応エリア作成 |
| `/api/admin/areas/:id` | PUT | ✅ 実装済み・連携完了 | 対応エリア更新 |
| `/api/admin/areas/:id` | DELETE | ✅ 実装済み・連携完了 | 対応エリア削除 |

### カード管理API

| エンドポイント | メソッド | 状態 | 備考 |
|--------------|---------|------|------|
| `/api/cards` | GET | ✅ 実装済み・連携完了 | カード一覧取得 |
| `/api/cards` | POST | ✅ 実装済み・連携完了 | カード追加 |
| `/api/cards/:id` | PUT | ✅ 実装済み・連携完了 | カード更新 |
| `/api/cards/:id` | DELETE | ✅ 実装済み・連携完了 | カード削除 |

### 領収書API

| エンドポイント | メソッド | 状態 | 備考 |
|--------------|---------|------|------|
| `/api/payments/:id/receipt` | GET | ✅ 実装済み・連携完了 | 領収書PDFダウンロード |

---

## 🔧 実装済み機能

### 認証・認可

- ✅ JWT認証実装
- ✅ ロールベースアクセス制御（RBAC）
- ✅ トークンリフレッシュ機能
- ✅ パスワードリセット機能
- ✅ ワーカー登録時の追加フィールド対応（bio, hourlyRate, 口座情報, 本人確認書類）

### データベース

- ✅ Prisma ORM統合
- ✅ マイグレーション機能
- ✅ シードデータ作成

### API機能

- ✅ RESTful API設計
- ✅ エラーハンドリング
- ✅ バリデーション（express-validator）
- ✅ レート制限
- ✅ CORS設定
- ✅ Swagger APIドキュメント
- ✅ ページネーション対応
- ✅ 複数ステータスフィルター対応（カンマ区切り）
- ✅ ワーカー未割り当て予約取得（available フィルター）

### セキュリティ

- ✅ Helmet.js統合
- ✅ パスワードハッシュ化（bcrypt）
- ✅ SQLインジェクション対策（Prisma）
- ✅ XSS対策

### レポート・エクスポート機能

- ✅ 予約レポート（CSV/Excel）
- ✅ 売上レポート（CSV/Excel）
- ✅ ユーザーレポート（CSV/Excel）
- ✅ ワーカーレポート（CSV/Excel）
- ✅ グラフ用データ取得
- ✅ 比較レポート取得
- ✅ カスタムレポート取得

### 領収書機能

- ✅ 領収書PDF生成API
- ✅ 領収書ダウンロード機能

### カード管理機能

- ✅ カード情報管理API（追加・更新・削除・一覧取得）
- ✅ デフォルトカード設定機能
- ✅ カードブランド自動判定

### リアルタイム通信

- ✅ Socket.ioサーバー実装
- ✅ JWT認証による接続管理
- ✅ リアルタイム通知配信
- ✅ リアルタイムメッセージ配信
- ✅ 未読通知数のリアルタイム更新
- ✅ フロントエンドSocket.ioクライアント実装

---

## 🚀 次のステップ

### 優先度: 高

1. **管理者機能の追加API**
   - （完了）ユーザーステータス更新
   - （完了）ワーカーステータス更新
   - （完了）サポートチケットアサイン・更新

2. **システム設定API**
   - （完了）サービスメニュー管理
   - （完了）対応エリア管理
   - （完了）システム設定管理

### 優先度: 中

3. **予約API（追加機能）**
   - （完了）予約承諾/拒否専用エンドポイント
   - 作業完了エンドポイント（実装済み、フロントエンド連携待ち）

4. **共通機能**
   - （完了）WebSocket（Socket.io）実装（バックエンド・フロントエンド）
   - （完了）通知機能の完全実装（フロントエンド連携）
   - （完了）ファイルアップロードUI連携
   - （完了）レビュー機能UI連携
   - （完了）お気に入り機能UI連携
   - （完了）カード管理UI連携
   - （完了）領収書ダウンロードUI連携
   - （完了）CSVエクスポートUI連携（予約・ユーザー・ワーカー・売上レポート）

### 優先度: 低

5. **その他**
   - （完了）CSVエクスポート機能
     - `/api/admin/reports/bookings/export/csv` - 予約レポートCSVエクスポート ✅ 連携完了
     - `/api/admin/reports/bookings/export/excel` - 予約レポートExcelエクスポート（実装済み、UI連携未実装）
     - `/api/admin/reports/revenue/export/csv` - 売上レポートCSVエクスポート ✅ 連携完了
     - `/api/admin/reports/revenue/export/excel` - 売上レポートExcelエクスポート（実装済み、UI連携未実装）
     - `/api/admin/reports/users/export/csv` - ユーザーレポートCSVエクスポート ✅ 連携完了
     - `/api/admin/reports/users/export/excel` - ユーザーレポートExcelエクスポート（実装済み、UI連携未実装）
     - `/api/admin/reports/workers/export/csv` - ワーカーレポートCSVエクスポート ✅ 連携完了
     - `/api/admin/reports/workers/export/excel` - ワーカーレポートExcelエクスポート（実装済み、UI連携未実装）

---

## 📝 実装メモ

### テストデータ

- テストデータ作成スクリプト: `prisma/seed.js`
- 実行方法: `npm run seed`
- 作成されるデータ:
  - 顧客: 2名
  - ワーカー: 3名
  - 管理者: 1名
  - 予約: 6件
  - その他関連データ

### API仕様

- 詳細なAPI仕様は `docs/FRONTEND_INTEGRATION.md` を参照
- Swagger UI: `http://localhost:3000/api-docs`

### エラーハンドリング

- 統一されたエラーレスポンス形式
- HTTPステータスコードの適切な使用
- エラーメッセージの国際化対応（日本語）

### ワーカー登録の拡張

- `authService.js`と`authController.js`を拡張して、ワーカー登録時の追加フィールドに対応
- 追加フィールド: `bio`, `hourlyRate`, `bankName`, `branchName`, `accountType`, `accountNumber`, `accountName`, `idDocumentUrl`
- ワーカーは`approvalStatus: 'PENDING'`で作成される

### 予約APIの拡張

- `available`フィルターを追加（ワーカー未割り当ての予約を取得）
- 複数ステータスフィルター対応（カンマ区切り文字列を配列に変換）

---

## 📚 参考資料

- [フロントエンド連携状況](../kajishift-frontend/INTEGRATION_STATUS.md)
- [API仕様書](./FRONTEND_INTEGRATION.md)
- [ハンドオーバードキュメント](./HANDOVER_COMPLETE.md)
- [動作確認チェックリスト（フロントエンド）](../kajishift-frontend/customer/TEST_CHECKLIST.md)

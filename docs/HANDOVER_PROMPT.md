# KAJISHIFT プロジェクト 引き継ぎプロンプト

## 📋 プロジェクト概要

KAJISHIFTは、家事代行サービスを提供するプラットフォームです。顧客（CUSTOMER）、ワーカー（WORKER）、管理者（ADMIN）の3つのロールを持つWebアプリケーションです。

### プロジェクト構成

- **フロントエンド**: `c:\Users\谷口 梓\Desktop\kajishift-frontend`
  - 静的HTML + JavaScript（Vanilla JS）
  - バックエンドAPIと連携
  - ポート: 5500（開発環境）

- **バックエンド**: `c:\Users\谷口 梓\Desktop\kajishift-backend`
  - Node.js + Express.js
  - Prisma ORM（PostgreSQL）
  - JWT認証
  - ポート: 3000（開発環境）

---

## 🛠️ 技術スタック

### バックエンド
- **ランタイム**: Node.js
- **フレームワーク**: Express.js
- **ORM**: Prisma
- **データベース**: PostgreSQL
- **認証**: JWT（jsonwebtoken）
- **セキュリティ**: Helmet.js, bcrypt
- **バリデーション**: express-validator
- **リアルタイム通信**: Socket.io（実装済みだがフロントエンド未連携）
- **APIドキュメント**: Swagger

### フロントエンド
- **言語**: HTML, CSS, JavaScript（Vanilla JS）
- **認証**: JWT（localStorage保存）
- **API通信**: Fetch API
- **バリデーション**: カスタムバリデーション関数

---

## ✅ 実装済み機能

### 認証・ユーザー管理
- ✅ ユーザー登録（顧客・ワーカー・管理者）
- ✅ ログイン・ログアウト
- ✅ JWT認証
- ✅ ユーザー情報取得・更新
- ✅ ワーカー登録時の追加フィールド対応（bio, hourlyRate, 口座情報, 本人確認書類）

### 顧客（Customer）機能
- ✅ ログイン・新規登録
- ✅ ダッシュボード（ユーザー情報、予約一覧、通知数）
- ✅ 予約一覧（今後の予約・過去の予約）
- ✅ 予約詳細
- ✅ 予約作成・更新
- ✅ ワーカー選択
- ✅ チャット（メッセージ送受信、ポーリング方式）
- ✅ 決済履歴・月間サマリー

### ワーカー（Worker）機能
- ✅ ログイン・新規登録（追加フィールド対応）
- ✅ ダッシュボード
- ✅ 仕事一覧（未割り当て予約表示、フィルター、承諾）
- ✅ 仕事詳細（予約詳細、依頼者情報、承諾・辞退）
- ✅ カレンダー（割り当て済み予約表示、月次表示）
- ✅ プロフィール（表示・編集、評価）
- ✅ 報酬（報酬サマリー、決済履歴、仕事詳細）

### 管理者（Admin）機能
- ✅ ログイン
- ✅ ダッシュボード（KPIサマリー、今日の予約、問い合わせ、審査待ち）
- ✅ 予約管理（予約一覧、検索・フィルター、キャンセル）
- ✅ 利用者管理（利用者一覧、検索・フィルター、ページネーション）
- ✅ ワーカー管理（ワーカー一覧、検索・フィルター、ページネーション）
- ✅ 決済・売上管理（認証チェック実装済み）
- ✅ 問い合わせ管理（問い合わせ一覧、API連携実装済み）
- ✅ 設定（認証チェック実装済み）

### バックエンドAPI
- ✅ 認証API（3項目）
- ✅ ユーザーAPI（3項目）
- ✅ 予約API（5項目、available フィルター対応）
- ✅ ワーカーAPI（3項目）
- ✅ メッセージAPI（2項目）
- ✅ 決済API（2項目）
- ✅ 通知API（4項目）
- ✅ 管理者API（19項目、レポート・エクスポート含む）
- ✅ サポートAPI（3項目）
- ✅ レビューAPI（2項目）
- ✅ お気に入りAPI（5項目）
- ✅ ファイルアップロードAPI（5項目）

---

## ⚠️ UIのみ実装済み（API連携未実装）

以下の機能はUI（ボタン・フォーム）は表示されますが、実際のAPI連携は未実装です。

### 管理者（Admin）
- ⚠️ CSVエクスポート（`admin/bookings.html`, `admin/users.html`, `admin/workers.html`, `admin/payments.html`）
  - 現状: アラート表示のみ
  - 備考: バックエンドAPIは実装済み（`/api/admin/reports/*/export/csv`）

- ⚠️ ユーザーステータス更新（`admin/users.html`）
  - 現状: 停止/有効化ボタンは表示されるが機能しない
  - 必要: `PUT /api/admin/users/:id` API実装とフロントエンド連携

- ⚠️ ワーカーステータス更新（`admin/workers.html`）
  - 現状: 停止ボタンは表示されるが機能しない
  - 必要: `PUT /api/admin/workers/:id` API実装とフロントエンド連携

- ⚠️ ワーカー承認（`admin/workers.html`）
  - 現状: 承認APIは実装済みだが、詳細ページ未実装
  - 備考: `PUT /api/admin/workers/:id/approve` は実装済み

- ⚠️ 設定管理（`admin/settings.html`）
  - 現状: サービスメニュー、エリア編集機能未実装
  - 必要: システム設定API実装とフロントエンド連携

- ⚠️ 問い合わせアサイン（`admin/support.html`）
  - 現状: アサイン機能未実装
  - 必要: `PUT /api/admin/support/:id` API実装とフロントエンド連携

### 顧客（Customer）
- ⚠️ 領収書ダウンロード（`customer/payment.html`）
  - 現状: ボタンは表示されるが機能しない
  - 必要: 領収書生成・ダウンロード機能の実装

- ⚠️ カード管理（`customer/payment.html`）
  - 現状: UIは表示されるが機能しない
  - 必要: カード情報管理API実装とフロントエンド連携

---

## ❌ 未実装・今後実施すべき機能

### 優先度: 高

#### 1. 管理者機能の追加API実装
- **バックエンド**:
  - `PUT /api/admin/users/:id` - ユーザー情報更新（ステータス変更含む）
  - `DELETE /api/admin/users/:id` - ユーザー削除
  - `PUT /api/admin/workers/:id` - ワーカー情報更新（ステータス変更含む）
  - `DELETE /api/admin/workers/:id` - ワーカー削除
  - `PUT /api/admin/support/:id` - サポートチケット更新（アサイン、ステータス変更）
  - `DELETE /api/admin/support/:id` - サポートチケット削除

- **フロントエンド**:
  - `admin/users.html` - ユーザーステータス更新機能の実装
  - `admin/workers.html` - ワーカーステータス更新・承認機能の実装
  - `admin/support.html` - 問い合わせアサイン機能の実装

#### 2. CSVエクスポート機能のフロントエンド連携
- **フロントエンド**:
  - `admin/bookings.html` - CSVエクスポートボタンの実装
  - `admin/users.html` - CSVエクスポートボタンの実装
  - `admin/workers.html` - CSVエクスポートボタンの実装
  - `admin/payments.html` - CSVエクスポートボタンの実装

- **備考**: バックエンドAPIは既に実装済み（`/api/admin/reports/*/export/csv`）

#### 3. システム設定API実装
- **バックエンド**:
  - `GET /api/admin/settings` - システム設定取得
  - `PUT /api/admin/settings` - システム設定更新
  - `GET /api/admin/services` - サービスメニュー一覧取得
  - `POST /api/admin/services` - サービスメニュー作成
  - `PUT /api/admin/services/:id` - サービスメニュー更新
  - `DELETE /api/admin/services/:id` - サービスメニュー削除
  - `GET /api/admin/areas` - 対応エリア一覧取得
  - `POST /api/admin/areas` - 対応エリア作成
  - `PUT /api/admin/areas/:id` - 対応エリア更新
  - `DELETE /api/admin/areas/:id` - 対応エリア削除

- **フロントエンド**:
  - `admin/settings.html` - サービスメニュー管理機能の実装
  - `admin/settings.html` - 対応エリア管理機能の実装

#### 4. 顧客プロフィールページ実装
- **フロントエンド**:
  - `customer/customer-profile.html` - プロフィール表示・編集機能の実装
  - 備考: `PUT /api/users/me` APIは実装済み

### 優先度: 中

#### 5. 予約API（追加機能）
- **バックエンド**:
  - `POST /api/bookings/:id/accept` - 予約承諾専用エンドポイント
  - `POST /api/bookings/:id/reject` - 予約拒否専用エンドポイント
  - `POST /api/bookings/:id/complete` - 作業完了エンドポイント

- **備考**: 現状は`PUT /api/bookings/:id`で対応可能だが、専用エンドポイントがあるとより明確

#### 6. WebSocket（Socket.io）実装
- **バックエンド**: 実装済み（`src/index.js`, `src/routes/socket.js`）
- **フロントエンド**: 未実装
  - チャット機能をポーリングからWebSocketに移行
  - リアルタイム通知機能の実装

#### 7. 通知一覧ページ実装
- **フロントエンド**:
  - 通知一覧ページの作成
  - 通知の既読機能の実装
  - 備考: `GET /api/notifications`, `PUT /api/notifications/:id/read` APIは実装済み

#### 8. レビュー機能UI実装
- **フロントエンド**:
  - レビュー投稿UIの実装
  - レビュー表示UIの実装
  - 備考: `POST /api/reviews`, `GET /api/reviews/:workerId` APIは実装済み

#### 9. お気に入り機能UI実装
- **フロントエンド**:
  - お気に入り追加・削除UIの実装
  - お気に入り一覧表示の実装
  - 備考: お気に入りAPIは全て実装済み

### 優先度: 低

#### 10. ファイルアップロードUI連携
- **フロントエンド**:
  - ワーカー登録時の本人確認書類アップロード機能の実装
  - 備考: `POST /api/upload` APIは実装済み

#### 11. 領収書ダウンロード機能
- **バックエンド**: 領収書生成APIの実装
- **フロントエンド**: `customer/payment.html` - 領収書ダウンロード機能の実装

#### 12. カード管理機能
- **バックエンド**: カード情報管理APIの実装
- **フロントエンド**: `customer/payment.html` - カード管理機能の実装

---

## 📁 重要なファイルとディレクトリ構造

### バックエンド

```
kajishift-backend/
├── src/
│   ├── index.js              # メインエントリーポイント
│   ├── routes/               # ルート定義
│   │   ├── auth.js          # 認証ルート
│   │   ├── bookings.js      # 予約ルート
│   │   ├── workers.js       # ワーカールート
│   │   ├── messages.js      # メッセージルート
│   │   ├── payments.js      # 決済ルート
│   │   ├── admin.js         # 管理者ルート
│   │   └── ...
│   ├── controllers/          # コントローラー
│   ├── services/             # ビジネスロジック
│   ├── middleware/           # ミドルウェア（認証など）
│   └── utils/                # ユーティリティ
├── prisma/
│   ├── schema.prisma        # データベーススキーマ
│   └── seed.js              # テストデータ作成スクリプト
├── .env                      # 環境変数
├── package.json
├── docs/
│   ├── FRONTEND_INTEGRATION.md   # API仕様書
│   ├── INTEGRATION_STATUS.md     # 連携状況
│   └── HANDOVER_COMPLETE.md      # ハンドオーバードキュメント
└── ...
```

### フロントエンド

```
kajishift-frontend/
├── customer/                 # 顧客向けページ
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── bookings.html
│   ├── booking-detail.html
│   ├── booking.html
│   ├── select-worker.html
│   ├── chat.html
│   ├── payment.html
│   └── customer-profile.html # 未実装
├── worker/                   # ワーカー向けページ
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── jobs.html
│   ├── job-detail.html
│   ├── calendar.html
│   ├── profile.html
│   └── rewards.html
├── admin/                    # 管理者向けページ
│   ├── login.html
│   ├── dashboard.html
│   ├── bookings.html
│   ├── users.html
│   ├── workers.html
│   ├── payments.html
│   ├── support.html
│   └── settings.html
├── js/
│   ├── api.js               # APIクライアントクラス
│   ├── auth.js              # 認証ヘルパー関数
│   └── validation.js        # バリデーション関数
├── INTEGRATION_STATUS.md     # 連携状況
└── customer/TEST_CHECKLIST.md # テストチェックリスト
```

---

## 🔧 開発環境のセットアップ

### バックエンド

1. **依存関係のインストール**
   ```bash
   cd kajishift-backend
   npm install
   ```

2. **環境変数の設定**
   - `.env`ファイルを作成
   - 必要な環境変数を設定（データベースURL、JWT秘密鍵など）

3. **データベースのセットアップ**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **テストデータの作成**
   ```bash
   npm run seed
   ```
   または
   ```bash
   scripts/seed.bat
   ```

5. **サーバーの起動**
   ```bash
   npm run dev
   ```
   または
   ```bash
   npm start
   ```

### フロントエンド

1. **開発サーバーの起動**
   - VS CodeのLive Server拡張機能を使用
   - または `npx http-server` を使用
   - ポート: 5500（デフォルト）

2. **CORS設定**
   - バックエンドの`src/index.js`でCORS設定を確認
   - `CORS_ORIGIN`環境変数でフロントエンドのURLを指定

---

## 🧪 テストデータ

テストデータは`prisma/seed.js`で作成されます。

### 作成されるデータ
- **顧客**: 2名
  - `customer1@example.com` / `password123`
  - `customer2@example.com` / `password123`

- **ワーカー**: 3名
  - `worker1@example.com` / `password123`
  - `worker2@example.com` / `password123`
  - `worker3@example.com` / `password123`

- **管理者**: 1名
  - `admin@example.com` / `password123`

- **予約**: 6件（様々なステータス）
- **その他**: レビュー、決済、メッセージ、通知など

---

## 📝 実装時の注意事項

### 認証方式
- **トークン保存**: `localStorage`にJWTトークンを保存
- **セッション管理**: ワーカーダッシュボードは`sessionStorage`も使用（後方互換性のため）
- **認証チェック**: `checkAuth(role)`関数を使用

### API連携の基本パターン

```javascript
// 1. 認証チェック
if (!checkAuth('customer')) {
  return; // リダイレクトされる
}

// 2. API呼び出し
try {
  const response = await api.getBookings({ status: 'PENDING,CONFIRMED' });
  // データ表示処理
} catch (error) {
  showError(error.message);
}
```

### エラーハンドリング
- `api.js`の`request`メソッドで401エラー時に自動リダイレクト
- `showError()`関数でエラーメッセージを表示
- コンソールに詳細なエラーログを出力

### 予約APIの特殊な機能
- **複数ステータスフィルター**: `status=PENDING,CONFIRMED`のようにカンマ区切りで指定可能
- **available フィルター**: `available=true`でワーカー未割り当ての予約を取得

### ワーカー登録の追加フィールド
- `bio`（自己紹介）
- `hourlyRate`（希望時給）
- `bankName`, `branchName`, `accountType`, `accountNumber`, `accountName`（口座情報）
- `idDocumentUrl`（本人確認書類 - アップロード機能は準備中）

---

## 📚 参考資料

### ドキュメント
- **バックエンドAPI仕様書**: `docs/FRONTEND_INTEGRATION.md`
- **バックエンド連携状況**: `docs/INTEGRATION_STATUS.md`
- **フロントエンド連携状況**: `kajishift-frontend/INTEGRATION_STATUS.md`
- **ハンドオーバードキュメント**: `docs/HANDOVER_COMPLETE.md`
- **テストデータ作成**: `docs/README_SEED.md`

### テストチェックリスト
- **顧客機能**: `kajishift-frontend/customer/TEST_CHECKLIST.md`
- **ワーカー機能**: `kajishift-frontend/worker/TEST_CHECKLIST.md`
- **管理者機能**: `kajishift-frontend/admin/TEST_CHECKLIST.md`

### APIドキュメント
- **Swagger UI**: `http://localhost:3000/api-docs`

---

## 🚀 次のステップ（優先順位順）

### 即座に実施すべき（優先度: 高）

1. **管理者機能の追加API実装**
   - ユーザーステータス更新API
   - ワーカーステータス更新API
   - サポートチケットアサイン・更新API

2. **CSVエクスポート機能のフロントエンド連携**
   - 既存のバックエンドAPIを利用してフロントエンドに実装

3. **システム設定API実装**
   - サービスメニュー管理API
   - 対応エリア管理API

4. **顧客プロフィールページ実装**
   - 既存の`PUT /api/users/me` APIを利用

### 中期で実施すべき（優先度: 中）

5. **WebSocket（Socket.io）実装**
   - チャット機能をポーリングからWebSocketに移行

6. **通知一覧ページ実装**
   - 既存の通知APIを利用

7. **レビュー機能UI実装**
   - 既存のレビューAPIを利用

8. **お気に入り機能UI実装**
   - 既存のお気に入りAPIを利用

### 長期で実施すべき（優先度: 低）

9. **ファイルアップロードUI連携**
10. **領収書ダウンロード機能**
11. **カード管理機能**

---

## 💡 実装のヒント

1. **既存のAPIを活用**: 多くのAPIは既に実装済みなので、フロントエンドの連携のみで完了する機能が多い

2. **パターンの再利用**: 既存のページ（例: `customer/bookings.html`）を参考にして、同様のパターンで実装

3. **エラーハンドリング**: `api.js`の`request`メソッドと`auth.js`の`showError`関数を活用

4. **認証チェック**: 各ページの最初に`checkAuth(role)`を呼び出す

5. **テストデータ**: `npm run seed`でテストデータを作成して、動作確認を容易に

---

## ❓ 質問・不明点がある場合

1. **API仕様**: `docs/FRONTEND_INTEGRATION.md`を参照
2. **連携状況**: `docs/INTEGRATION_STATUS.md`を参照
3. **実装例**: 既存のページ（例: `customer/bookings.html`）を参照
4. **Swagger UI**: `http://localhost:3000/api-docs`でAPI仕様を確認

---

**最終更新日**: 2026年2月18日

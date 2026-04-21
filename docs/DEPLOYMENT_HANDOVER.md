# デプロイメント作業 引継ぎドキュメント

**作成日**: 2026年2月20日  
**最終更新**: 2026年3月26日

## 📋 概要

このドキュメントは、KAJISHIFTプロジェクトのRender（バックエンド）とVercel（フロントエンド）へのデプロイ作業の進捗状況と、現在の課題をまとめたものです。

---

## ✅ 完了した作業

### 2026年3月26日の更新内容

- ✅ **CORS設定の運用調整**
  - `src/index.js` のCORSを `CORS_ORIGIN` 優先 + fallback方式に更新
  - fallback: `https://kajishift-frontend.vercel.app`
- ✅ **Prisma seed設定を追加**
  - `package.json` に以下を追加
    - `"prisma": { "seed": "node prisma/seed.js" }`
- ✅ **Railway DB接続情報を整理**
  - `.env` の `DATABASE_URL` を Railway接続文字列へ更新
  - `README.md` / `docs/DATABASE_SETUP.md` に Railway外部接続URL例を追記

### 2026年3月2日の更新内容

- ✅ **トップページUI改善**
  - 「ご利用の流れ」ボタンのスタイル改善
    - ボタンサイズを拡大（パディング: `16px 32px`、フォントサイズ: `var(--font-size-lg)`）
    - 中央配置を確実にするため`justify-content: center`と`margin: 0 auto`を追加
    - 矢印アイコンのサイズを`1em`（テキストと同じサイズ）に調整
  - 特徴カードのアイコンを画像に変更
    - お金のアイコン（💰）→ `object_gamaguchi.png`
    - カレンダーのアイコン（📅）→ `business_karenda.png`
    - 盾のアイコン（🛡️）→ `business_tate.png`
    - アイコンサイズを`3.5rem`（56px）に設定し、中央配置を実装

### 1. バックエンド（Render）のデプロイ

#### デプロイ完了
- ✅ **サービス名**: `kajishift-api`
- ✅ **URL**: `https://kajishift-backend-production.up.railway.app`
- ✅ **GitHubリポジトリ**: `https://github.com/azusa-tani/kajishift-backend`
- ✅ **ステータス**: Live（正常稼働中）

#### データベース
- ✅ **データベース名**: `kajishift-postgres`（または`kajishift-db`）
- ✅ **接続**: 正常
- ✅ **マイグレーション**: 7つのマイグレーションファイルが認識されている
- ⚠️ **注意**: マイグレーションは「No pending migrations to apply」と表示されているが、データベースにテーブルが存在しない可能性あり

#### 環境変数設定
- ✅ `DATABASE_URL`: 設定済み
- ✅ `CORS_ORIGIN`: `http://localhost:5500,https://kajishift-frontend.vercel.app`（Vercel移行に伴い更新済み）
- ✅ その他の環境変数: 設定済み

**注意**: フロントエンドがVercelに移行したため、`CORS_ORIGIN`はVercelのURLに更新されています。Renderダッシュボードで確認してください。

#### 実装した変更
1. **CORS設定の複数オリジン対応**
   - `src/index.js`: 複数のURLをカンマ区切りで指定可能に変更
   - `src/config/socket.js`: 同様に複数オリジン対応

2. **trust proxy設定の追加**
   - `src/index.js`: `app.set('trust proxy', true);` を追加
   - ⚠️ **警告**: `express-rate-limit`から警告が表示されている（後で対処が必要）

3. **マイグレーションファイルの追加**
   - `prisma/migrations/` ディレクトリをGitHubリポジトリに追加
   - `.gitignore`から`prisma/migrations/`を削除

4. **データベース診断エンドポイントの追加（2026年2月24日）**
   - `src/index.js`: `/api/health/db`エンドポイントを追加
   - データベース接続状態、テーブル一覧、マイグレーション履歴、ユーザー数を確認可能

5. **シードデータの投入（2026年2月24日）**
   - 本番データベースにシードデータを投入完了
   - 作成されたデータ:
     - ユーザー: 6名（管理者1、依頼者2、ワーカー3）
     - 予約: 6件（今後の予約3、過去の予約3）
     - レビュー: 2件
     - 決済: 2件
     - メッセージ: 3件
     - 通知: 2件
     - お気に入り: 2件

### 2. フロントエンド（Vercel）のデプロイ

#### デプロイ完了
- ✅ **サイト名**: `kajishift-frontend`
- ✅ **URL**: `https://kajishift-frontend.vercel.app`
- ✅ **GitHubリポジトリ**: `https://github.com/azusa-tani/kajishift-frontend`
- ✅ **ステータス**: Live（正常稼働中）
- ✅ **CI/CD**: GitHubとVercelの連携設定完了（GitHub push → 自動デプロイ）
- ✅ **デプロイ方式**: 静的HTMLサイトとしてデプロイ（Application Preset: Other）

#### 実装した変更
1. **NetlifyからVercelへの移行（2026年3月）**
   - Netlifyのクレジット問題を回避し、Vercelへ移行
   - GitHub Appを設定し、リポジトリをVercelに連携
   - CI/CD構築完了（GitHub push → 自動デプロイ）

2. **API接続設定の更新**
   - `js/api.js`: 環境に応じて自動的にAPI URLを切り替え
     - 開発環境（`localhost`）: `http://localhost:3000/api`
     - 本番環境（その他）: `https://kajishift-backend-production.up.railway.app/api`

3. **法務ページの公開**
   - 利用規約（`terms.html`）公開完了
   - プライバシーポリシー（`privacy.html`）公開完了
   - 特定商取引法（`legal.html`）公開完了
   - Stripe決済審査でも必要な法務ページを完成

4. **3ロールログイン画面の確認**
   - 依頼者ログイン（`/customer/login.html`）正常表示確認済み
   - ワーカーログイン（`/worker/login.html`）正常表示確認済み
   - 管理者ログイン（`/admin/login.html`）正常表示確認済み

---

## ⚠️ 現在の課題

### 1. ログイン時の500エラー

#### 症状
- フロントエンドからログインを試行すると、`POST https://kajishift-backend-production.up.railway.app/api/auth/login 500 (Internal Server Error)` が発生

#### 調査結果
1. **以前のエラー**: `The table 'public.users' does not exist in the current database.`
   - マイグレーションファイルがGitHubリポジトリに含まれていなかった
   - ✅ **解決済み**: マイグレーションファイルを追加

2. **以前の状態**:
   - マイグレーションファイルは認識されている（`7 migrations found in prisma/migrations`）
   - しかし「No pending migrations to apply」と表示
   - データベースにテーブルが存在しない可能性

3. **✅ 解決済み（2026年2月24日）**:
   - データベース診断エンドポイント（`/api/health/db`）を追加
   - データベース接続とテーブル存在を確認済み
   - シードデータを投入完了（6名のユーザー、予約、レビュー、決済、メッセージ、通知、お気に入り）
   - **管理者ログインエラーを解消**: ログイン処理にエラーログを追加し、診断エンドポイントで管理者ユーザー情報を確認可能に
   - **管理者ログイン成功を確認**: 管理者ダッシュボードが正常に表示されることを確認

4. **✅ 管理者登録機能追加（2026年2月24日）**:
   - **バックエンド**: `POST /api/admin/register`エンドポイントを追加（既存管理者のみが新しい管理者を登録可能）
     - `src/services/adminService.js`に`registerAdmin`関数を追加
     - `src/controllers/adminController.js`に`registerAdmin`コントローラーを追加
     - `src/routes/admin.js`にエンドポイントを追加
     - セキュリティ: 既存の管理者のみが実行可能（認証ミドルウェアで保護）
   - **フロントエンド**: 管理者登録フォームを追加
     - `js/api.js`に`registerAdmin`メソッドを追加
     - `admin/users.html`に管理者登録モーダルとボタンを追加
     - `css/style.css`にモーダルのスタイルを追加
     - `admin/login.html`から新規登録リンクを削除（セキュリティ強化）
   - **セキュリティ**: 管理者ログインページから一般ユーザー向けの新規登録リンクを削除

### 2. express-rate-limitの警告

#### 症状
```
ValidationError: The Express 'trust proxy' setting is true, which allows anyone to trivially bypass IP-based rate limiting.
```

#### 対処方法（後で実装）
```javascript
// より安全な設定
app.set('trust proxy', 1); // 最初のプロキシのみを信頼
```

---

## 🔍 次のステップ

### 優先度: 高

1. **✅ 完了: データベースの状態確認**
   - 診断エンドポイント（`/api/health/db`）で確認完了
   - すべてのテーブルが存在し、マイグレーションも適用済み

2. **✅ 完了: シードデータの投入**
   - 本番データベースにテストデータを投入完了
   - ローカルから本番DBに接続してシードを実行（External Database URLを使用）

3. **✅ 完了: ログイン動作の確認**
   - フロントエンドから以下のテストユーザーでログインを試行
   - **すべてのユーザー（依頼者1・依頼者2・ワーカー1・ワーカー2・ワーカー3・管理者）でログイン成功を確認**

4. **✅ 完了: 管理者登録機能の追加（2026年2月24日）**
   - バックエンド: `POST /api/admin/register`エンドポイントを実装
   - フロントエンド: 管理者登録フォーム（モーダル）を実装
   - セキュリティ: 既存管理者のみが新しい管理者を登録可能
   - セキュリティ強化: 管理者ログインページから新規登録リンクを削除

5. **✅ 完了: フロントエンドUI改善（2026年2月25日）**
   - ヘッダー: 「依頼者ログイン」「ワーカーログイン」に変更
   - フッター: 「管理者」リンクを追加
   - ロゴ: マークをKAJISHIFTテキストの中央上部に配置、サイズを48pxに拡大
   - ヒーローセクションのサブタイトルを白文字に変更（テキストシャドウ付き）
   - ヘッダー・フッターリンクのスタイルを統一

6. **✅ 完了: 予約詳細ページのエラー修正（2026年2月27日）**
   - バックエンド: 予約IDのUUID形式バリデーションを追加（`src/controllers/bookingController.js`）
     - 数値IDが送信された場合、400エラーと明確なエラーメッセージを返すように修正
   - フロントエンド: 予約IDの形式チェックを追加（`customer/booking-detail.html`）
     - 数値IDの場合は適切なエラーメッセージを表示し、予約一覧に戻るリンクを表示
   - ダッシュボードページ: ハードコードされた予約ID（`id=1`、`id=2`）を削除
   - 問題: 数値形式の予約ID（`id=1`など）が送信されると500エラーが発生していた
   - 解決: UUID形式のバリデーションを追加し、不正なIDの場合は適切なエラーメッセージを表示

7. **✅ 完了: チャットページメニュー機能追加（2026年2月27日）**
   - フロントエンド: チャットページにメニューボタンとドロップダウンメニューを追加
     - `customer/chat.html`: 「⋯」ボタンにメニュー機能を実装
       - メニュー項目: 「ワーカープロフィールを見る」「予約詳細を見る」「予約一覧に戻る」
       - ワーカープロフィールモーダルを追加（プロフィール表示、レビュー表示機能付き）
     - `css/style.css`: チャットメニューのスタイルを追加（ドロップダウンメニュー、ホバー効果）
   - 機能: チャットページから直接ワーカープロフィールや予約詳細にアクセス可能に

8. **✅ 完了: ユーザーテスト仕様書作成（2026年2月27日）**
   - テスト仕様書を作成
     - `docs/TEST_SPEC_ADMIN.md`: 管理者テスト仕様書（38項目）
     - `docs/TEST_SPEC_CUSTOMER.md`: 依頼者テスト仕様書（35項目）
     - `docs/TEST_SPEC_WORKER.md`: ワーカーテスト仕様書（30項目）
     - `docs/TEST_SPEC_OVERVIEW.md`: テスト仕様書概要
   - 各テスト仕様書に以下を記載
     - テスト用アカウント情報（メールアドレス、パスワード、詳細情報）
     - テスト実行フロー（推奨テスト実行順序、チェックリスト）
     - テスト実行時の注意事項
   - テスト項目の詳細（テストID、前提条件、テスト手順、期待結果、優先度）

9. **✅ 完了: ワーカー向け未割り当て予約一覧（GET /api/bookings）の修正（2026年4月3日）**
   - **問題**: `status=PENDING` かつ `available=true` で取得しても、DB に `workerId: null` の PENDING があっても空配列になるケースがあった
   - **原因（想定）**: クエリ `available` が配列で届くと厳密等価 `=== 'true'` が偽になり、WORKER が「自分に割り当てられた予約」条件のみになっていた。日付 `YYYY-MM-DD` もサーバータイムゾーン依存の解釈で `scheduledDate`（UTC）とずれる可能性があった
   - **対応**: `src/services/bookingService.js` の `getBookings` で `available` / `status` の正規化、`YYYY-MM-DD` を UTC 日境界で比較、未割り当てを `workerId` の `equals: null` で明示
   - **ドキュメント**: `docs/FRONTEND_INTEGRATION.md`、`docs/INTEGRATION_STATUS.md`、`docs/api-design.md`、`docs/HANDOVER_PROMPT.md`、`docs/HANDOVER_COMPLETE.md`、`README.md` を更新

### 優先度: 中

5. **express-rate-limitの警告解消**
   - `trust proxy`設定をより安全な値に変更

5. **✅ 完了: フロントエンドのVercel移行（2026年3月）**
   - NetlifyからVercelへ移行完了
   - サイト名: `kajishift-frontend`
   - URL: `https://kajishift-frontend.vercel.app`
   - CI/CD構築完了（GitHub push → 自動デプロイ）
   - 法務ページ公開完了（利用規約・プライバシーポリシー・特定商取引法）

---

## 📝 重要な情報

### ログイン情報（テスト用）

すべてのパスワードは `password123` です。

#### 依頼者（顧客）
- `customer1@example.com` / `password123`
- `customer2@example.com` / `password123`

#### ワーカー
- `worker1@example.com` / `password123`
- `worker2@example.com` / `password123`
- `worker3@example.com` / `password123`

#### 管理者
- `admin@kajishift.com` / `password123`

**注意**: これらのユーザーはシードデータで作成されるため、本番データベースにシードデータが投入されていない場合は存在しません。

### URL一覧

- **バックエンドAPI**: `https://kajishift-backend-production.up.railway.app`
- **APIドキュメント**: `https://kajishift-backend-production.up.railway.app/api-docs`
- **ヘルスチェック**: `https://kajishift-backend-production.up.railway.app/api/health`
- **データベース診断**: `https://kajishift-backend-production.up.railway.app/api/health/db`
- **フロントエンド**: `https://kajishift-frontend.vercel.app`

### GitHubリポジトリ

- **バックエンド**: `https://github.com/azusa-tani/kajishift-backend`
- **フロントエンド**: `https://github.com/azusa-tani/kajishift-frontend`

---

## 🔧 トラブルシューティング

### ログインエラーが発生する場合

1. **Renderのログを確認**
   - Renderダッシュボード → `kajishift-api` → 「Logs」タブ
   - ログイン試行直後のエラーメッセージを確認

2. **データベースの状態確認**
   - Prisma Studioで本番DBに接続（ローカルの`.env`に本番の`DATABASE_URL`を設定）
   - テーブルが存在するか確認

3. **マイグレーションの再適用**
   - データベースが空の場合、マイグレーションを強制的に適用する必要がある

### サーバーがスピンダウンしている場合

- Renderの無料プランでは、非アクティブ時にサーバーが停止します
- 初回アクセス時に約50秒かかります
- URL（`https://kajishift-backend-production.up.railway.app`）にアクセスしてサーバーを起動

---

## 📚 関連ドキュメント

- [HANDOVER_PROMPT.md](./HANDOVER_PROMPT.md) - プロジェクト全体の引継ぎドキュメント
- [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) - Renderデプロイ手順書
- [README_SEED.md](./README_SEED.md) - シードデータ作成方法
- [DEPLOYMENT.md](./DEPLOYMENT.md) - デプロイメント全般のドキュメント

---

## 📌 メモ

- Renderの無料プランではShellアクセスが使えないため、データベース操作は制限される
- 本番環境でのシードデータ投入は慎重に行う必要がある（既存データが削除される可能性）
- `trust proxy`の警告は後で対処可能（機能には影響しない）

---

**最終更新**: 2026年3月（フロントエンドのVercel移行、法務ページ公開完了）

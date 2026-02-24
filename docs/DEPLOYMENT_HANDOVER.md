# デプロイメント作業 引継ぎドキュメント

**作成日**: 2026年2月20日  
**最終更新**: 2026年2月20日

## 📋 概要

このドキュメントは、KAJISHIFTプロジェクトのRender（バックエンド）とNetlify（フロントエンド）へのデプロイ作業の進捗状況と、現在の課題をまとめたものです。

---

## ✅ 完了した作業

### 1. バックエンド（Render）のデプロイ

#### デプロイ完了
- ✅ **サービス名**: `kajishift-api`
- ✅ **URL**: `https://kajishift-api.onrender.com`
- ✅ **GitHubリポジトリ**: `https://github.com/azusa-tani/kajishift-backend`
- ✅ **ステータス**: Live（正常稼働中）

#### データベース
- ✅ **データベース名**: `kajishift-postgres`（または`kajishift-db`）
- ✅ **接続**: 正常
- ✅ **マイグレーション**: 7つのマイグレーションファイルが認識されている
- ⚠️ **注意**: マイグレーションは「No pending migrations to apply」と表示されているが、データベースにテーブルが存在しない可能性あり

#### 環境変数設定
- ✅ `DATABASE_URL`: 設定済み
- ✅ `CORS_ORIGIN`: `http://localhost:5500,https://kajishift-frontend.netlify.app,https://stellar-phoenix-fa7d94.netlify.app`
- ✅ その他の環境変数: 設定済み

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

### 2. フロントエンド（Netlify）のデプロイ

#### デプロイ完了
- ✅ **サイト名**: `stellar-phoenix-fa7d94`（自動生成）
- ✅ **URL**: `https://stellar-phoenix-fa7d94.netlify.app`
- ✅ **GitHubリポジトリ**: `https://github.com/azusa-tani/kajishift-frontend`
- ✅ **ステータス**: Live（正常稼働中）

#### 実装した変更
1. **API接続設定の更新**
   - `js/api.js`: 環境に応じて自動的にAPI URLを切り替え
     - 開発環境（`localhost`）: `http://localhost:3000/api`
     - 本番環境（その他）: `https://kajishift-api.onrender.com/api`

---

## ⚠️ 現在の課題

### 1. ログイン時の500エラー

#### 症状
- フロントエンドからログインを試行すると、`POST https://kajishift-api.onrender.com/api/auth/login 500 (Internal Server Error)` が発生

#### 調査結果
1. **以前のエラー**: `The table 'public.users' does not exist in the current database.`
   - マイグレーションファイルがGitHubリポジトリに含まれていなかった
   - ✅ **解決済み**: マイグレーションファイルを追加

2. **現在の状態**:
   - マイグレーションファイルは認識されている（`7 migrations found in prisma/migrations`）
   - しかし「No pending migrations to apply」と表示
   - データベースにテーブルが存在しない可能性

#### 考えられる原因
- データベースが空の状態で、マイグレーションが適用されていない
- シードデータが投入されていない

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

1. **データベースの状態確認**
   - Prisma Studioで本番データベースに接続してテーブルの存在を確認
   - または、Renderのログでログイン試行時のエラーメッセージを確認

2. **マイグレーションの強制適用**
   - データベースが空の場合、マイグレーションを強制的に適用する必要がある
   - ただし、Renderの無料プランではShellアクセスが使えないため、別の方法を検討

3. **シードデータの投入**
   - 本番データベースにテストデータを投入
   - 方法：
     - ローカルから本番DBに接続してシードを実行（注意：既存データが削除される）
     - または、フロントエンドから新規登録でテストユーザーを作成

### 優先度: 中

4. **express-rate-limitの警告解消**
   - `trust proxy`設定をより安全な値に変更

5. **プロジェクト名の変更（Netlify）**
   - 現在: `stellar-phoenix-fa7d94`
   - 推奨: `kajishift-frontend`など、分かりやすい名前に変更

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

- **バックエンドAPI**: `https://kajishift-api.onrender.com`
- **APIドキュメント**: `https://kajishift-api.onrender.com/api-docs`
- **ヘルスチェック**: `https://kajishift-api.onrender.com/api/health`
- **フロントエンド**: `https://stellar-phoenix-fa7d94.netlify.app`

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
- URL（`https://kajishift-api.onrender.com`）にアクセスしてサーバーを起動

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

**最終更新**: 2026年2月20日

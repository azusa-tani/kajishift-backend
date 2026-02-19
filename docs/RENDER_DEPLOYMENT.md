# Render デプロイメント手順書

このドキュメントは、KAJISHIFTバックエンドAPIをRenderにデプロイするための詳細な手順を記載しています。

## 📋 前提条件

- GitHubアカウント
- Renderアカウント（[https://render.com/](https://render.com/)で無料登録可能）
- Gitリポジトリ（GitHubにプッシュ済み）

## 🚀 デプロイメント手順

### ステップ1: Renderアカウントの作成

1. [Render](https://render.com/)にアクセス
2. 「Get Started for Free」をクリック
3. GitHubアカウントでサインアップ
4. GitHubリポジトリへのアクセスを許可

### ステップ2: PostgreSQLデータベースの作成

1. Renderダッシュボードで「New +」をクリック
2. 「PostgreSQL」を選択
3. 以下の設定を行う：
   - **Name**: `kajishift-db`（任意の名前）
   - **Database**: `kajishift`（任意のデータベース名）
   - **User**: `kajishift_user`（任意のユーザー名）
   - **Region**: 最寄りのリージョンを選択（例: `Singapore`）
   - **Plan**: `Free`（無料プラン）または `Starter`（有料プラン）
4. 「Create Database」をクリック
5. データベースが作成されたら、**Internal Database URL**をコピー（後で使用します）

### ステップ3: Webサービスの作成

1. Renderダッシュボードで「New +」をクリック
2. 「Web Service」を選択
3. GitHubリポジトリを接続
   - リポジトリを選択
   - または「Connect account」でGitHubアカウントを接続
4. リポジトリを選択したら、以下の設定を行う：

#### 基本設定

- **Name**: `kajishift-api`（任意の名前）
- **Region**: データベースと同じリージョンを選択
- **Branch**: `main`（またはデプロイしたいブランチ）
- **Root Directory**: （空欄のまま）
- **Environment**: `Node`
- **Build Command**: 
  ```bash
  npm install && npm run prisma:generate
  ```
- **Start Command**: 
  ```bash
  npm run prisma:migrate:deploy && npm start
  ```
- **Plan**: `Free`（無料プラン）または `Starter`（有料プラン）

#### 環境変数の設定

「Environment」タブで以下の環境変数を設定：

**必須環境変数:**

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<PostgreSQLデータベースのInternal Database URL>
JWT_SECRET=<32文字以上の強力なランダム文字列>
CORS_ORIGIN=<フロントエンドのURL>
```

**JWT_SECRETの生成方法:**

```bash
# 方法1: OpenSSLを使用
openssl rand -base64 32

# 方法2: Node.jsを使用
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**オプション環境変数:**

```env
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN=24h
LOG_LEVEL=info
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@kajishift.com
FRONTEND_URL=https://your-frontend-domain.com
```

#### データベースの接続

1. 「Environment」タブで「Add Environment Variable」をクリック
2. 「Link Database」を選択
3. 作成したPostgreSQLデータベースを選択
4. `DATABASE_URL`が自動的に設定されます

### ステップ4: デプロイの実行

1. すべての設定が完了したら、「Create Web Service」をクリック
2. Renderが自動的にビルドとデプロイを開始します
3. デプロイの進行状況は「Events」タブで確認できます
4. デプロイが完了すると、URLが生成されます（例: `https://kajishift-api.onrender.com`）

### ステップ5: 動作確認

1. デプロイが完了したら、以下のURLでヘルスチェックを実行：
   ```
   https://your-service-name.onrender.com/api/health
   ```
2. 正常に動作している場合、以下のレスポンスが返ります：
   ```json
   {
     "status": "OK",
     "message": "KAJISHIFT API is running",
     "timestamp": "2026-02-18T..."
   }
   ```
3. APIドキュメントにアクセス：
   ```
   https://your-service-name.onrender.com/api-docs
   ```

## 🔧 トラブルシューティング

### ビルドエラー

**問題**: Prismaクライアントの生成エラー

**解決方法**:
1. `package.json`に`postinstall`スクリプトが追加されているか確認
2. ビルドコマンドに`npm run prisma:generate`が含まれているか確認

### データベース接続エラー

**問題**: `DATABASE_URL`が正しく設定されていない

**解決方法**:
1. 環境変数の`DATABASE_URL`を確認
2. PostgreSQLデータベースが作成されているか確認
3. データベースがWebサービスにリンクされているか確認

### マイグレーションエラー

**問題**: マイグレーションが実行されない

**解決方法**:
1. Start Commandに`npm run prisma:migrate:deploy`が含まれているか確認
2. 手動でマイグレーションを実行：
   - Renderのダッシュボードで「Shell」を開く
   - `npm run prisma:migrate:deploy`を実行

### アプリケーションが起動しない

**問題**: ポートエラーや環境変数エラー

**解決方法**:
1. ログを確認（「Logs」タブ）
2. 環境変数が正しく設定されているか確認
3. `PORT`環境変数が設定されているか確認（Renderは自動的に設定しますが、明示的に設定することも可能）

## 📝 デプロイ後の設定

### カスタムドメインの設定（オプション）

1. Renderダッシュボードでサービスを選択
2. 「Settings」タブを開く
3. 「Custom Domains」セクションでドメインを追加
4. DNS設定をRenderの指示に従って設定

### 自動デプロイの設定

- デフォルトで、GitHubにプッシュすると自動的にデプロイされます
- 「Settings」→「Auto-Deploy」で設定を変更できます

### 環境変数の更新

1. 「Environment」タブで環境変数を編集
2. 変更後、サービスが自動的に再起動されます

## 🔄 デプロイメントの更新

### 通常の更新

1. コードを変更してGitHubにプッシュ
2. Renderが自動的にデプロイを開始
3. 「Events」タブで進行状況を確認

### 手動デプロイ

1. Renderダッシュボードでサービスを選択
2. 「Manual Deploy」をクリック
3. デプロイしたいブランチとコミットを選択

## 📊 監視とログ

### ログの確認

1. Renderダッシュボードでサービスを選択
2. 「Logs」タブでリアルタイムログを確認

### メトリクスの確認

1. 「Metrics」タブでCPU、メモリ、リクエスト数などを確認
2. 無料プランでは制限があります

## ⚠️ 注意事項

### 無料プランの制限

- **スピンアップ時間**: 15分間の非アクティブ後にスリープします
- **リクエスト制限**: 制限があります
- **データベース**: 90日間の非アクティブ後に削除される可能性があります

### 本番環境での推奨事項

1. **有料プランへのアップグレード**: スリープを防ぐため
2. **定期的なバックアップ**: データベースのバックアップを取得
3. **監視の設定**: エラー通知を設定
4. **セキュリティ**: `JWT_SECRET`を強力な値に設定

## 📚 関連ドキュメント

- [DEPLOYMENT.md](./DEPLOYMENT.md) - 一般的なデプロイメントガイド
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - データベースセットアップガイド

## 🆘 サポート

問題が発生した場合：

1. Renderのドキュメント: [https://render.com/docs](https://render.com/docs)
2. Renderのサポート: [https://render.com/support](https://render.com/support)
3. プロジェクトのログを確認

---

**最終更新日**: 2026年2月18日

# 本番データベースにシードデータを投入する手順

## ⚠️ 重要

この手順は**本番データベースの既存データを削除**します。実行前に必ず確認してください。

## 前提条件

1. Renderダッシュボードから`DATABASE_URL`を取得していること
2. PowerShellが使用可能であること

## 手順

### ステップ1: DATABASE_URLを取得

1. Renderダッシュボードにアクセス: https://dashboard.render.com/
2. `kajishift-db`（または`kajishift-postgres`）を開く
3. 「Connections」タブを開く
4. 「Internal Database URL」をコピー

### ステップ2: PowerShellで環境変数を設定

PowerShellで以下のコマンドを実行してください：

```powershell
$env:DATABASE_URL="postgresql://kajishift_user:VyeFrTChBqUkUWwU4QtoAARoghieuUGT@dpg-d6bc1id6ubr73cgq3vg-a/kajishift"
```

**重要**: `$env:`の前に`$`（ドル記号）が必要です。

### ステップ3: 環境変数が設定されたか確認

```powershell
$env:DATABASE_URL
```

上記のコマンドで、設定した`DATABASE_URL`が表示されることを確認してください。

### ステップ4: シードスクリプトを実行

```powershell
.\scripts\seed-production.ps1
```

## 一括実行（推奨）

環境変数の設定とスクリプトの実行を1つのコマンドで行う場合：

```powershell
$env:DATABASE_URL="postgresql://kajishift_user:VyeFrTChBqUkUWwU4QtoAARoghieuUGT@dpg-d6bc1id6ubr73cgq3vg-a/kajishift"; .\scripts\seed-production.ps1
```

## 実行内容

スクリプトは以下を自動的に実行します：

1. `DATABASE_URL`環境変数の確認
2. Prismaクライアントの生成（`npm run prisma:generate`）
3. シードデータの投入（`npm run seed`）

## 実行後の確認

シード実行後、以下のURLで確認できます：

```
https://kajishift-api.onrender.com/api/health/db
```

`userCount`が`6`になっていることを確認してください。

## 作成されるテストユーザー

- **依頼者1**: `customer1@example.com` / `password123`
- **依頼者2**: `customer2@example.com` / `password123`
- **ワーカー1**: `worker1@example.com` / `password123`
- **ワーカー2**: `worker2@example.com` / `password123`
- **ワーカー3**: `worker3@example.com` / `password123`
- **管理者**: `admin@kajishift.com` / `password123`

## トラブルシューティング

### エラー: "用語 'env:DATABASE_URL=...' は、コマンドレット...として認識されません"

**原因**: `$env:`の前に`$`（ドル記号）が抜けています。

**解決方法**: 正しい構文を使用してください：
```powershell
$env:DATABASE_URL="..."
```

### エラー: "DATABASE_URL環境変数が設定されていません"

**原因**: 環境変数が正しく設定されていません。

**解決方法**: 
1. `$env:DATABASE_URL`で現在の値を確認
2. 正しい構文で再設定

### エラー: "Prismaクライアントの生成に失敗しました"

**原因**: 依存関係がインストールされていない可能性があります。

**解決方法**:
```powershell
npm install
```

### エラー: "シードデータの投入に失敗しました"

**原因**: データベース接続エラーまたは権限の問題。

**解決方法**:
1. `DATABASE_URL`が正しいか確認
2. Renderのデータベースが正常に動作しているか確認
3. ネットワーク接続を確認

## 注意事項

- このスクリプトは既存のデータを**完全に削除**します
- 本番環境のデータを上書きするため、慎重に実行してください
- 実行後は、`.env`ファイルの`DATABASE_URL`をローカル開発用に戻してください

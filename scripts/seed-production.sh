#!/bin/bash
# 本番データベースにシードデータを投入するスクリプト（Git Bash用）
# 使用方法: export DATABASE_URL="<YOUR_DATABASE_URL>"; bash scripts/seed-production.sh

echo "========================================"
echo "本番データベース シードデータ投入スクリプト"
echo "========================================"
echo ""

# 警告メッセージ
echo "⚠️  警告: このスクリプトは本番データベースの既存データを削除します！"
echo ""

# DATABASE_URLの確認
if [ -z "$DATABASE_URL" ]; then
    echo "❌ エラー: DATABASE_URL環境変数が設定されていません"
    echo ""
    echo "以下の手順でDATABASE_URLを設定してください:"
    echo "1. Renderダッシュボードにアクセス"
    echo "2. kajishift-db（またはkajishift-postgres）を開く"
    echo "3. 「Connections」タブから「Internal Database URL」をコピー"
    echo "4. 以下のコマンドを実行:"
    echo '   export DATABASE_URL="<コピーしたURL>"; bash scripts/seed-production.sh'
    echo ""
    exit 1
fi

# DATABASE_URLの確認（本番環境かどうか）
if [[ ! "$DATABASE_URL" =~ "onrender.com" ]] && [[ ! "$DATABASE_URL" =~ "render.com" ]]; then
    echo "⚠️  警告: DATABASE_URLが本番環境（Render）のものではない可能性があります"
    echo "現在のDATABASE_URL: ${DATABASE_URL:0:50}..."
    echo ""
    read -p "続行しますか？ (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "❌ キャンセルされました"
        exit 1
    fi
fi

echo "✅ DATABASE_URLが設定されています"
echo ""

# プロジェクトルートに移動
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_ROOT"

echo "📁 プロジェクトルート: $PROJECT_ROOT"
echo ""

# Prismaクライアントの生成
echo "🔧 Prismaクライアントを生成中..."
npm run prisma:generate
if [ $? -ne 0 ]; then
    echo "❌ Prismaクライアントの生成に失敗しました"
    exit 1
fi

echo ""

# シードデータの投入
echo "🌱 シードデータを投入中..."
echo ""

npm run seed

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "✅ シードデータの投入が完了しました！"
    echo "========================================"
    echo ""
    echo "📋 作成されたテストユーザー:"
    echo "  依頼者1: customer1@example.com / password123"
    echo "  依頼者2: customer2@example.com / password123"
    echo "  ワーカー1: worker1@example.com / password123"
    echo "  ワーカー2: worker2@example.com / password123"
    echo "  ワーカー3: worker3@example.com / password123"
    echo "  管理者: admin@kajishift.com / password123"
    echo ""
    echo "🔍 確認方法:"
    echo "  https://kajishift-backend-production.up.railway.app/api/health/db"
    echo ""
else
    echo ""
    echo "❌ シードデータの投入に失敗しました"
    exit 1
fi

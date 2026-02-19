#!/bin/bash
# KAJISHIFT データベースセットアップスクリプト
# Linux/Mac用

echo "========================================"
echo "KAJISHIFT データベースセットアップ"
echo "========================================"
echo ""

# .envファイルの存在確認と作成
if [ ! -f ".env" ]; then
    echo "⚠️  .envファイルが見つかりません。"
    echo ""
    echo ".envファイルを自動作成しますか？"
    echo "（既存のデータベース接続情報がある場合は、後で手動で編集してください）"
    echo ""
    read -p "作成しますか？ (y/n) " create
    
    if [ "$create" = "y" ]; then
        cat > .env << 'EOF'
# サーバー設定
PORT=3000
NODE_ENV=development

# データベース（PostgreSQL）
# Dockerを使用する場合のデフォルト設定
DATABASE_URL="postgresql://postgres:password@localhost:5432/kajishift?schema=public"

# JWT認証
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# パスワードハッシュ
BCRYPT_ROUNDS=10

# CORS設定
CORS_ORIGIN=http://localhost:5500
EOF
        echo "✅ .envファイルを作成しました"
        echo "⚠️  データベース接続情報を確認・編集してください"
    else
        echo ""
        echo "以下の内容で.envファイルを手動で作成してください："
        echo ""
        echo "# サーバー設定"
        echo "PORT=3000"
        echo "NODE_ENV=development"
        echo ""
        echo "# データベース（PostgreSQL）"
        echo 'DATABASE_URL="postgresql://postgres:password@localhost:5432/kajishift?schema=public"'
        echo ""
        echo "# JWT認証"
        echo "JWT_SECRET=your-super-secret-jwt-key-change-this-in-production"
        echo "JWT_EXPIRES_IN=24h"
        echo ""
        echo "# パスワードハッシュ"
        echo "BCRYPT_ROUNDS=10"
        echo ""
        echo "# CORS設定"
        echo "CORS_ORIGIN=http://localhost:5500"
        echo ""
        echo "詳細は docs/DATABASE_SETUP.md を参照してください。"
        echo ""
        read -p "続行しますか？ (y/n) " continue
        if [ "$continue" != "y" ]; then
            exit
        fi
    fi
else
    echo "✅ .envファイルが見つかりました"
fi

echo ""
echo "データベースの準備方法を選択してください："
echo "1. Dockerを使用（推奨）"
echo "2. 既にPostgreSQLがセットアップ済み"
echo "3. クラウドサービスを使用"
echo ""
read -p "選択 (1-3): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "Dockerコンテナを起動します..."
    
    # Dockerがインストールされているか確認
    if ! command -v docker &> /dev/null; then
        echo "❌ Dockerがインストールされていません。"
        echo "Dockerをインストールしてください: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    echo "✅ Dockerが見つかりました"
    
    # 既存のコンテナを確認
    if docker ps -a --format '{{.Names}}' | grep -q "^kajishift-postgres$"; then
        echo "既存のコンテナが見つかりました。"
        read -p "起動しますか？ (y/n) " action
        if [ "$action" = "y" ]; then
            docker start kajishift-postgres
            echo "✅ コンテナを起動しました"
        fi
    else
        echo "新しいDockerコンテナを作成します..."
        docker run --name kajishift-postgres \
            -e POSTGRES_PASSWORD=password \
            -e POSTGRES_DB=kajishift \
            -p 5432:5432 \
            -d postgres:15
        
        if [ $? -eq 0 ]; then
            echo "✅ Dockerコンテナを作成しました"
            echo "   コンテナ名: kajishift-postgres"
            echo "   データベース: kajishift"
            echo "   ユーザー名: postgres"
            echo "   パスワード: password"
            echo "   ポート: 5432"
            echo ""
            echo "⚠️  .envファイルのDATABASE_URLを以下に設定してください："
            echo '   DATABASE_URL="postgresql://postgres:password@localhost:5432/kajishift?schema=public"'
            echo ""
            echo "データベースの初期化を待っています..."
            sleep 5
        else
            echo "❌ Dockerコンテナの作成に失敗しました"
            exit 1
        fi
    fi
fi

echo ""
echo "========================================"
echo "Prismaクライアントの生成"
echo "========================================"
echo ""

npm run prisma:generate

if [ $? -ne 0 ]; then
    echo "❌ Prismaクライアントの生成に失敗しました"
    exit 1
fi

echo ""
echo "✅ Prismaクライアントの生成が完了しました"
echo ""

echo "========================================"
echo "マイグレーションの実行"
echo "========================================"
echo ""
echo "マイグレーションを実行します..."
echo "マイグレーション名を入力してください（例: init）"
echo ""

npm run prisma:migrate

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "✅ データベースセットアップが完了しました！"
    echo "========================================"
    echo ""
    echo "次のステップ："
    echo "1. サーバーを起動: npm run dev"
    echo "2. Prisma Studioでデータベースを確認: npm run prisma:studio"
    echo "3. APIをテスト: curl http://localhost:3000/api/health"
    echo ""
else
    echo ""
    echo "❌ マイグレーションの実行に失敗しました"
    echo "docs/DATABASE_SETUP.mdのトラブルシューティングセクションを参照してください"
    exit 1
fi

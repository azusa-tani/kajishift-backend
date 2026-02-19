# KAJISHIFT データベースセットアップスクリプト
# Windows PowerShell用

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "KAJISHIFT データベースセットアップ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# .envファイルの存在確認と作成
if (-Not (Test-Path ".env")) {
    Write-Host "⚠️  .envファイルが見つかりません。" -ForegroundColor Yellow
    Write-Host ""
    Write-Host ".envファイルを自動作成しますか？" -ForegroundColor Yellow
    Write-Host "（既存のデータベース接続情報がある場合は、後で手動で編集してください）" -ForegroundColor Gray
    Write-Host ""
    $create = Read-Host "作成しますか？ (y/n)"
    
    if ($create -eq "y") {
        $envContent = @"
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
"@
        $envContent | Out-File -FilePath ".env" -Encoding utf8
        Write-Host "✅ .envファイルを作成しました" -ForegroundColor Green
        Write-Host "⚠️  データベース接続情報を確認・編集してください" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "以下の内容で.envファイルを手動で作成してください：" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "# サーバー設定" -ForegroundColor Gray
        Write-Host "PORT=3000" -ForegroundColor Gray
        Write-Host "NODE_ENV=development" -ForegroundColor Gray
        Write-Host "" -ForegroundColor Gray
        Write-Host "# データベース（PostgreSQL）" -ForegroundColor Gray
        Write-Host "DATABASE_URL=`"postgresql://postgres:password@localhost:5432/kajishift?schema=public`"" -ForegroundColor Gray
        Write-Host "" -ForegroundColor Gray
        Write-Host "# JWT認証" -ForegroundColor Gray
        Write-Host "JWT_SECRET=your-super-secret-jwt-key-change-this-in-production" -ForegroundColor Gray
        Write-Host "JWT_EXPIRES_IN=24h" -ForegroundColor Gray
        Write-Host "" -ForegroundColor Gray
        Write-Host "# パスワードハッシュ" -ForegroundColor Gray
        Write-Host "BCRYPT_ROUNDS=10" -ForegroundColor Gray
        Write-Host "" -ForegroundColor Gray
        Write-Host "# CORS設定" -ForegroundColor Gray
        Write-Host "CORS_ORIGIN=http://localhost:5500" -ForegroundColor Gray
        Write-Host ""
        Write-Host "詳細は docs/DATABASE_SETUP.md を参照してください。" -ForegroundColor Yellow
        Write-Host ""
        $continue = Read-Host "続行しますか？ (y/n)"
        if ($continue -ne "y") {
            exit
        }
    }
} else {
    Write-Host "✅ .envファイルが見つかりました" -ForegroundColor Green
}

Write-Host ""
Write-Host "データベースの準備方法を選択してください：" -ForegroundColor Cyan
Write-Host "1. Dockerを使用（推奨）" -ForegroundColor White
Write-Host "2. 既にPostgreSQLがセットアップ済み" -ForegroundColor White
Write-Host "3. クラウドサービスを使用" -ForegroundColor White
Write-Host ""
$choice = Read-Host "選択 (1-3)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "Dockerコンテナを起動します..." -ForegroundColor Cyan
    
    # Dockerがインストールされているか確認
    try {
        docker --version | Out-Null
        Write-Host "✅ Dockerが見つかりました" -ForegroundColor Green
    } catch {
        Write-Host "❌ Dockerがインストールされていません。" -ForegroundColor Red
        Write-Host "Docker Desktopをインストールしてください: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        exit 1
    }
    
    # 既存のコンテナを確認
    $existingContainer = docker ps -a --filter "name=kajishift-postgres" --format "{{.Names}}"
    
    if ($existingContainer -eq "kajishift-postgres") {
        Write-Host "既存のコンテナが見つかりました。" -ForegroundColor Yellow
        $action = Read-Host "起動しますか？ (y/n)"
        if ($action -eq "y") {
            docker start kajishift-postgres
            Write-Host "✅ コンテナを起動しました" -ForegroundColor Green
        }
    } else {
        Write-Host "新しいDockerコンテナを作成します..." -ForegroundColor Cyan
        docker run --name kajishift-postgres `
            -e POSTGRES_PASSWORD=password `
            -e POSTGRES_DB=kajishift `
            -p 5432:5432 `
            -d postgres:15
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Dockerコンテナを作成しました" -ForegroundColor Green
            Write-Host "   コンテナ名: kajishift-postgres" -ForegroundColor Gray
            Write-Host "   データベース: kajishift" -ForegroundColor Gray
            Write-Host "   ユーザー名: postgres" -ForegroundColor Gray
            Write-Host "   パスワード: password" -ForegroundColor Gray
            Write-Host "   ポート: 5432" -ForegroundColor Gray
            Write-Host ""
            Write-Host "⚠️  .envファイルのDATABASE_URLを以下に設定してください：" -ForegroundColor Yellow
            Write-Host '   DATABASE_URL="postgresql://postgres:password@localhost:5432/kajishift?schema=public"' -ForegroundColor Gray
            Write-Host ""
            Start-Sleep -Seconds 3
            Write-Host "データベースの初期化を待っています..." -ForegroundColor Cyan
            Start-Sleep -Seconds 5
        } else {
            Write-Host "❌ Dockerコンテナの作成に失敗しました" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Prismaクライアントの生成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm run prisma:generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prismaクライアントの生成に失敗しました" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Prismaクライアントの生成が完了しました" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "マイグレーションの実行" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "マイグレーションを実行します..." -ForegroundColor Cyan
Write-Host "マイグレーション名を入力してください（例: init）" -ForegroundColor Yellow
Write-Host ""

npm run prisma:migrate

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ データベースセットアップが完了しました！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "次のステップ：" -ForegroundColor Cyan
    Write-Host "1. サーバーを起動: npm run dev" -ForegroundColor White
    Write-Host "2. Prisma Studioでデータベースを確認: npm run prisma:studio" -ForegroundColor White
    Write-Host "3. APIをテスト: curl http://localhost:3000/api/health" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ マイグレーションの実行に失敗しました" -ForegroundColor Red
    Write-Host "docs/DATABASE_SETUP.mdのトラブルシューティングセクションを参照してください" -ForegroundColor Yellow
    exit 1
}

# 本番データベースにシードデータを投入するスクリプト（PowerShell用）
# 使用方法: 
#   $env:DATABASE_URL="<YOUR_DATABASE_URL>"; .\scripts\seed-production.ps1
# または
#   .\scripts\seed-production.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "本番データベース シードデータ投入スクリプト" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 警告メッセージ
Write-Host "⚠️  警告: このスクリプトは本番データベースの既存データを削除します！" -ForegroundColor Yellow
Write-Host ""

# DATABASE_URLの確認
$databaseUrl = $env:DATABASE_URL

if (-not $databaseUrl) {
    Write-Host "❌ エラー: DATABASE_URL環境変数が設定されていません" -ForegroundColor Red
    Write-Host ""
    Write-Host "以下の手順でDATABASE_URLを設定してください:" -ForegroundColor Yellow
    Write-Host "1. Renderダッシュボードにアクセス" -ForegroundColor Yellow
    Write-Host "2. kajishift-db（またはkajishift-postgres）を開く" -ForegroundColor Yellow
    Write-Host "3. 「Connections」タブから「Internal Database URL」をコピー" -ForegroundColor Yellow
    Write-Host "4. 以下のコマンドを実行:" -ForegroundColor Yellow
    Write-Host '   $env:DATABASE_URL="<コピーしたURL>"; .\scripts\seed-production.ps1' -ForegroundColor Green
    Write-Host ""
    Write-Host "例:" -ForegroundColor Yellow
    Write-Host '   $env:DATABASE_URL="postgresql://user:pass@host/db"; .\scripts\seed-production.ps1' -ForegroundColor Green
    Write-Host ""
    exit 1
}

# DATABASE_URLの確認（本番環境かどうか）
if ($databaseUrl -notmatch "onrender\.com" -and $databaseUrl -notmatch "render\.com") {
    Write-Host "⚠️  警告: DATABASE_URLが本番環境（Render）のものではない可能性があります" -ForegroundColor Yellow
    if ($databaseUrl.Length -gt 50) {
        $displayUrl = $databaseUrl.Substring(0, 50) + "..."
    } else {
        $displayUrl = $databaseUrl
    }
    Write-Host "現在のDATABASE_URL: $displayUrl" -ForegroundColor Yellow
    Write-Host ""
    $confirm = Read-Host "続行しますか？ (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "❌ キャンセルされました" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ DATABASE_URLが設定されています" -ForegroundColor Green
Write-Host ""

# プロジェクトルートに移動
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

Write-Host "📁 プロジェクトルート: $projectRoot" -ForegroundColor Cyan
Write-Host ""

# Prismaクライアントの生成
Write-Host "🔧 Prismaクライアントを生成中..." -ForegroundColor Cyan
$generateResult = & npm run prisma:generate 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prismaクライアントの生成に失敗しました" -ForegroundColor Red
    Write-Host $generateResult
    exit 1
}

Write-Host ""

# シードデータの投入
Write-Host "🌱 シードデータを投入中..." -ForegroundColor Cyan
Write-Host ""

$seedResult = & npm run seed 2>&1
$seedExitCode = $LASTEXITCODE

if ($seedExitCode -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ シードデータの投入が完了しました！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 作成されたテストユーザー:" -ForegroundColor Cyan
    Write-Host "  依頼者1: customer1@example.com / password123" -ForegroundColor White
    Write-Host "  依頼者2: customer2@example.com / password123" -ForegroundColor White
    Write-Host "  ワーカー1: worker1@example.com / password123" -ForegroundColor White
    Write-Host "  ワーカー2: worker2@example.com / password123" -ForegroundColor White
    Write-Host "  ワーカー3: worker3@example.com / password123" -ForegroundColor White
    Write-Host "  管理者: admin@kajishift.com / password123" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 確認方法:" -ForegroundColor Cyan
    Write-Host "  https://kajishift-backend-production.up.railway.app/api/health/db" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ シードデータの投入に失敗しました" -ForegroundColor Red
    Write-Host $seedResult
    exit 1
}

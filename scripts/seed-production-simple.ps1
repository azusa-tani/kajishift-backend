# 本番データベースにシードデータを投入するスクリプト（シンプル版）
# 使用方法: $env:DATABASE_URL="<YOUR_DATABASE_URL>"; .\scripts\seed-production-simple.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "本番データベース シードデータ投入スクリプト" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "警告: このスクリプトは本番データベースの既存データを削除します！" -ForegroundColor Yellow
Write-Host ""

if (-not $env:DATABASE_URL) {
    Write-Host "エラー: DATABASE_URL環境変数が設定されていません" -ForegroundColor Red
    Write-Host ""
    Write-Host "以下のコマンドを実行してください:" -ForegroundColor Yellow
    Write-Host '  $env:DATABASE_URL="<YOUR_DATABASE_URL>"; .\scripts\seed-production-simple.ps1' -ForegroundColor Green
    Write-Host ""
    exit 1
}

Write-Host "DATABASE_URLが設定されています" -ForegroundColor Green
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

Write-Host "プロジェクトルート: $projectRoot" -ForegroundColor Cyan
Write-Host ""

Write-Host "Prismaクライアントを生成中..." -ForegroundColor Cyan
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Prismaクライアントの生成に失敗しました" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "シードデータを投入中..." -ForegroundColor Cyan
Write-Host ""

npm run seed

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "シードデータの投入が完了しました！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "作成されたテストユーザー:" -ForegroundColor Cyan
    Write-Host "  依頼者1: customer1@example.com / password123"
    Write-Host "  依頼者2: customer2@example.com / password123"
    Write-Host "  ワーカー1: worker1@example.com / password123"
    Write-Host "  ワーカー2: worker2@example.com / password123"
    Write-Host "  ワーカー3: worker3@example.com / password123"
    Write-Host "  管理者: admin@kajishift.com / password123"
    Write-Host ""
    Write-Host "確認方法: https://kajishift-api.onrender.com/api/health/db"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "シードデータの投入に失敗しました" -ForegroundColor Red
    exit 1
}

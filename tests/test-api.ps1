# KAJISHIFT API テストスクリプト
# PowerShell用

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "KAJISHIFT API テスト" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api"

# 1. ヘルスチェック
Write-Host "1. ヘルスチェック" -ForegroundColor Yellow
Write-Host "   GET $baseUrl/health" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "   ✅ 成功" -ForegroundColor Green
    Write-Host "   レスポンス: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ エラー: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 2. ユーザー登録
Write-Host "2. ユーザー登録" -ForegroundColor Yellow
Write-Host "   POST $baseUrl/auth/register" -ForegroundColor Gray
$registerData = @{
    email = "test@example.com"
    password = "password123"
    name = "テストユーザー"
    role = "CUSTOMER"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerData -ContentType "application/json"
    Write-Host "   ✅ 成功" -ForegroundColor Green
    Write-Host "   ユーザーID: $($response.data.user.id)" -ForegroundColor Gray
    Write-Host "   メール: $($response.data.user.email)" -ForegroundColor Gray
    Write-Host "   名前: $($response.data.user.name)" -ForegroundColor Gray
    $token = $response.data.token
    Write-Host "   JWTトークン取得: ✅" -ForegroundColor Green
} catch {
    Write-Host "   ❌ エラー: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   詳細: $responseBody" -ForegroundColor Red
    }
    $token = $null
}
Write-Host ""

# 3. ログイン
Write-Host "3. ログイン" -ForegroundColor Yellow
Write-Host "   POST $baseUrl/auth/login" -ForegroundColor Gray
$loginData = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginData -ContentType "application/json"
    Write-Host "   ✅ 成功" -ForegroundColor Green
    Write-Host "   ユーザーID: $($response.data.user.id)" -ForegroundColor Gray
    Write-Host "   メール: $($response.data.user.email)" -ForegroundColor Gray
    $token = $response.data.token
    Write-Host "   JWTトークン取得: ✅" -ForegroundColor Green
} catch {
    Write-Host "   ❌ エラー: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   詳細: $responseBody" -ForegroundColor Red
    }
    $token = $null
}
Write-Host ""

# 4. 現在のユーザー情報取得（認証必須）
if ($token) {
    Write-Host "4. 現在のユーザー情報取得（認証必須）" -ForegroundColor Yellow
    Write-Host "   GET $baseUrl/auth/me" -ForegroundColor Gray
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $headers
        Write-Host "   ✅ 成功" -ForegroundColor Green
        Write-Host "   ユーザーID: $($response.data.id)" -ForegroundColor Gray
        Write-Host "   メール: $($response.data.email)" -ForegroundColor Gray
        Write-Host "   名前: $($response.data.name)" -ForegroundColor Gray
        Write-Host "   ロール: $($response.data.role)" -ForegroundColor Gray
    } catch {
        Write-Host "   ❌ エラー: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "   詳細: $responseBody" -ForegroundColor Red
        }
    }
} else {
    Write-Host "4. 現在のユーザー情報取得（認証必須）" -ForegroundColor Yellow
    Write-Host "   ⚠️  スキップ（トークンが取得できませんでした）" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ APIテスト完了" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

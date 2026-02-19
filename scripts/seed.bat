@echo off
chcp 65001 >nul
cd /d "%~dp0\.."
echo ========================================
echo KAJISHIFT テストデータ作成
echo ========================================
echo.
node prisma/seed.js
echo.
pause

@echo off
chcp 65001 > nul
echo.
echo ============================================
echo   介護施設生活記録アプリ　アップデート
echo ============================================
echo.
echo アプリを使っていない時間帯に行ってください。
echo.

cd /d C:\care-home-records

echo [1/4] 最新版を取得しています...
git pull
if %errorlevel% neq 0 (
    echo 【エラー】取得に失敗しました。インターネット接続を確認してください。
    pause
    exit /b 1
)

echo.
echo [2/4] パッケージを確認しています...
call npm install

echo.
echo [3/4] データベースクライアントを更新しています...
call npx prisma generate

echo.
echo [4/4] データベースを更新しています...
call npx prisma migrate deploy

echo.
echo ============================================
echo   アップデートが完了しました！
echo.
echo   「生活記録アプリ起動」でアプリを
echo   再起動してください。
echo ============================================
echo.
pause

@echo off
chcp 65001 > nul
echo.
echo ============================================
echo   生活記録アプリ　更新
echo ============================================
echo.

cd /d C:\care-home-records

echo [1/3] 最新版を取得しています...
git pull

echo [2/3] パッケージを確認しています...
npm install

echo [3/3] データベースを更新しています...
npx prisma migrate deploy

echo.
echo ============================================
echo   更新完了しました！
echo   アプリを再起動してください。
echo ============================================
echo.
pause

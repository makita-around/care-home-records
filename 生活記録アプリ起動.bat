@echo off
title 生活記録アプリ 起動中...

:: ポート3002を解放
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| find ":3002" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 1 /nobreak >nul

:: ビルド＆本番サーバー起動
echo ビルド中...（しばらくお待ちください）
cd /d C:\care-home-records
call npm run build >nul 2>&1

:: バックグラウンドで本番サーバー起動
start "" /B cmd /c "cd /d C:\care-home-records && npm run start -- --hostname 0.0.0.0 --port 3002 >nul 2>&1"

:: 5秒待ってからブラウザを開く
echo サーバー起動中...（5秒お待ちください）
timeout /t 5 /nobreak >nul

start "" "http://localhost:3002"

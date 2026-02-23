@echo off
chcp 65001 > nul
echo.
echo ============================================
echo   生活記録アプリ　GitHub送信
echo ============================================
echo.

cd /d C:\Users\user\claude_projects\care-home-records

:: 変更確認
for /f %%i in ('git status --short ^| find /c /v ""') do set CHANGES=%%i
if "%CHANGES%"=="0" (
    echo 変更されたファイルはありません。
    echo 送信するものがないため終了します。
    echo.
    pause
    exit /b 0
)

echo 変更されたファイル：
git status --short
echo.

:: コメント入力
set /p MEMO="変更内容のメモを入力してください（例：バイタル入力を修正）: "
if "%MEMO%"=="" set MEMO=更新

echo.
echo [1/3] ファイルを準備しています...
git add .

echo [2/3] 変更内容を記録しています...
git commit -m "%MEMO%"

echo [3/3] GitHubに送信しています...
git push

if %errorlevel% neq 0 (
    echo.
    echo 【エラー】送信に失敗しました。
    echo インターネットに接続されているか確認してください。
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   送信完了しました！
echo ============================================
echo.
pause

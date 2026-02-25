content = """\
@echo off
echo.
echo ============================================
echo   GitHub Send (Care Home Records App)
echo ============================================
echo.

cd /d C:\\Users\\user\\claude_projects\\care-home-records

git status --short > "%TEMP%\\gitstatus.tmp" 2>&1
set CHANGES=0
for %%F in ("%TEMP%\\gitstatus.tmp") do if %%~zF gtr 0 set CHANGES=1
del "%TEMP%\\gitstatus.tmp" 2>nul

if "%CHANGES%"=="0" (
    echo No changes. Nothing to send.
    echo.
    pause
    exit /b 0
)

echo Changed files:
git status --short
echo.

set /p MEMO="Enter memo (e.g. fixed login): "
if "%MEMO%"=="" set MEMO=update

echo.
echo [1/3] Staging files...
git add .

echo [2/3] Committing...
git commit -m "%MEMO%"

echo [3/3] Pushing to GitHub...
git push

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Push failed. Check internet connection.
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Done! Sent to GitHub successfully.
echo   Tell the facility to run update.bat
echo ============================================
echo.
pause
"""

import os
bat_path = os.path.join(os.path.dirname(__file__), "GitHub\u9001\u4fe1.bat")
with open(bat_path, "w", encoding="ascii") as f:
    f.write(content)
print("OK:", bat_path)

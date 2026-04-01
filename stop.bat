@echo off
title Mission Control — Stop
color 0C

echo.
echo  [*] Stopping Mission Control server...
echo.

:: Find and kill process on port 3000
set FOUND=0
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    set FOUND=1
    echo  [+] Found server on port 3000 — PID %%p
    taskkill /PID %%p /F >nul 2>&1
    if %errorlevel%==0 (
        echo  [+] Server stopped successfully.
    ) else (
        echo  [!] Failed to kill PID %%p — try running as Administrator.
    )
)

if "%FOUND%"=="0" (
    echo  [!] No server found running on port 3000.
)

echo.
timeout /t 2 /nobreak >nul
exit /b

@echo off
title Mission Control — Server
color 0A

echo.
echo  ███╗   ███╗██╗███████╗███████╗██╗ ██████╗ ███╗   ██╗
echo  ████╗ ████║██║██╔════╝██╔════╝██║██╔═══██╗████╗  ██║
echo  ██╔████╔██║██║███████╗███████╗██║██║   ██║██╔██╗ ██║
echo  ██║╚██╔╝██║██║╚════██║╚════██║██║██║   ██║██║╚██╗██║
echo  ██║ ╚═╝ ██║██║███████║███████║██║╚██████╔╝██║ ╚████║
echo  ╚═╝     ╚═╝╚═╝╚══════╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
echo                        CONTROL
echo.

:: ── Ollama ─────────────────────────────────────────────────────────────────
echo  [*] Checking Ollama...
curl -s --max-time 2 http://127.0.0.1:11434 >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Ollama not running — starting it...
    start "" "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" serve
    :: Wait up to 10s for Ollama to come up
    set OLLAMA_UP=0
    for /l %%i in (1,1,10) do (
        timeout /t 1 /nobreak >nul
        curl -s --max-time 1 http://127.0.0.1:11434 >nul 2>&1
        if !errorlevel!==0 (
            set OLLAMA_UP=1
            goto :ollama_ready
        )
    )
    :ollama_ready
    if "!OLLAMA_UP!"=="1" (
        echo  [+] Ollama is up.
    ) else (
        echo  [!] Ollama didn't respond in time — continuing anyway.
    )
) else (
    echo  [+] Ollama already running.
)
echo.

:: ── Port check ─────────────────────────────────────────────────────────────
netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo  [!] Port 3000 is already in use.
    set /p KILL="  Kill existing server and restart? [Y/N]: "
    if /i "!KILL!"=="Y" (
        call :kill_port
        timeout /t 1 /nobreak >nul
    ) else (
        echo  [x] Aborted.
        pause
        exit /b 1
    )
)

:: ── Env check ──────────────────────────────────────────────────────────────
if not exist ".env.local" (
    echo  [!] WARNING: .env.local not found — server may fail to start.
    echo.
)

:: ── Launch ─────────────────────────────────────────────────────────────────
echo  [*] Starting Mission Control on http://localhost:3000
echo  [*] Press Ctrl+C to stop.
echo.

setlocal enabledelayedexpansion
node server.js
if %errorlevel% neq 0 (
    echo.
    echo  [x] Server crashed with exit code %errorlevel%.
    pause
)
exit /b

:kill_port
echo  [*] Killing process on port 3000...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%p /F >nul 2>&1
    echo  [+] Killed PID %%p
)
goto :eof

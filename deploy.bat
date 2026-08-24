@echo off
setlocal enabledelayedexpansion

set "ROOT=%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"

echo ============================================
echo  Telur Tracker - Deploy
echo ============================================

echo.
echo [1/4] Installing frontend dependencies...
cd /d "%ROOT%frontend"
call npm install
if errorlevel 1 (
    echo Frontend dependency install failed.
    exit /b 1
)

echo.
echo [2/4] Building frontend...
call npm run build
if errorlevel 1 (
    echo Frontend build failed.
    exit /b 1
)

echo.
echo [3/4] Installing backend dependencies...
cd /d "%ROOT%backend"
if not exist ".venv" (
    python -m venv .venv
)
call .venv\Scripts\python -m pip install -r requirements.txt -q
if errorlevel 1 (
    echo Backend dependency install failed.
    exit /b 1
)

echo.
echo [4/4] Stopping any server already running on port 8001...
for /f "tokens=5" %%P in ('%SystemRoot%\System32\netstat.exe -ano ^| %SystemRoot%\System32\findstr.exe :8001 ^| %SystemRoot%\System32\findstr.exe LISTENING') do (
    echo   Killing existing process %%P
    %SystemRoot%\System32\taskkill.exe /F /PID %%P >nul 2>&1
)

echo.
echo ============================================
echo  Starting server on http://0.0.0.0:8001
echo  Press Ctrl+C to stop.
echo ============================================
cd /d "%ROOT%"
backend\.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --app-dir backend

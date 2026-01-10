@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Color settings
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "PURPLE=[95m"
set "CYAN=[96m"
set "NC=[0m"

:: Port configuration
set "BACKEND_PORT=3001"
set "FRONTEND_PORT=3100"

echo.
echo %PURPLE%╔════════════════════════════════════════╗%NC%
echo %PURPLE%║      AiNote Quick Start 🚀            ║%NC%
echo %PURPLE%╚════════════════════════════════════════╝%NC%
echo.

:: Create log directory
if not exist "logs" mkdir logs

:: Kill existing processes (with retries)
echo %YELLOW%[Step 1/3] Stopping existing services...%NC%
echo.

:: Kill backend
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%BACKEND_PORT% " ^| findstr "LISTENING" 2^>nul') do (
    echo Stopping backend process %%a
    taskkill /F /PID %%a >nul 2>&1
)

:: Kill frontend
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%FRONTEND_PORT% " ^| findstr "LISTENING" 2^>nul') do (
    echo Stopping frontend process %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo %GREEN%OK Ports cleared%NC%
timeout /t 2 /nobreak >nul

:: Start backend
echo.
echo %BLUE%[Step 2/3] Starting backend service...%NC%
cd packages\backend
start /b cmd /c "pnpm run dev > ..\..\logs\backend.log 2>&1"
echo %GREEN%OK Backend starting...%NC%
cd ..\..
echo    Waiting for backend to be ready...
timeout /t 6 /nobreak >nul

:: Verify backend is actually running
echo    Verifying backend startup...
for /L %%i in (1,1,5) do (
    netstat -ano | findstr ":%BACKEND_PORT% " | findstr "LISTENING" >nul
    if !errorlevel! equ 0 (
        echo %GREEN%OK Backend confirmed running%NC%
        goto :backend_ready
    )
    echo    Still waiting... (attempt %%i/5)
    timeout /t 2 /nobreak >nul
)
:backend_ready

:: Start frontend
echo.
echo %BLUE%[Step 3/3] Starting frontend service...%NC%
cd packages\frontend
start /b cmd /c "pnpm run dev --host 0.0.0.0 --port %FRONTEND_PORT% > ..\..\logs\frontend.log 2>&1"
echo %GREEN%OK Frontend starting...%NC%
cd ..\..
echo    Waiting for frontend to be ready...
timeout /t 6 /nobreak >nul

:: Verify frontend is actually running
echo    Verifying frontend startup...
for /L %%i in (1,1,5) do (
    netstat -ano | findstr ":%FRONTEND_PORT% " | findstr "LISTENING" >nul
    if !errorlevel! equ 0 (
        echo %GREEN%OK Frontend confirmed running%NC%
        goto :frontend_ready
    )
    echo    Still waiting... (attempt %%i/5)
    timeout /t 2 /nobreak >nul
)
:frontend_ready

:: Final status check
echo.
echo %CYAN%Final service status check...%NC%

netstat -ano | findstr ":%BACKEND_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo %GREEN%OK Backend is running on port %BACKEND_PORT%%NC%
) else (
    echo %RED%X Backend failed to start%NC%
    echo    Check logs: logs\backend.log
)

netstat -ano | findstr ":%FRONTEND_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo %GREEN%OK Frontend is running on port %FRONTEND_PORT%%NC%
) else (
    echo %RED%X Frontend failed to start%NC%
    echo    Check logs: logs\frontend.log
)

echo.
echo %GREEN%╔════════════════════════════════════════╗%NC%
echo %GREEN%║      Services Started! 🎉             ║%NC%
echo %GREEN%╚════════════════════════════════════════╝%NC%
echo.
echo %CYAN%Local Access:%NC%
echo    Frontend: %CYAN%http://localhost:%FRONTEND_PORT%%NC%
echo    Backend:  %CYAN%http://localhost:%BACKEND_PORT%%NC%
echo.
echo %YELLOW%Demo Account:%NC%
echo    Email: %CYAN%demo@ainote.com%NC%
echo    Password: %CYAN%demo123456%NC%
echo.
echo %PURPLE%Log Files:%NC%
echo    Backend:  logs\backend.log
echo    Frontend: logs\frontend.log
echo.
echo %YELLOW%Tips:%NC%
echo    Press Ctrl+C in this window to stop services
echo    Or use stop.bat to stop all services
echo.

pause

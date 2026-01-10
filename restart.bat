@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set "BACKEND_PORT=3001"
set "FRONTEND_PORT=3100"

echo.
echo ========================================
echo       AiNote Restart Script
echo ========================================
echo.

if not exist "logs" mkdir logs

echo [1/3] Stopping services on ports %BACKEND_PORT% and %FRONTEND_PORT%...
echo.

echo Checking port %BACKEND_PORT%...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%BACKEND_PORT% " ^| findstr "LISTENING"') do (
    echo Killing process %%a on port %BACKEND_PORT%...
    taskkill /F /PID %%a >nul 2>&1
)

echo Checking port %FRONTEND_PORT%...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%FRONTEND_PORT% " ^| findstr "LISTENING"') do (
    echo Killing process %%a on port %FRONTEND_PORT%...
    taskkill /F /PID %%a >nul 2>&1
)

echo Ports cleared
echo.
ping -n 3 127.0.0.1 >nul

echo [2/3] Starting backend service...
echo.

cd packages\backend

if not exist ".env" (
    if exist ".env.example" (
        echo Creating .env from .env.example...
        copy /Y .env.example .env >nul
    )
)

if not exist "..\..\node_modules\@prisma\client" (
    echo Generating Prisma Client...
    call npx prisma generate >..\..\logs\prisma.log 2>&1
)

echo Starting backend service (port %BACKEND_PORT%)...
start /b cmd /c "pnpm run dev > ..\..\logs\backend.log 2>&1"

echo Waiting for backend to start...
set /a "wait_count=0"
:backend_wait
ping -n 2 127.0.0.1 >nul
set /a "wait_count+=1"
netstat -ano | findstr ":%BACKEND_PORT% " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo Backend service started successfully!
    goto backend_ok
)
if !wait_count! lss 10 goto backend_wait

echo Warning: Backend service may still be starting...

:backend_ok
cd ..\..

echo.
echo [3/3] Starting frontend service...
echo.

cd packages\frontend

if not exist ".env" (
    echo Creating frontend .env file...
    echo VITE_API_BASE_URL=http://localhost:%BACKEND_PORT% > .env
)

echo Starting frontend service (port %FRONTEND_PORT%)...
start /b cmd /c "pnpm run dev --host 0.0.0.0 --port %FRONTEND_PORT% > ..\..\logs\frontend.log 2>&1"

echo Waiting for frontend to start...
set /a "wait_count=0"
:frontend_wait
ping -n 2 127.0.0.1 >nul
set /a "wait_count+=1"
netstat -ano | findstr ":%FRONTEND_PORT% " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo Frontend service started successfully!
    goto frontend_ok
)
if !wait_count! lss 8 goto frontend_wait

echo Frontend service may still be starting...

:frontend_ok
cd ..\..

echo.
echo ========================================
echo       Services Started Successfully!
echo ========================================
echo.
echo Access URLs:
echo   Frontend: http://localhost:%FRONTEND_PORT%
echo   Backend:  http://localhost:%BACKEND_PORT%
echo.
echo Demo Account:
echo   Email: demo@ainote.com
echo   Password: demo123456
echo.
echo Log Files:
echo   Backend: logs\backend.log
echo   Frontend: logs\frontend.log
echo.
echo Use stop.bat to stop all services
echo.
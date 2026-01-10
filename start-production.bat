@echo off
REM ====================================================
REM AiNote Production Deployment Script
REM ====================================================
echo.
echo ========================================
echo AiNote Production Deployment
echo ========================================
echo.

REM 设置项目根目录
set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

echo [1/6] Checking prerequisites...
echo.

REM 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM 检查 pnpm
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] pnpm not found, installing...
    npm install -g pnpm
)

echo [2/6] Installing dependencies...
echo.
cd packages\backend
call pnpm install --frozen-lockfile
if %errorlevel% neq 0 (
    echo [ERROR] Backend dependencies installation failed
    pause
    exit /b 1
)

cd ..\frontend
call pnpm install --frozen-lockfile
if %errorlevel% neq 0 (
    echo [ERROR] Frontend dependencies installation failed
    pause
    exit /b 1
)

echo [3/6] Building backend...
echo.
cd ..\backend
call pnpm build
if %errorlevel% neq 0 (
    echo [ERROR] Backend build failed
    pause
    exit /b 1
)

REM 生成 Prisma Client
call pnpm prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] Prisma generate failed
    pause
    exit /b 1
)

echo [4/6] Building frontend...
echo.
cd ..\frontend
set VITE_API_BASE_URL=http://localhost:3001
call pnpm build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed
    pause
    exit /b 1
)

echo [5/6] Stopping existing services...
echo.
REM 停止现有的 PM2 进程
call pm2 delete ainote-backend 2>nul
call pm2 delete ainote-frontend 2>nul

echo [6/6] Starting production services...
echo.

REM 启动后端
cd ..\backend
call pm2 start dist/index.js --name ainote-backend --env production
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start backend
    pause
    exit /b 1
)

REM 保存 PM2 配置
call pm2 save
call pm2 list

echo.
echo ========================================
echo Production Deployment Complete!
echo ========================================
echo.
echo Backend API: http://localhost:3001
echo Frontend: Use the built static files in packages/frontend/dist
echo.
echo To view logs:
echo   pm2 logs ainote-backend
echo.
echo To stop services:
echo   pm2 stop ainote-backend
echo.
echo To restart services:
echo   pm2 restart ainote-backend
echo.
pause

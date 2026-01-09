@echo off
REM ====================================================
REM Simple Frontend Server for Production Build
REM ====================================================
echo.
echo Starting AiNote Frontend (Production Mode)...
echo.

cd packages\frontend

REM 检查是否已构建
if not exist "dist\index.html" (
    echo [INFO] Frontend not built yet. Building now...
    call pnpm build
    if %errorlevel% neq 0 (
        echo [ERROR] Build failed
        pause
        exit /b 1
    )
)

REM 使用 Python 启动简单的 HTTP 服务器（大多数 Windows 都有）
where python >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Starting Python HTTP server on port 3100...
    echo Frontend will be available at: http://localhost:3100
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    python -m http.server 3100 --directory dist
    goto :end
)

REM 如果没有 Python，尝试使用 Node.js http-server
where npx >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Starting http-server on port 3100...
    echo Frontend will be available at: http://localhost:3100
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    npx http-server dist -p 3100
    goto :end
)

echo [ERROR] No HTTP server found. Please install Python or Node.js.
echo.
echo Alternative: Use IIS or Nginx to serve the dist folder
pause

:end

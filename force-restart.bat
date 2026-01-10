@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: 颜色设置
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "PURPLE=[95m"
set "NC=[0m"

echo.
echo %PURPLE%╔════════════════════════════════════════╗%NC%
echo %PURPLE%║    强制重启后端服务 🔧               ║%NC%
echo %PURPLE%╚════════════════════════════════════════╝%NC%
echo.

:: 1. 停止所有 Node 进程
echo %YELLOW%[步骤 1/3] 停止所有 Node 进程...%NC%

:: 查找并杀死所有 node.exe 进程
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /c "node.exe" >nul
if %errorlevel% equ 0 (
    echo %RED%发现 Node 进程正在运行,正在停止...%NC%
    taskkill /F /IM node.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
    echo %GREEN%✓ 所有 Node 进程已停止%NC%
) else (
    echo %BLUE%没有发现运行中的 Node 进程%NC%
)

echo.

:: 2. 验证端口已释放
echo %YELLOW%[步骤 2/3] 验证端口已释放...%NC%

netstat -ano | findstr ":3001 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo %RED%⚠ 端口 3001 仍被占用,尝试再次清理...%NC%
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 " ^| findstr "LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
)

netstat -ano | findstr ":3100 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo %RED%⚠ 端口 3100 仍被占用,尝试再次清理...%NC%
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3100 " ^| findstr "LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
)

echo %GREEN%✓ 端口已全部释放%NC%
echo.

:: 3. 启动后端服务
echo %YELLOW%[步骤 3/3] 启动后端服务...%NC%

cd packages\backend

:: 检查 .env 文件
if not exist ".env" (
    echo %RED%错误: .env 文件不存在%NC%
    pause
    exit /b 1
)

:: 显示当前加密密钥信息
findstr /C:"ENCRYPTION_KEY=" .env
echo.

echo %GREEN%启动后端服务 (端口 3001)...%NC%
echo.
echo %BLUE%后端启动后将显示以下信息:%NC%
echo   - 🔑 ENCRYPTION_KEY found, length: 64 characters
echo   - ✅ ENCRYPTION_KEY format is correct
echo   - 🚀 Server ready at http://0.0.0.0:3001
echo.

start "AiNote-Backend" cmd /k "npm run dev"

:: 等待后端启动
echo %YELLOW%等待后端服务启动...%NC%
timeout /t 5 /nobreak >nul

echo.
echo %GREEN%╔════════════════════════════════════════╗%NC%
echo %GREEN%║   后端服务已启动! 🎉                  ║%NC%
echo %GREEN%╚════════════════════════════════════════╝%NC%
echo.
echo %BLUE%📝 验证步骤:%NC%
echo   1. 检查后端窗口是否显示 "✅ ENCRYPTION_KEY format is correct"
echo   2. 运行测试: node check-backend-status.js
echo   3. 在浏览器中测试创建模型配置
echo.

pause

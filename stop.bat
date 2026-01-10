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

:: 端口配置
set "BACKEND_PORT=3001"
set "FRONTEND_PORT=3100"

echo.
echo %PURPLE%╔════════════════════════════════════════╗%NC%
echo %PURPLE%║      AiNote 停止脚本 ⏹                ║%NC%
echo %PURPLE%╚════════════════════════════════════════╝%NC%
echo.

:: 停止后端服务
echo %YELLOW%[1/2] 停止后端服务...%NC%
call :kill_port %BACKEND_PORT% "后端服务"

:: 停止前端服务
echo.
echo %YELLOW%[2/2] 停止前端服务...%NC%
call :kill_port %FRONTEND_PORT% "前端服务"

:: 清理 PID 文件
if exist "logs\backend.pid" del /f "logs\backend.pid" >nul 2>&1
if exist "logs\frontend.pid" del /f "logs\frontend.pid" >nul 2>&1

echo.
echo %GREEN%╔════════════════════════════════════════╗%NC%
echo %GREEN%║      所有服务已停止 ✅                 ║%NC%
echo %GREEN%╚════════════════════════════════════════╝%NC%
echo.
goto :eof

:: ==================== 函数定义 ====================

:: 通过端口杀死进程
:kill_port
set "port=%~1"
set "name=%~2"

echo %YELLOW%检查端口 %port%...%NC%

:: 查找占用端口的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%port% " ^| findstr "LISTENING" 2^>nul') do (
    set "pid=%%a"
    goto :kill_pid
)

echo %BLUE%端口 %port% 未被占用%NC%
goto :eof

:kill_pid
echo %RED%发现端口 %port% 被进程 !pid! 占用%NC%
echo %YELLOW%正在终止进程...%NC%
taskkill /F /PID !pid! >nul 2>&1
if !errorlevel! equ 0 (
    echo %GREEN%✓ %name% 已停止%NC%
) else (
    echo %YELLOW%⚠ 进程 !pid! 可能已关闭%NC%
)
timeout /t 1 /nobreak >nul
goto :eof

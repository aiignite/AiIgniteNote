@echo off
echo ========================================
echo 安装 AI Note 后端为 Windows 服务
echo ========================================

REM 检查是否以管理员身份运行
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 错误: 请以管理员身份运行此脚本
    pause
    exit /b 1
)

set "SERVICE_NAME=AiNoteBackend"
set "SERVICE_DISPLAY_NAME=AI Note Backend Service"
set "SERVICE_PATH=C:\Services\AiNote\Backend"
set "NODE_PATH=C:\Program Files\nodejs\node.exe"

echo.
echo 1. 检查Node.js安装...
if not exist "%NODE_PATH%" (
    echo 错误: 未找到Node.js，请确保Node.js已安装在默认位置
    echo 或修改脚本中的NODE_PATH变量
    pause
    exit /b 1
)
echo ✓ Node.js路径: %NODE_PATH%

echo.
echo 2. 检查后端文件...
if not exist "%SERVICE_PATH%\dist\index.js" (
    echo 错误: 后端文件不存在，请先运行部署脚本
    pause
    exit /b 1
)
echo ✓ 后端文件检查完成

echo.
echo 3. 检查是否已存在服务...
sc query "%SERVICE_NAME%" >nul 2>&1
if %errorLevel% equ 0 (
    echo 服务已存在，正在停止并删除...
    sc stop "%SERVICE_NAME%"
    timeout /t 3 /nobreak >nul
    sc delete "%SERVICE_NAME%"
    timeout /t 2 /nobreak >nul
)

echo.
echo 4. 创建Windows服务...
sc create "%SERVICE_NAME%" ^
    binPath= "\"%NODE_PATH%\" \"%SERVICE_PATH%\dist\index.js\"" ^
    DisplayName= "%SERVICE_DISPLAY_NAME%" ^
    start= auto ^
    depend= "HTTP"

if %errorLevel% neq 0 (
    echo 错误: 创建服务失败
    pause
    exit /b 1
)

echo.
echo 5. 配置服务描述...
sc description "%SERVICE_NAME%" "AI Note应用程序后端API服务"

echo.
echo 6. 配置服务恢复选项...
sc failure "%SERVICE_NAME%" reset= 86400 actions= restart/5000/restart/5000/restart/5000

echo.
echo 7. 启动服务...
sc start "%SERVICE_NAME%"

if %errorLevel% neq 0 (
    echo 警告: 服务启动失败，请检查配置和日志
) else (
    echo ✓ 服务启动成功
)

echo.
echo ========================================
echo 服务安装完成！
echo ========================================
echo.
echo 服务名称: %SERVICE_NAME%
echo 显示名称: %SERVICE_DISPLAY_NAME%
echo 服务路径: %SERVICE_PATH%
echo.
echo 管理命令:
echo - 启动服务: sc start %SERVICE_NAME%
echo - 停止服务: sc stop %SERVICE_NAME%
echo - 查看状态: sc query %SERVICE_NAME%
echo - 删除服务: sc delete %SERVICE_NAME%
echo.
echo 注意: 请确保在 %SERVICE_PATH% 目录中配置正确的 .env 文件
echo.
pause
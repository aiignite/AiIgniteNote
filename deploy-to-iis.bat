@echo off
echo ========================================
echo AI Note 生产部署脚本 - IIS版本
echo ========================================

REM 设置变量
set "SOURCE_DIR=%~dp0packages\frontend\dist"
set "BACKEND_DIR=%~dp0packages\backend"
set "IIS_SITE_PATH=C:\inetpub\wwwroot\ainote"
set "BACKEND_SERVICE_PATH=C:\Services\AiNote\Backend"

echo.
echo 1. 检查构建文件...
if not exist "%SOURCE_DIR%\index.html" (
    echo 错误: 前端构建文件不存在，请先运行构建命令
    echo 运行: pnpm run build
    pause
    exit /b 1
)

if not exist "%BACKEND_DIR%\dist\index.js" (
    echo 错误: 后端构建文件不存在，请先运行构建命令
    echo 运行: pnpm run build
    pause
    exit /b 1
)

echo ✓ 构建文件检查完成

echo.
echo 2. 创建IIS站点目录...
if not exist "%IIS_SITE_PATH%" (
    mkdir "%IIS_SITE_PATH%"
    echo ✓ 创建目录: %IIS_SITE_PATH%
) else (
    echo ✓ 目录已存在: %IIS_SITE_PATH%
)

echo.
echo 3. 复制前端文件到IIS目录...
xcopy "%SOURCE_DIR%\*" "%IIS_SITE_PATH%\" /E /Y /I
if %ERRORLEVEL% neq 0 (
    echo 错误: 复制前端文件失败
    pause
    exit /b 1
)

echo.
echo 4. 复制web.config到IIS目录...
copy "%~dp0web.config" "%IIS_SITE_PATH%\web.config" /Y
if %ERRORLEVEL% neq 0 (
    echo 错误: 复制web.config失败
    pause
    exit /b 1
)

echo.
echo 5. 创建后端服务目录...
if not exist "%BACKEND_SERVICE_PATH%" (
    mkdir "%BACKEND_SERVICE_PATH%"
    echo ✓ 创建目录: %BACKEND_SERVICE_PATH%
) else (
    echo ✓ 目录已存在: %BACKEND_SERVICE_PATH%
)

echo.
echo 6. 复制后端文件...
xcopy "%BACKEND_DIR%\dist\*" "%BACKEND_SERVICE_PATH%\dist\" /E /Y /I
xcopy "%BACKEND_DIR%\node_modules\*" "%BACKEND_SERVICE_PATH%\node_modules\" /E /Y /I
xcopy "%BACKEND_DIR%\prisma\*" "%BACKEND_SERVICE_PATH%\prisma\" /E /Y /I
copy "%BACKEND_DIR%\package.json" "%BACKEND_SERVICE_PATH%\package.json" /Y
copy "%BACKEND_DIR%\.env" "%BACKEND_SERVICE_PATH%\.env" /Y 2>nul

if %ERRORLEVEL% neq 0 (
    echo 警告: .env文件复制失败，请手动创建环境配置文件
)

echo.
echo 7. 创建后端启动脚本...
(
echo @echo off
echo echo 启动 AI Note 后端服务...
echo cd /d "%BACKEND_SERVICE_PATH%"
echo node dist/index.js
echo pause
) > "%BACKEND_SERVICE_PATH%\start-backend.bat"

echo.
echo ========================================
echo 部署完成！
echo ========================================
echo.
echo 前端文件已部署到: %IIS_SITE_PATH%
echo 后端文件已部署到: %BACKEND_SERVICE_PATH%
echo.
echo 接下来的步骤:
echo 1. 在IIS管理器中创建新站点，指向: %IIS_SITE_PATH%
echo 2. 确保安装了URL重写模块 (URL Rewrite Module)
echo 3. 配置后端环境变量文件 (.env)
echo 4. 启动后端服务: %BACKEND_SERVICE_PATH%\start-backend.bat
echo 5. 或者将后端配置为Windows服务
echo.
pause
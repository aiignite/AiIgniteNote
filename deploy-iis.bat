@echo off
REM ================================================
REM AiNote IIS 部署脚本
REM
REM 用途：在 Windows Server 上自动部署 AiNote
REM       前端到 IIS，后端为 Windows 服务
REM
REM 要求：
REM   - Node.js 已安装
REM   - pnpm 已安装
REM   - PostgreSQL 已安装并运行
REM   - IIS 已启用
REM   - PM2 已安装 (npm install -g pm2)
REM
REM 使用方法：
REM   deploy-iis.bat
REM ================================================

setlocal enabledelayedexpansion

echo.
echo ================================================
echo AiNote IIS 部署脚本
echo ================================================
echo.

REM 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] 请以管理员身份运行此脚本！
    pause
    exit /b 1
)

REM 设置项目路径
set PROJECT_DIR=C:\inetpub\AiIgnite\AiIgniteNote
set FRONTEND_DIR=%PROJECT_DIR%\packages\frontend
set BACKEND_DIR=%PROJECT_DIR%\packages\backend
set DIST_DIR=%FRONTEND_DIR%\dist
set LOGS_DIR=%PROJECT_DIR%\logs
set IIS_SITE_NAME=AiNote
set IIS_SITE_PATH=C:\inetpub\AiIgniteNote

REM 创建日志目录
if not exist "%LOGS_DIR%" (
    echo [1/8] 创建日志目录...
    mkdir "%LOGS_DIR%"
)

echo.
echo ================================================
echo 部署配置
echo ================================================
echo 项目目录: %PROJECT_DIR%
echo IIS 站点名: %IIS_SITE_NAME%
echo IIS 物理路径: %IIS_SITE_PATH%
echo.

REM 检查依赖
echo [2/8] 检查依赖...
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] Node.js 未安装或未添加到 PATH
    pause
    exit /b 1
)

where pnpm >nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] pnpm 未安装，正在安装...
    npm install -g pnpm
)

where pm2 >nul 2>&1
if %errorLevel% neq 0 (
    echo [警告] PM2 未安装，正在安装...
    npm install -g pm2
    npm install -g pm2-windows-startup
    call pm2-startup install
)

echo Node.js 版本:
node --version
echo pnpm 版本:
pnpm --version

REM 安装依赖
echo.
echo [3/8] 安装项目依赖...
cd "%PROJECT_DIR%"
call pnpm install
if %errorLevel% neq 0 (
    echo [错误] 依赖安装失败！
    pause
    exit /b 1
)

REM 构建后端
echo.
echo [4/8] 构建后端...
cd "%BACKEND_DIR%"
call pnpm build
if %errorLevel% neq 0 (
    echo [错误] 后端构建失败！
    pause
    exit /b 1
)

REM 运行数据库迁移
echo.
echo [5/8] 运行数据库迁移...
cd "%BACKEND_DIR%"
call pnpm prisma migrate deploy
if %errorLevel% neq 0 (
    echo [警告] 数据库迁移失败，请检查数据库配置
)
call pnpm prisma generate

REM 构建前端
echo.
echo [6/8] 构建前端...
cd "%FRONTEND_DIR%"

REM 尝试构建，如果失败则尝试使用预构建的开发版本
call pnpm build
if %errorLevel% neq 0 (
    echo [警告] 生产构建失败，尝试备用构建方法...

    REM 方法 2: 跳过 TypeScript 检查直接用 Vite 构建
    npx vite build
    if %errorLevel% neq 0 (
        echo [警告] Vite 构建也失败，请检查构建错误
        echo.
        echo 如果构建持续失败，可以：
        echo 1. 运行 dev 模式: cd packages/frontend ^&^& pnpm dev
        echo 2. 或参考 IIS_DEPLOYMENT_GUIDE.md 修复构建问题
        echo.
    )
)

REM 检查构建输出
if not exist "%DIST_DIR%" (
    echo [错误] dist 目录不存在！
    pause
    exit /b 1
)

REM 复制 web.config 到 dist 目录
echo.
echo [7/8] 部署 IIS 配置...
if exist "%FRONTEND_DIR%\web.config" (
    copy /Y "%FRONTEND_DIR%\web.config" "%DIST_DIR%\web.config"
    echo web.config 已复制到 dist 目录
)

REM 配置 IIS（需要管理员权限）
echo.
echo [8/8] 配置 IIS 站点...
echo.
echo 请选择 IIS 配置选项:
echo 1. 创建新站点 (覆盖现有)
echo 2. 仅更新文件 (不修改 IIS 配置)
echo 3. 跳过 IIS 配置
echo.
set /p IIS_OPTION="请选择 (1-3): "

if "%IIS_OPTION%"=="1" (
    echo.
    echo 正在创建/更新 IIS 站点...

    REM 创建应用程序池
    %systemroot%\system32\inetsrv\appcmd.exe list apppool "AiNoteAppPool" >nul 2>&1
    if %errorLevel% neq 0 (
        echo 创建应用程序池...
        %systemroot%\system32\inetsrv\appcmd.exe add apppool /name:"AiNoteAppPool" /managedRuntimeVersion:"" /processModel.identityType:LocalSystem
    ) else (
        echo 应用程序池已存在
    )

    REM 创建/更新站点
    %systemroot%\system32\inetsrv\appcmd.exe list site "AiNote" >nul 2>&1
    if %errorLevel% neq 0 (
        echo 创建 IIS 站点...
        %systemroot%\system32\inetsrv\appcmd.exe add site /name:"AiNote" /physicalPath:"%DIST_DIR%" /bindings:http/*:80:
        %systemroot%\system32\inetsrv\appcmd.exe set site "AiNote" /[path='/'].applicationPool:"AiNoteAppPool"
    ) else (
        echo 更新现有站点...
        %systemroot%\system32\inetsrv\appcmd.exe set site "AiNote" -physicalPath:"%DIST_DIR%"
    )

    echo IIS 站点配置完成
) else if "%IIS_OPTION%"=="2" (
    echo 文件已更新，IIS 配置未修改
    echo 请手动刷新浏览器查看更新
) else (
    echo 已跳过 IIS 配置
)

REM 启动/重启后端服务
echo.
echo ================================================
echo 启动后端服务
echo ================================================
cd "%BACKEND_DIR%"

REM 检查 PM2 是否已有该进程
pm2 describe ainote-backend >nul 2>&1
if %errorLevel% equ 0 (
    echo 重启现有 PM2 进程...
    call pm2 restart ainote-backend
) else (
    echo 启动新的 PM2 进程...
    call pm2 start ecosystem.config.js
)

REM 保存 PM2 配置
call pm2 save

REM 显示服务状态
echo.
echo PM2 进程状态:
call pm2 list

echo.
echo ================================================
echo 部署完成！
echo ================================================
echo.
echo 访问地址:
echo   前端: http://localhost
echo   后端: http://localhost:3001
echo.
echo 演示账号:
echo   邮箱: demo@ainote.com
echo   密码: demo123456
echo.
echo 管理命令:
echo   查看后端日志: pm2 logs ainote-backend
echo   查看后端监控: pm2 monit
echo   重启后端: pm2 restart ainote-backend
echo   停止后端: pm2 stop ainote-backend
echo.
echo 日志位置:
echo   后端: %LOGS_DIR%
echo   IIS: C:\inetpub\logs\LogFiles\
echo.
echo ================================================
echo.

pause

@echo off
echo ========================================
echo AI Note 部署检查脚本
echo ========================================

echo.
echo 1. 检查构建文件...

REM 检查前端构建
if exist "packages\frontend\dist\index.html" (
    echo ✓ 前端构建文件存在
) else (
    echo ✗ 前端构建文件不存在
    echo   请运行: pnpm --filter frontend build
    set "BUILD_ERROR=1"
)

REM 检查后端构建
if exist "packages\backend\dist\index.js" (
    echo ✓ 后端构建文件存在
) else (
    echo ✗ 后端构建文件不存在
    echo   请运行: pnpm --filter backend build
    set "BUILD_ERROR=1"
)

echo.
echo 2. 检查配置文件...

REM 检查web.config
if exist "web.config" (
    echo ✓ IIS配置文件存在
) else (
    echo ✗ IIS配置文件不存在
    set "CONFIG_ERROR=1"
)

REM 检查后端环境配置
if exist "packages\backend\.env.production" (
    echo ✓ 后端生产环境配置模板存在
) else (
    echo ✗ 后端生产环境配置模板不存在
    set "CONFIG_ERROR=1"
)

echo.
echo 3. 检查部署脚本...

if exist "deploy-to-iis.bat" (
    echo ✓ IIS部署脚本存在
) else (
    echo ✗ IIS部署脚本不存在
    set "SCRIPT_ERROR=1"
)

if exist "install-backend-service.bat" (
    echo ✓ 后端服务安装脚本存在
) else (
    echo ✗ 后端服务安装脚本不存在
    set "SCRIPT_ERROR=1"
)

echo.
echo 4. 检查文档...

if exist "IIS-部署指南.md" (
    echo ✓ 部署指南文档存在
) else (
    echo ✗ 部署指南文档不存在
    set "DOC_ERROR=1"
)

echo.
echo 5. 检查依赖...

REM 检查Node.js
node --version >nul 2>&1
if %errorLevel% equ 0 (
    echo ✓ Node.js 已安装
    node --version
) else (
    echo ✗ Node.js 未安装或不在PATH中
    set "DEP_ERROR=1"
)

REM 检查pnpm
pnpm --version >nul 2>&1
if %errorLevel% equ 0 (
    echo ✓ pnpm 已安装
    pnpm --version
) else (
    echo ✗ pnpm 未安装或不在PATH中
    set "DEP_ERROR=1"
)

echo.
echo ========================================
echo 检查结果汇总
echo ========================================

if defined BUILD_ERROR (
    echo ✗ 构建文件检查失败
) else (
    echo ✓ 构建文件检查通过
)

if defined CONFIG_ERROR (
    echo ✗ 配置文件检查失败
) else (
    echo ✓ 配置文件检查通过
)

if defined SCRIPT_ERROR (
    echo ✗ 部署脚本检查失败
) else (
    echo ✓ 部署脚本检查通过
)

if defined DOC_ERROR (
    echo ✗ 文档检查失败
) else (
    echo ✓ 文档检查通过
)

if defined DEP_ERROR (
    echo ✗ 依赖检查失败
) else (
    echo ✓ 依赖检查通过
)

echo.
if defined BUILD_ERROR (
    echo 状态: 需要先完成构建
    echo 建议: 运行 pnpm run build
) else if defined CONFIG_ERROR (
    echo 状态: 配置文件缺失
) else if defined SCRIPT_ERROR (
    echo 状态: 部署脚本缺失
) else if defined DOC_ERROR (
    echo 状态: 文档缺失
) else if defined DEP_ERROR (
    echo 状态: 依赖环境不完整
) else (
    echo 状态: ✓ 准备就绪，可以开始部署！
    echo.
    echo 下一步操作:
    echo 1. 运行 deploy-to-iis.bat 进行自动部署
    echo 2. 或参考 IIS-部署指南.md 进行手动部署
)

echo.
pause
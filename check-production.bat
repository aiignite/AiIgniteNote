@echo off
setlocal enabledelayedexpansion
REM ====================================================
REM Production Environment Check Script
REM ====================================================
echo.
echo ========================================
echo AiNote Production Environment Check
echo ========================================
echo.

set ERRORS=0
set WARNINGS=0

REM Check Node.js
echo [1/8] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo !NODE_VERSION!
    echo [OK] Node.js installed
)
echo.

REM Check pnpm
echo [2/8] Checking pnpm...
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] pnpm not found, will install
    set /a WARNINGS+=1
) else (
    for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VERSION=%%i
    echo !PNPM_VERSION!
    echo [OK] pnpm installed
)
echo.

REM Check PM2
echo [3/8] Checking PM2...
where pm2 >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] PM2 not found
    echo Installing PM2...
    call npm install -g pm2
    where pm2 >nul 2>&1
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to install PM2
        set /a ERRORS+=1
    ) else (
        echo [OK] PM2 installed successfully
    )
) else (
    for /f "tokens=*" %%i in ('pm2 --version') do set PM2_VERSION=%%i
    echo !PM2_VERSION!
    echo [OK] PM2 installed
)
echo.

REM Check PostgreSQL
echo [4/8] Checking PostgreSQL...
where psql >nul 2>&1
if %errorlevel% equ 0 goto pgsql_found
echo [WARNING] PostgreSQL not in PATH
echo Checking if PostgreSQL service is running...
sc query postgresql-x64-16 >nul 2>&1
if %errorlevel% equ 0 goto pgsql_service_found
sc query postgresql-x64-15 >nul 2>&1
if %errorlevel% equ 0 goto pgsql_service_found
echo [WARNING] PostgreSQL not found
goto pgsql_end
:pgsql_found
for /f "tokens=*" %%i in ('psql --version 2^>^&1') do set PSQL_VERSION=%%i
if not "!PSQL_VERSION!"=="" (
    echo !PSQL_VERSION!
)
echo [OK] PostgreSQL found
goto pgsql_end
:pgsql_service_found
echo [OK] PostgreSQL service found (not in PATH)
:pgsql_end
echo.

REM Check backend build
echo [5/8] Checking backend build...
if exist "packages\backend\dist\index.js" (
    echo [OK] Backend built
) else (
    echo [WARNING] Backend not built yet
    echo Run start-production.bat to build
)
echo.

REM Check frontend build
echo [6/8] Checking frontend build...
if exist "packages\frontend\dist\index.html" (
    echo [OK] Frontend built
) else (
    echo [WARNING] Frontend not built yet
    echo Run start-production.bat to build
)
echo.

REM Check backend .env
echo [7/8] Checking backend environment...
if exist "packages\backend\.env" (
    echo [OK] Backend .env exists
) else (
    echo [WARNING] Backend .env not found
    echo Copy .env.example to .env and configure
)
echo.

REM Check port availability
echo [8/8] Checking port availability...
netstat -ano | findstr ":3001" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 3001 already in use
    echo Run stop-production.bat to free the port
) else (
    echo [OK] Port 3001 available
)

netstat -ano | findstr ":3100" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 3100 already in use
) else (
    echo [OK] Port 3100 available
)
echo.

echo ========================================
echo Check Complete!
echo ========================================
echo.

if !ERRORS! gtr 0 goto has_errors
echo [RESULT] All checks passed! Ready for production deployment.
echo.
echo Next steps:
echo 1. Run start-production.bat
echo 2. Run start-frontend-simple.bat
echo 3. Open http://localhost:3100
echo.
goto script_end
:has_errors
echo [RESULT] Found !ERRORS! error(s), please fix before deployment
echo.
:script_end

pause

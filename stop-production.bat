@echo off
REM ====================================================
REM Stop Production Services
REM ====================================================
echo.
echo Stopping AiNote Production Services...
echo.

REM 停止 PM2 服务
call pm2 stop ainote-backend 2>nul
call pm2 delete ainote-backend 2>nul

REM 查找并停止可能占用端口的进程
echo Checking for processes on port 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo Killing process %%a
    taskkill /F /PID %%a 2>nul
)

echo Checking for processes on port 3100...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3100') do (
    echo Killing process %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo All production services stopped.
echo.
pause

# AiNote Windows Server 部署指南

## 📋 目录

1. [Windows Server 部署架构](#windows-server-部署架构)
2. [服务器准备](#服务器准备)
3. [安装必要软件](#安装必要软件)
4. [数据库部署](#数据库部署)
5. [后端部署](#后端部署)
6. [前端部署](#前端部署)
7. [IIS 配置](#iis-配置)
8. [Windows 服务配置](#windows-服务配置)
9. [SSL 证书配置](#ssl-证书配置)
10. [防火墙配置](#防火墙配置)
11. [自动化部署](#自动化部署)
12. [监控和维护](#监控和维护)

---

## Windows Server 部署架构

```
┌─────────────────────────────────────────────────────────┐
│              Windows Server 2022/2019                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │              IIS (80/443)                        │  │
│  │  ├── 前端静态文件 (C:\inetpub\ainote\frontend)   │  │
│  │  ├── URL 重写规则 (API 反向代理)                │  │
│  │  └── iisnode (可选，Node.js 托管)               │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │         PostgreSQL (端口 5432)                   │  │
│  │         Windows 服务模式运行                     │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │      后端服务 (Windows Service 或 PM2)          │  │
│  │      端口: 3001                                 │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                  Azure Database (可选)
```

---

## 服务器准备

### 1. 购买腾讯云 Windows Server

**推荐配置**：
- **操作系统**: Windows Server 2022 或 2019
- **CPU**: 2核及以上
- **内存**: 4GB 及以上（推荐 8GB）
- **硬盘**: 50GB 及以上（系统盘 40GB + 数据盘 10GB）
- **带宽**: 5Mbps 及以上
- **实例类型**: S5、SA3 或更高

**购买地址**: https://cloud.tencent.com/product/cvm

### 2. 远程连接服务器

#### 方法 1: 使用腾讯云控制台 VNC

1. 登录腾讯云控制台
2. 找到你的 CVM 实例
3. 点击"登录" → "VNC 登录"

#### 方法 2: 使用远程桌面连接 (RDP)

**Windows 客户端**:
```cmd
mstsc /v:your-server-ip:3389
```

**Mac/Linux 客户端**:
```bash
# 使用 Microsoft Remote Desktop
brew install --cask microsoft-remote-desktop
```

### 3. 初始化服务器配置

#### 启用 .NET Framework 3.5（IIS 依赖）

1. 打开"服务器管理器"
2. 添加角色和功能 → 下一步
3. 选择".NET Framework 3.5 功能"
4. 如果需要指定备用源路径，使用：
   ```
   D:\sources\sxs
   ```

#### 启用 IIS 功能

打开 PowerShell（管理员）：

```powershell
# 安装 IIS 及相关功能
Install-WindowsFeature -name Web-Server -IncludeManagementTools

# 安装 ASP.NET Core 模块
Install-WindowsFeature -name Web-Asp-Net45

# 安装 URL 重写模块
Install-WindowsFeature -name Web-Url-Auth

# 安装管理工具
Install-WindowsFeature -name Web-Mgmt-Tools

# 重启服务器
Restart-Computer
```

---

## 安装必要软件

### 1. 安装 Node.js 18 LTS

**下载地址**: https://nodejs.org/

```powershell
# 使用 Chocolatey 安装（推荐）
choco install nodejs-lts -y

# 或手动下载安装包
# https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi
```

**验证安装**:
```powershell
node --version
npm --version
```

### 2. 安装 pnpm

```powershell
npm install -g pnpm
```

### 3. 安装 PostgreSQL 15

**下载地址**: https://www.postgresql.org/download/windows/

**安装步骤**:
1. 下载 PostgreSQL 15 for Windows x86-64
2. 运行安装程序
3. 设置密码（务必记住！）
4. 默认端口: 5432
5. 选择安装组件:
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4
   - ✅ Command Line Tools
   - ✅ Stack Builder
6. 安装完成后，PostgreSQL 会作为 Windows 服务运行

**验证安装**:
```powershell
# 检查服务状态
Get-Service -Name postgresql*

# 或使用 psql 命令
psql -U postgres -c "SELECT version();"
```

### 4. 安装 Git

**下载地址**: https://git-scm.com/download/win

或使用 Chocolatey:
```powershell
choco install git -y
```

### 5. 安装 PM2（进程管理器）

```powershell
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install
```

### 6. 可选：安装 Chocolatey 包管理器

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### 7. 可选：安装 Python（用于 node-gyp 编译）

```powershell
choco install python -y
```

---

## 数据库部署

### 方案 1: 使用本地 PostgreSQL（推荐）

#### 1. 创建数据库和用户

打开 PowerShell 或 pgAdmin 4：

```sql
-- 以 postgres 超级用户身份连接
psql -U postgres

-- 创建数据库
CREATE DATABASE ainote;

-- 创建用户
CREATE USER ainote_user WITH PASSWORD 'your_strong_password';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE ainote TO ainote_user;

-- 退出
\q
```

#### 2. 配置 PostgreSQL 远程连接

编辑 `C:\Program Files\PostgreSQL\15\data\postgresql.conf`:

```ini
# 监听所有地址
listen_addresses = '*'

# 或指定 IP
# listen_addresses = 'localhost,192.168.1.100'
```

编辑 `C:\Program Files\PostgreSQL\15\data\pg_hba.conf`:

```ini
# IPv4 local connections:
host    all             all             127.0.0.1/32            scram-sha-256
# 添加允许的客户端 IP（可选，如果需要远程连接）
host    all             all             10.0.0.0/8             scram-sha-256
```

#### 3. 重启 PostgreSQL 服务

```powershell
Restart-Service -Name postgresql-x64-15
```

### 方案 2: 使用腾讯云 PostgreSQL（生产推荐）

1. 登录腾讯云控制台
2. 进入 PostgreSQL 服务
3. 创建数据库实例
4. 获取连接字符串：
   ```
   postgresql://username:password@pg-instance-id.postgres.tencentcdb.com:5432/ainote
   ```

---

## 后端部署

### 1. 克隆代码到服务器

```powershell
# 创建项目目录
New-Item -ItemType Directory -Path "C:\inetpub\ainote" -Force

# 克隆代码
cd C:\inetpub\ainote
git clone https://github.com/your-repo/ainote.git .
```

### 2. 安装依赖和构建

```powershell
# 进入后端目录
cd C:\inetpub\ainote\packages\backend

# 安装依赖
pnpm install

# 复制环境变量文件
Copy-Item .env.example .env.production

# 编辑环境变量
notepad .env.production
```

### 3. 配置生产环境变量

**编辑 `.env.production`**:

```env
# 生产环境配置
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# 数据库
DATABASE_URL=postgresql://ainote_user:your_password@localhost:5432/ainote?schema=public

# JWT（生成强密钥）
JWT_SECRET=your-generated-secret-key-at-least-32-characters
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# 加密（32字节 hex）
ENCRYPTION_KEY=your-64-character-hex-key-here

# CORS（修改为你的域名）
CORS_ORIGIN=https://your-domain.com
```

**生成安全密钥**:

```powershell
# 生成 JWT Secret
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# 生成 Encryption Key（32字节 = 64 hex字符）
-join ((0..9) + (97..102) | Get-Random -Count 64 | % {[char]$_})
```

### 4. 构建项目

```powershell
# 构建 TypeScript
pnpm build

# 生成 Prisma Client
pnpm prisma generate

# 运行数据库迁移
pnpm prisma migrate deploy

# 运行种子数据（可选）
pnpm prisma db seed
```

### 5. 使用 PM2 运行后端

```powershell
# 安装 PM2（如果还没安装）
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install

# 启动后端服务
cd C:\inetpub\ainote\packages\backend
pm2 start dist/index.js --name ainote-backend --env production

# 保存 PM2 配置
pm2 save

# 查看日志
pm2 logs ainote-backend

# 查看状态
pm2 status
```

### 6. 或使用 node-windows 创建 Windows 服务

```powershell
# 安装 node-windows
cd C:\inetpub\ainote\packages\backend
npm install --save-dev node-windows

# 创建服务脚本
# 创建文件: C:\inetpub\ainote\packages\backend\service.js
```

**service.js 内容**:

```javascript
const Service = require('node-windows').Service;

// 创建服务对象
const svc = new Service({
  name: 'AiNote Backend',
  description: 'AiNote Backend API Server',
  script: 'C:\\inetpub\\ainote\\packages\\backend\\dist\\index.js',
  nodeOptions: [
    '--max-old-space-size=4096'
  ],
  env: {
    name: "NODE_ENV",
    value: "production"
  },
  // 服务日志
  stdout: 'C:\\inetpub\\ainote\\logs\\backend.log',
  stderr: 'C:\\inetpub\\ainote\\logs\\error.log'
});

// 监听事件
svc.on('install', function(){
  svc.start();
  console.log('Service installed and started');
});

svc.on('uninstall', function(){
  console.log('Service uninstalled');
});

// 安装服务
svc.install();
```

```powershell
# 安装服务
node service.js

# 查看服务状态
Get-Service -Name "AiNote Backend"

# 启动/停止服务
Start-Service -Name "AiNote Backend"
Stop-Service -Name "AiNote Backend"

# 卸载服务
# 取消注释 svc.uninstall() 并重新运行
```

---

## 前端部署

### 1. 本地构建

```powershell
# 在本地开发环境（推荐在开发机上构建）
cd packages\frontend

# 安装依赖
pnpm install

# 配置生产环境 API 地址
"VITE_API_BASE_URL=https://your-domain.com" | Out-File -Encoding UTF8 .env.production

# 构建生产版本
pnpm build

# 构建产物在 dist\ 目录
```

### 2. 上传到服务器

**使用 WinSCP 或 FTP**:
- 下载 WinSCP: https://winscp.net/
- 连接到服务器
- 上传 `packages/frontend/dist` 内容到 `C:\inetpub\ainote\frontend`

**或使用 PowerShell 压缩后上传**:

```powershell
# 在开发机上压缩
Compress-Archive -Path .\dist\* -DestinationPath ainote-frontend.zip

# 在服务器上解压
Expand-Archive -Path ainote-frontend.zip -DestinationPath C:\inetpub\ainote\frontend
```

### 3. 或在服务器上直接构建

```powershell
# 在服务器上构建（不推荐，因为 Windows 编译较慢）
cd C:\inetpub\ainote\packages\frontend

# 安装依赖
pnpm install

# 配置环境变量
"VITE_API_BASE_URL=http://localhost:3001" | Out-File -Encoding UTF8 .env.production

# 构建
pnpm build

# 复制到 IIS 目录
New-Item -ItemType Directory -Path "C:\inetpub\ainote\frontend" -Force
Copy-Item -Recurse -Force .\dist\* C:\inetpub\ainote\frontend\
```

---

## IIS 配置

### 1. 创建网站

打开 "Internet Information Services (IIS) 管理器":

```
1. 连接到本地服务器
2. 右键"网站" → "添加网站"
3. 填写信息:
   - 网站名称: ainote
   - 物理路径: C:\inetpub\ainote\frontend
   - 绑定: HTTP, 端口 80, IP 地址: 全部未分配
   - 主机名: your-domain.com (可选)
4. 点击"确定"
```

### 2. 配置 URL 重写规则

#### 下载安装 URL Rewrite 模块

**下载地址**: https://www.iis.net/downloads/microsoft/url-rewrite

#### 创建重写规则

1. 选择 ainote 网站
2. 双击"URL 重写"
3. 点击"添加规则" → "空白规则"
4. 创建 API 反向代理规则:

**规则 1: API 反向代理**

```
名称: Reverse Proxy API
模式: ^api/(.*)
操作类型: 重写
重写 URL: http://localhost:3001/api/{R:1}
```

**或使用 web.config 配置**:

创建文件 `C:\inetpub\ainote\frontend\web.config`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <!-- 启用压缩 -->
    <urlCompression doStaticCompression="true" doDynamicCompression="true" />

    <!-- URL 重写规则 -->
    <rewrite>
      <rules>
        <!-- API 反向代理 -->
        <rule name="ReverseProxyInboundRule1" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:3001/api/{R:1}" />
        </rule>

        <!-- 健康检查 -->
        <rule name="HealthCheck" stopProcessing="true">
          <match url="^health$" />
          <action type="Rewrite" url="http://localhost:3001/health" />
        </rule>

        <!-- SPA 路由支持 -->
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/api/" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>

    <!-- 静态内容缓存 -->
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="7.00:00:00" />
    </staticContent>

    <!-- 默认文档 -->
    <defaultDocument>
      <files>
        <clear />
        <add value="index.html" />
      </files>
    </defaultDocument>

    <!-- 自定义错误页面 -->
    <httpErrors errorMode="Custom">
      <remove statusCode="404" />
      <error statusCode="404" path="/index.html" responseMode="ExecuteURL" />
    </httpErrors>
  </system.webServer>
</configuration>
```

### 3. 配置应用程序池

1. 在 IIS 管理器中，选择"应用程序池"
2. 找到 ainote 应用程序池
3. 右键 → "基本设置":
   - .NET CLR 版本: 无托管代码
   - 托管管道模式: 集成
4. 右键 → "高级设置":
   - 启用 32 位应用程序: False
   - 空闲超时（分钟）: 20
   - 最大工作进程: 1
   - 快速故障保护: True

### 4. 配置 MIME 类型

确保以下 MIME 类型已配置：

```
.json → application/json
.wasm → application/wasm
.webmanifest → application/manifest+json
```

添加方法:
1. 选择 ainote 网站
2. 双击"MIME 类型"
3. 点击"添加"
4. 添加上述类型

---

## Windows 服务配置

### 使用 PM2 配置开机自启

```powershell
# 安装 PM2 Windows 启动服务
npm install -g pm2-windows-startup
pm2-startup install

# 启动应用
cd C:\inetpub\ainote\packages\backend
pm2 start dist/index.js --name ainote-backend

# 保存进程列表
pm2 save

# 查看启动状态
pm2 list
```

### 或使用任务计划程序

1. 打开"任务计划程序"
2. 创建基本任务:
   - 名称: AiNote Backend Startup
   - 触发器: 启动时
   - 操作: 启动程序
   - 程序/脚本: `C:\Program Files\nodejs\node.exe`
   - 参数: `C:\inetpub\ainote\packages\backend\dist\index.js`
   - 起始于: `C:\inetpub\ainote\packages\backend`

---

## SSL 证书配置

### 方法 1: 使用 Let's Encrypt（推荐免费）

#### 使用 win-acme 工具

**下载地址**: https://www.win-acme.com/

1. 下载 `wacs.exe`
2. 以管理员身份运行
3. 按提示操作:
   - 选择创建新证书
   - 选择 `IIS` 绑定
   - 选择域名
   - 选择 HTTP 验证
   - 完成

自动续期配置会自动添加到任务计划程序。

### 方法 2: 使用腾讯云 SSL 证书

1. 登录腾讯云控制台
2. 进入 SSL 证书服务
3. 申请免费证书（或购买付费证书）
4. 下载 IIS 格式证书（.pfx）
5. 导入证书到 Windows

**导入证书**:
```powershell
# 双击 .pfx 文件
# 或使用 PowerShell
Import-PfxCertificate -FilePath cert.pfx -CertStoreLocation Cert:\LocalMachine\My
```

**在 IIS 中绑定证书**:
1. 选择 ainote 网站
2. 右侧"绑定" → "添加"
3. 类型: https
4. IP 地址: 全部未分配
5. 端口: 443
6. SSL 证书: 选择导入的证书
7. 点击"确定"

**强制 HTTPS**:
1. 选择 ainote 网站
2. 双击"SSL 设置"
3. 勾选"要求 SSL"
4. 客户端证书: 忽略
5. 点击"应用"

---

## 防火墙配置

### Windows 防火墙入站规则

打开 PowerShell（管理员）:

```powershell
# 允许 HTTP
New-NetFirewallRule -DisplayName "Allow HTTP (80)" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow

# 允许 HTTPS
New-NetFirewallRule -DisplayName "Allow HTTPS (443)" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow

# 允许 SSH（可选，如果安装了 OpenSSH）
New-NetFirewallRule -DisplayName "Allow SSH (22)" -Direction Inbound -LocalPort 22 -Protocol TCP -Action Allow

# 允许 RDP
New-NetFirewallRule -DisplayName "Allow RDP (3389)" -Direction Inbound -LocalPort 3389 -Protocol TCP -Action Allow

# 查看规则
Get-NetFirewallRule | Where-Object {$_.Enabled -eq 'True'}
```

### 腾讯云安全组配置

在腾讯云控制台配置安全组：

```
入站规则:
- HTTP (80): 允许 0.0.0.0/0
- HTTPS (443): 允许 0.0.0.0/0
- RDP (3389): 允许你的IP（或 0.0.0.0/0，不推荐）
```

---

## 自动化部署

### 1. 创建部署脚本

**文件**: `C:\inetpub\ainote\deploy.ps1`

```powershell
#!/usr/bin/env pwsh
# AiNote Windows Server 部署脚本

param(
    [string]$Branch = "main",
    [string]$BackupPath = "C:\backups\ainote"
)

$ErrorActionPreference = "Stop"
$ProjectPath = "C:\inetpub\ainote"

Write-Host "🚀 开始部署 AiNote..." -ForegroundColor Green

# 1. 备份当前版本
Write-Host "📦 备份当前版本..." -ForegroundColor Yellow
$Date = Get-Date -Format "yyyyMMdd_HHmmss"
New-Item -ItemType Directory -Path "$BackupPath\$Date" -Force | Out-Null

# 备份数据库
& "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" -U ainote_user -d ainote |
    Out-File "$BackupPath\$Date\ainote_db.sql" -Encoding UTF8

# 备份前端
if (Test-Path "$ProjectPath\frontend") {
    Copy-Item -Recurse "$ProjectPath\frontend" "$BackupPath\$Date\frontend"
}

Write-Host "✅ 备份完成: $BackupPath\$Date" -ForegroundColor Green

# 2. 拉取最新代码
Write-Host "📥 拉取最新代码..." -ForegroundColor Yellow
cd $ProjectPath
git fetch origin
git checkout $Branch
git pull origin $Branch

# 3. 更新后端
Write-Host "🔧 更新后端..." -ForegroundColor Yellow
cd "$ProjectPath\packages\backend"
pnpm install
pnpm build
pnpm prisma generate
pnpm prisma migrate deploy

# 重启 PM2 服务
pm2 restart ainote-backend

# 4. 更新前端
Write-Host "🎨 更新前端..." -ForegroundColor Yellow
cd "$ProjectPath\packages\frontend"
pnpm install
pnpm build

# 复制到 IIS 目录
Remove-Item -Recurse -Force "$ProjectPath\frontend\*" -ErrorAction SilentlyContinue
Copy-Item -Recurse -Force "dist\*" "$ProjectPath\frontend\"

# 5. 清理旧备份（保留最近 7 天）
Write-Host "🧹 清理旧备份..." -ForegroundColor Yellow
Get-ChildItem $BackupPath |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } |
    Remove-Item -Recurse -Force

Write-Host "✅ 部署完成！" -ForegroundColor Green
```

### 2. 创建备份脚本

**文件**: `C:\inetpub\ainote\backup.ps1`

```powershell
#!/usr/bin/env pwsh
# AiNote 备份脚本

param(
    [string]$BackupPath = "C:\backups\ainote"
)

$Date = Get-Date -Format "yyyyMMdd_HHmmss"
New-Item -ItemType Directory -Path "$BackupPath\$Date" -Force | Out-Null

Write-Host "💾 开始备份..." -ForegroundColor Green

# 备份数据库
& "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" -U ainote_user -d ainote -F c -f "$BackupPath\$Date\ainote_db.backup"

# 备份前端文件
if (Test-Path "C:\inetpub\ainote\frontend") {
    Compress-Archive -Path "C:\inetpub\ainote\frontend" -DestinationPath "$BackupPath\$Date\frontend.zip"
}

Write-Host "✅ 备份完成: $BackupPath\$Date" -ForegroundColor Green
```

### 3. 创建监控脚本

**文件**: `C:\inetpub\ainote\monitor.ps1`

```powershell
#!/usr/bin/env pwsh
# AiNote 监控脚本

Write-Host "📊 AiNote 服务状态监控" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Gray

# 1. PM2 服务状态
Write-Host "`n1. PM2 服务状态:" -ForegroundColor Yellow
pm2 list

# 2. IIS 网站状态
Write-Host "`n2. IIS 网站状态:" -ForegroundColor Yellow
Get-Website | Where-Object {$_.Name -like "*ainote*"} |
    Select-Object Name, State, PhysicalPath

# 3. PostgreSQL 服务状态
Write-Host "`n3. PostgreSQL 服务:" -ForegroundColor Yellow
Get-Service -Name postgresql* |
    Select-Object Name, Status, DisplayName

# 4. 健康检查
Write-Host "`n4. 健康检查:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing
    Write-Host "✅ 后端健康: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ 后端异常: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. 磁盘空间
Write-Host "`n5. 磁盘空间:" -ForegroundColor Yellow
Get-PSDrive C | Select-Object Used, Free, @{Name="UsedGB";Expression={[math]::Round($_.Used/1GB,2)}}

# 6. 内存使用
Write-Host "`n6. 内存使用:" -ForegroundColor Yellow
$os = Get-CimInstance Win32_OperatingSystem
$totalMemory = [math]::Round($os.TotalVisibleMemorySize/1MB,2)
$freeMemory = [math]::Round($os.FreePhysicalMemory/1MB,2)
$usedMemory = $totalMemory - $freeMemory
Write-Host "总内存: $totalMemory GB" -ForegroundColor Gray
Write-Host "已使用: $usedMemory GB" -ForegroundColor Yellow
Write-Host "空闲: $freeMemory GB" -ForegroundColor Green

# 7. 最近的错误日志
Write-Host "`n7. PM2 最近错误:" -ForegroundColor Yellow
pm2 logs ainote-backend --nostream --lines 20 | Select-String -Pattern "error" -CaseSensitive:$false
```

### 4. 配置任务计划程序

#### 打开任务计划程序

```
Win + R → taskschd.msc → Enter
```

#### 创建自动备份任务

1. 创建任务
   - 名称: AiNote Auto Backup
   - 触发器: 每天 凌晨 2:00
   - 操作: 启动程序
   - 程序/脚本: `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`
   - 参数: `-ExecutionPolicy Bypass -File "C:\inetpub\ainote\backup.ps1"`
   - 勾选"使用最高权限运行"

#### 创建监控任务

1. 创建任务
   - 名称: AiNote Monitor
   - 触发器: 每小时
   - 操作: 启动程序
   - 程序/脚本: `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`
   - 参数: `-ExecutionPolicy Bypass -File "C:\inetpub\ainote\monitor.ps1" > C:\logs\ainote-monitor.log`

---

## 监控和维护

### 1. 查看日志

**PM2 日志**:
```powershell
pm2 logs ainote-backend
pm2 logs ainote-backend --lines 100
```

**IIS 日志**:
```
C:\inetpub\logs\LogFiles\W3SVC*
```

**Windows 事件日志**:
```
Win + R → eventvwr.msc
查看: Windows 日志 → 应用程序
```

### 2. 性能监控

**打开性能监视器**:
```
Win + R → perfmon → Enter
```

添加计数器:
- Processor: % Processor Time
- Memory: Available MBytes
- Network Interface: Bytes Total/sec
- Process: % Processor Time (node, postgres)

### 3. 数据库维护

**定期清理和优化**:
```sql
-- 连接到数据库
psql -U ainote_user -d ainote

-- 清理死元组
VACUUM;

-- 分析表
ANALYZE;

-- 重建索引
REINDEX DATABASE ainote;

-- 查看数据库大小
SELECT pg_size_pretty(pg_database_size('ainote'));
```

**创建维护计划**:
```powershell
# 创建脚本: C:\inetpub\ainote\db-maintenance.sql
# VACUUM ANALYZE;

# 在任务计划程序中每周执行
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U ainote_user -d ainote -f "C:\inetpub\ainote\db-maintenance.sql"
```

### 4. 更新应用

**手动更新**:
```powershell
cd C:\inetpub\ainote
git pull origin main

# 更新后端
cd packages\backend
pnpm install
pnpm build
pnpm prisma migrate deploy
pm2 restart ainote-backend

# 更新前端
cd ..\frontend
pnpm install
pnpm build
Remove-Item -Recurse -Force "C:\inetpub\ainote\frontend\*"
Copy-Item -Recurse -Force "dist\*" "C:\inetpub\ainote\frontend\"
```

**自动更新**:
```powershell
# 使用部署脚本
C:\inetpub\ainote\deploy.ps1 -Branch main
```

---

## 快速部署步骤总结

### 第一次部署

```powershell
# 1. 准备服务器
# 安装 Node.js、PostgreSQL、Git、IIS

# 2. 克隆代码
New-Item -ItemType Directory -Path "C:\inetpub\ainote" -Force
cd C:\inetpub\ainote
git clone https://github.com/your-repo/ainote.git .

# 3. 配置数据库
# 创建数据库: ainote
# 创建用户: ainote_user

# 4. 配置后端
cd packages\backend
Copy-Item .env.example .env.production
notepad .env.production  # 填写配置
pnpm install
pnpm build
pnpm prisma generate
pnpm prisma migrate deploy
pnpm prisma db seed

# 5. 启动后端
pm2 start dist/index.js --name ainote-backend
pm2 save

# 6. 构建前端
cd ..\frontend
pnpm install
"VITE_API_BASE_URL=https://your-domain.com" | Out-File -Encoding UTF8 .env.production
pnpm build

# 7. 部署到 IIS
New-Item -ItemType Directory -Path "C:\inetpub\ainote\frontend" -Force
Copy-Item -Recurse -Force "dist\*" "C:\inetpub\ainote\frontend\"

# 8. 配置 IIS
# 创建网站、配置 URL 重写、配置 SSL

# 9. 测试访问
# http://your-server-ip
```

### 后续更新

```powershell
# 使用部署脚本
C:\inetpub\ainote\deploy.ps1

# 或手动更新
cd C:\inetpub\ainote
git pull
pm2 restart ainote-backend
```

---

## 故障排查

### 问题 1: PM2 服务无法启动

```powershell
# 查看日志
pm2 logs ainote-backend --lines 100

# 查看错误
pm2 show ainote-backend

# 重新启动
pm2 delete ainote-backend
pm2 start dist/index.js --name ainote-backend
```

### 问题 2: IIS 网站无法访问

```powershell
# 检查 IIS 服务
Get-Service -Name W3SVC

# 检查网站状态
Get-Website | Where-Object {$_.Name -like "*ainote*"}

# 重启 IIS
& iisreset
```

### 问题 3: PostgreSQL 连接失败

```powershell
# 检查服务
Get-Service -Name postgresql*

# 测试连接
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U ainote_user -d ainote -c "SELECT 1;"

# 查看日志
# C:\Program Files\PostgreSQL\15\data\log\
```

### 问题 4: URL 重写不工作

```powershell
# 检查 web.config
Test-Path C:\inetpub\ainote\frontend\web.config

# 重新导入配置
& $env:windir\system32\inetsrv\appcmd.exe list config -section:system.webServerrewrite
```

### 问题 5: 端口冲突

```powershell
# 查看端口占用
netstat -ano | findstr :3001

# 查看 PID
tasklist | findstr <PID>

# 结束进程
Stop-Process -Id <PID> -Force
```

---

## 成本估算

### Windows Server 费用（月）

| 配置 | 实例类型 | 价格 |
|------|---------|------|
| 2核4GB | S5 (Windows) | ¥300-400 |
| 4核8GB | S5 (Windows) | ¥500-700 |

**注意**: Windows Server 比 Linux 贵约 2-3 倍

### 其他费用（月/年）

| 项目 | 价格 |
|------|------|
| PostgreSQL 云数据库 | ¥150-200/月 |
| 域名 | ¥50-100/年 |
| SSL 证书 | 免费（Let's Encrypt）或 ¥500-2000/年 |

### 总成本（月）

- 自建数据库: ¥300-700
- 使用云数据库: ¥450-900

---

## Windows vs Linux 对比

| 特性 | Windows Server | Linux |
|------|---------------|-------|
| 成本 | 高（约 2-3 倍） | 低 |
| 性能 | 稍低 | 较高 |
| IIS | 功能丰富，易用 | Nginx 高性能 |
| 维护 | 图形界面 | 命令行 |
| 兼容性 | .NET 生态好 | 开源生态好 |
| 学习曲线 | 较低 | 较高 |

**推荐**:
- 如果团队熟悉 Windows → Windows Server
- 如果追求性价比和性能 → Linux

---

## 后续优化建议

1. **使用 ARR (Application Request Routing)**: 更强大的反向代理功能
2. **配置 WinCache**: PHP 缓存（如果需要）
3. **启用 HTTP/2**: 提升性能
4. **配置 CDN**: 腾讯云 CDN 加速
5. **使用 Application Insights**: Azure 监控（可选）
6. **配置自动故障转移**: 高可用性
7. **定期清理日志**: 避免磁盘占满

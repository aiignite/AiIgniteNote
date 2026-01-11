# Windows Server IIS 部署指南

## 架构说明

AiNote 采用前后端分离架构：
- **前端**: React + Vite (静态文件)
- **后端**: Fastify + Node.js (API 服务)

## 部署方案

### 方案一：IIS 静态网站 + 独立 Node.js 后端（推荐）

#### 前端部署到 IIS

1. **构建前端**
   ```bash
   cd packages/frontend
   pnpm build
   ```
   注意：如果构建失败，需要先修复 shared 包的导出问题

2. **创建 IIS 网站**
   - 打开 IIS 管理器
   - 添加网站
     - 网站名称: `AiNote`
     - 物理路径: `C:\inetpub\AiIgniteNote\dist`
     - 绑定: `HTTP`, 端口 `80` 或其他端口
     - 主机名: 可选（如 `ainote.yourdomain.com`）

3. **配置 web.config**
   在 dist 目录创建 `web.config`:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <configuration>
     <system.webServer>
       <!-- 启用压缩 -->
       <urlCompression doStaticCompression="true" doDynamicCompression="true" />

       <!-- 设置 MIME 类型 -->
       <staticContent>
         <mimeMap fileExtension=".json" mimeType="application/json" />
         <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
         <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
       </staticContent>

       <!-- SPA 路由支持 -->
       <rewrite>
         <rules>
           <rule name="Handle History Mode and Hash White List" stopProcessing="true">
             <match url="([\S]+[.]js|[\S]+[.]css|[\S]+[.]json|[\S]+[.]png|[\S]+[.]jpg|[\S]+[.]jpeg|[\S]+[.]gif|[\S]+[.]svg|[\S]+[.]ico|[\S]+[.]woff|[\S]+[.]woff2|[\S]+[.]ttf|[\S]+[.]eot)$" />
             <action type="None" />
           </rule>
           <rule name="Rewrite HTML" stopProcessing="true">
             <match url=".*" />
             <conditions logicalGrouping="MatchAll">
               <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
               <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
             </conditions>
             <action type="Rewrite" url="/" />
           </rule>
         </rules>
       </rewrite>

       <!-- 安全头 -->
       <httpProtocol>
         <customHeaders>
           <add name="X-Content-Type-Options" value="nosniff" />
           <add name="X-Frame-Options" value="DENY" />
           <add name="X-XSS-Protection" value="1; mode=block" />
         </customHeaders>
       </httpProtocol>
     </system.webServer>
   </configuration>
   ```

#### 后端部署为 Windows 服务

**选项 1: 使用 PM2 (推荐)**

1. **安装 PM2**
   ```bash
   npm install -g pm2
   npm install -g pm2-windows-startup
   pm2-startup install
   ```

2. **创建 ecosystem.config.js**
   在 `packages/backend` 目录创建:
   ```javascript
   module.exports = {
     apps: [{
       name: 'ainote-backend',
       script: 'dist/server.js',
       cwd: 'C:\\inetpub\\AiIgniteNote\\packages\\backend',
       interpreter: 'node',
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '1G',
       env: {
         NODE_ENV: 'production',
         PORT: 3001
       },
       error_file: 'C:\\inetpub\\AiIgniteNote\\logs\\backend-error.log',
       out_file: 'C:\\inetpub\\AiIgniteNote\\logs\\backend-out.log',
       log_file: 'C:\\inetpub\\AiIgniteNote\\logs\\backend-combined.log'
     }]
   };
   ```

3. **构建后端**
   ```bash
   cd packages/backend
   pnpm build
   ```

4. **启动服务**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```

**选项 2: 使用 node-windows (原生 Windows 服务)**

1. **安装 node-windows**
   ```bash
   npm install -g node-windows
   ```

2. **创建服务安装脚本**
   在 `packages/backend` 创建 `install-service.js`:
   ```javascript
   var Service = require('node-windows').Service;

   var svc = new Service({
     name: 'AiNoteBackend',
     description: 'AiNote Backend API Service',
     script: 'C:\\inetpub\\AiIgniteNote\\packages\\backend\\dist\\server.js',
     nodeOptions: [
       '--harmony',
       '--max_old_space_size=4096'
     ],
     env: {
       name: "NODE_ENV",
       value: "production"
     }
   });

   svc.on('install', function(){
     svc.start();
   });

   svc.install();
   ```

3. **安装服务**
   ```bash
   node install-service.js
   ```

**选项 3: 使用 NSSM (Non-Sucking Service Manager)**

1. **下载 NSSM**
   https://nssm.cc/download

2. **安装服务**
   ```cmd
   nssm install AiNoteBackend
   ```

3. **配置服务**
   - Path: `C:\Program Files\nodejs\node.exe`
   - Startup directory: `C:\inetpub\AiIgniteNote\packages\backend`
   - Arguments: `dist/server.js`

4. **启动服务**
   ```cmd
   nssm start AiNoteBackend
   ```

### 方案二：IIS 反向代理到后端

使用 IIS 的 Application Request Routing (ARR) 模块将 `/api` 请求代理到后端。

1. **安装 ARR 模块**
   - 下载: https://www.iis.net/downloads/microsoft/application-request-routing
   - 安装后启用代理功能

2. **配置 web.config**
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <configuration>
     <system.webServer>
       <rewrite>
         <rules>
           <!-- API 反向代理 -->
           <rule name="ReverseProxyInboundRule1" stopProcessing="true">
             <match url="^api/v1/(.*)" />
             <action type="Rewrite" url="http://localhost:3001/api/v1/{R:1}" />
           </rule>

           <!-- SPA 路由 -->
           <rule name="React Routes" stopProcessing="true">
             <match url=".*" />
             <conditions logicalGrouping="MatchAll">
               <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
               <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
             </conditions>
             <action type="Rewrite" url="/" />
           </rule>
         </rules>
       </rewrite>
     </system.webServer>
   </configuration>
   ```

## 环境配置

### 前端环境变量

修改 `packages/frontend/.env.production`:
```env
VITE_API_BASE_URL=http://your-server-ip:3001
# 或使用相对路径如果配置了 IIS 反向代理
# VITE_API_BASE_URL=/api/v1
```

### 后端环境变量

修改 `packages/backend/.env.production`:
```env
PORT=3001
HOST=0.0.0.0
CORS_ORIGIN=http://your-domain.com,https://your-domain.com
DATABASE_URL="postgresql://user:password@localhost:5432/ainote?schema=public"
JWT_SECRET=your-production-jwt-secret
ENCRYPTION_KEY=your-64-char-hex-key
NODE_ENV=production
```

## PostgreSQL 配置

### 安装 PostgreSQL on Windows Server

1. 下载安装: https://www.postgresql.org/download/windows/
2. 创建数据库和用户:
   ```sql
   CREATE DATABASE ainote;
   CREATE USER ainote_admin WITH PASSWORD 'your-password';
   GRANT ALL PRIVILEGES ON DATABASE ainote TO ainote_admin;
   ```

3. 运行迁移:
   ```bash
   cd packages/backend
   pnpm prisma migrate deploy
   pnpm prisma generate
   ```

## 防火墙配置

开放必要端口:
```cmd
# 前端 (IIS)
netsh advfirewall firewall add rule name="AiNote Frontend" dir=in action=allow protocol=TCP localport=80

# 后端 API (如果需要外部访问)
netsh advfirewall firewall add rule name="AiNote Backend" dir=in action=allow protocol=TCP localport=3001

# PostgreSQL (如果需要外部访问)
netsh advfirewall firewall add rule name="PostgreSQL" dir=in action=allow protocol=TCP localport=5432
```

## 性能优化

### IIS 配置

1. **启用压缩**
   - 安装动态内容压缩
   - 静态内容压缩默认启用

2. **缓存控制**
   ```xml
   <staticContent>
     <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="30.00:00:00" />
   </staticContent>
   ```

3. **HTTP/2**
   - 在 IIS 站点绑定中启用 HTTP/2

### Node.js 优化

1. **使用集群模式**
   ```javascript
   // ecosystem.config.js
   instances: 'max', // 或指定 CPU 核心数
   exec_mode: 'cluster'
   ```

2. **内存限制**
   ```bash
   node --max_old_space_size=4096 dist/server.js
   ```

## 监控和日志

### PM2 监控

```bash
pm2 monit
pm2 logs ainote-backend
```

### IIS 日志

- 位置: `C:\inetpub\logs\LogFiles\`
- 使用 LogParser 分析

### Windows 事件日志

查看 Windows 服务的运行状态和错误。

## 故障排查

### 前端问题

1. **404 错误**
   - 检查 web.config 路由规则
   - 确认 index.html 在根目录

2. **API 请求失败**
   - 检查 CORS 配置
   - 确认后端服务运行状态
   - 查看 API_BASE_URL 配置

### 后端问题

1. **服务无法启动**
   - 检查端口占用: `netstat -ano | findstr :3001`
   - 查看日志文件
   - 确认数据库连接

2. **数据库连接失败**
   - 确认 PostgreSQL 服务运行
   - 检查连接字符串
   - 验证防火墙规则

## 当前构建问题修复

前端构建失败的原因是 shared 包的 monorepo 配置问题。修复方法：

### 方法 1: 修改 shared package.json

```json
{
  "name": "@ainote/shared",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts"
    }
  }
}
```

### 方法 2: 先构建 shared

```bash
cd packages/shared
pnpm build
cd ../frontend
pnpm build
```

### 方法 3: 使用 Vite 的配置

在 `vite.config.ts` 中添加:
```typescript
export default defineConfig({
  // ...
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
})
```

## 快速部署脚本

创建 `deploy-iis.bat`:
```batch
@echo off
echo ======================================
echo AiNote IIS 部署脚本
echo ======================================

echo.
echo [1/4] 构建前端...
cd packages\frontend
call pnpm build
if %errorlevel% neq 0 (
    echo 前端构建失败！
    pause
    exit /b 1
)

echo.
echo [2/4] 构建后端...
cd ..\backend
call pnpm build
if %errorlevel% neq 0 (
    echo 后端构建失败！
    pause
    exit /b 1
)

echo.
echo [3/4] 运行数据库迁移...
call pnpm prisma migrate deploy

echo.
echo [4/4] 启动后端服务...
call pm2 restart ecosystem.config.js

echo.
echo ======================================
echo 部署完成！
echo 前端: http://localhost
echo 后端: http://localhost:3001
echo ======================================
pause
```

## 安全建议

1. **使用 HTTPS**
   - 安装 SSL 证书
   - 强制 HTTPS 重定向

2. **数据库安全**
   - 使用强密码
   - 限制远程访问
   - 定期备份

3. **JWT 密钥**
   - 使用强随机密钥
   - 定期轮换

4. **API 限流**
   - 实现速率限制
   - 防止 DDoS 攻击

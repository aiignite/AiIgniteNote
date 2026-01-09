# AiNote 生产部署指南

## 快速开始

### 方法 1：完整生产部署（推荐）

```bash
# 运行生产部署脚本
start-production.bat
```

这个脚本会：
1. ✅ 检查并安装依赖
2. ✅ 构建后端（TypeScript → JavaScript）
3. ✅ 构建前端（生产优化）
4. ✅ 使用 PM2 启动后端服务
5. ✅ 保存 PM2 配置

### 方法 2：分别启动前后端

**启动后端（生产模式）**：
```bash
cd packages/backend
pnpm build
pm2 start dist/index.js --name ainote-backend
pm2 save
```

**启动前端（生产构建）**：
```bash
cd packages/frontend
pnpm build
start-frontend-simple.bat
```

## 访问地址

- **后端 API**: http://localhost:3001
- **前端界面**: http://localhost:3100
- **API 文档**: http://localhost:3001/docs (如果配置了 Swagger)

## 生产环境配置

### 后端环境变量

创建 `packages/backend/.env.production`：

```env
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/ainote

# JWT（必须修改！）
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# 加密（必须修改！）
ENCRYPTION_KEY=your-64-character-hex-key-here

# CORS（修改为你的域名）
CORS_ORIGIN=http://localhost:3100
```

### 前端环境变量

创建 `packages/frontend/.env.production`：

```env
VITE_API_BASE_URL=http://localhost:3001
```

**注意**：
- 如果需要公开访问，将 `localhost` 改为实际 IP 或域名
- 确保后端 CORS 配置允许前端域名

## 常用命令

### 查看服务状态
```bash
pm2 list
pm2 info ainote-backend
```

### 查看日志
```bash
pm2 logs ainote-backend
pm2 logs ainote-backend --lines 100
```

### 重启服务
```bash
pm2 restart ainote-backend
```

### 停止服务
```bash
# 停止所有服务
stop-production.bat

# 或手动停止
pm2 stop ainote-backend
pm2 delete ainote-backend
```

### 监控服务
```bash
pm2 monit
```

## 前端部署选项

### 选项 1：使用简单 HTTP 服务器（开发/测试）

```bash
start-frontend-simple.bat
```

这会启动一个简单的 HTTP 服务器在端口 3100。

### 选项 2：使用 IIS（生产推荐）

1. 打开 IIS 管理器
2. 添加网站：
   - 物理路径：`d:\Service\AiIgniteNote\packages\frontend\dist`
   - 端口：80 或 443（HTTPS）
3. 配置 web.config（已在 dist 中）

### 选项 3：使用 Nginx（最佳性能）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root d:/Service/AiIgniteNote/packages/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 反向代理
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 数据库迁移

### 首次部署

```bash
cd packages/backend

# 生成 Prisma Client
pnpm prisma generate

# 运行迁移
pnpm prisma migrate deploy

# 运行种子数据（可选）
pnpm prisma db seed
```

### 更新数据库

```bash
# 开发环境：创建新迁移
pnpm prisma migrate dev --name migration_name

# 生产环境：应用迁移
pnpm prisma migrate deploy
```

## 性能优化

### 1. 启用 gzip 压缩（IIS）

在 IIS 中启用静态内容压缩：
1. 打开 IIS 管理器
2. 选择网站 → 压缩
3. 启用动态内容压缩和静态内容压缩

### 2. 配置缓存

IIS → 网站 → HTTP 响应头：
- 设置缓存过期时间：7 天

### 3. 后端性能

```bash
# PM2 集群模式（多核 CPU）
pm2 start dist/index.js --name ainote-backend -i max

# 或指定实例数
pm2 start dist/index.js --name ainote-backend -i 4
```

## 安全检查清单

- [ ] 修改默认 JWT_SECRET
- [ ] 修改默认 ENCRYPTION_KEY
- [ ] 配置强密码策略
- [ ] 启用 HTTPS（SSL 证书）
- [ ] 配置防火墙规则
- [ ] 定期备份数据库
- [ ] 限制 API 访问频率
- [ ] 设置 CORS 白名单
- [ ] 禁用 DEMO 用户或修改密码

## 监控和维护

### 日志位置

- **PM2 日志**：`~/.pm2/logs/`
- **IIS 日志**：`C:\inetpub\logs\LogFiles\`
- **应用日志**：配置在 `packages/backend/logs/`

### 健康检查

```bash
# 检查后端健康状态
curl http://localhost:3001/health

# 或使用浏览器访问
http://localhost:3001/health
```

### 数据库备份

```bash
# 备份数据库
pg_dump -U postgres ainote > backup_$(date +%Y%m%d).sql

# 或使用 pgAdmin 图形界面备份
```

## 故障排查

### 问题 1：端口被占用

```bash
# 查看端口占用
netstat -ano | findstr :3001

# 结束进程
taskkill /F /PID <进程ID>
```

### 问题 2：PM2 服务无法启动

```bash
# 查看详细日志
pm2 logs ainote-backend --lines 100

# 重新安装 PM2
pm2 delete ainote-backend
pm2 start dist/index.js --name ainote-backend
pm2 save
```

### 问题 3：前端无法访问后端 API

检查：
1. 后端是否正在运行：`pm2 list`
2. CORS 配置是否正确
3. 前端环境变量 `VITE_API_BASE_URL` 是否正确
4. 防火墙是否允许访问

### 问题 4：数据库连接失败

检查：
1. PostgreSQL 服务是否运行
2. DATABASE_URL 是否正确
3. 数据库用户权限是否足够
4. 防火墙是否允许连接

## 更新部署

### 自动更新脚本

```bash
# 停止服务
stop-production.bat

# 拉取最新代码
git pull

# 重新部署
start-production.bat
```

### 手动更新步骤

1. 备份数据库
2. 拉取最新代码：`git pull`
3. 安装新依赖：`pnpm install`
4. 运行迁移：`pnpm prisma migrate deploy`
5. 重新构建：`pnpm build`
6. 重启服务：`pm2 restart ainote-backend`

## 成本估算

### 本地部署（当前方案）

- **服务器**：已有 Windows Server
- **域名**：¥50-100/年（可选）
- **SSL 证书**：免费（Let's Encrypt）
- **总计**：¥0-100/年

### 云部署（可选）

如果需要公网访问：
- **轻量应用服务器**：¥50-100/月（2核4GB）
- **云数据库**：¥100-200/月（可选）
- **CDN**：按量计费（可选）

## 下一步

1. **测试生产环境**：运行 `start-production.bat` 并测试所有功能
2. **配置域名**：购买域名并配置 DNS
3. **启用 HTTPS**：申请 SSL 证书
4. **设置监控**：配置日志和错误追踪
5. **定期备份**：设置自动备份计划

## 需要帮助？

如有问题，请：
1. 查看日志：`pm2 logs ainote-backend`
2. 检查配置：确保 `.env.production` 正确
3. 查看故障排查部分
4. 提交 Issue：GitHub Issues

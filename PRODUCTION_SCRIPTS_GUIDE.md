# 生产部署脚本使用说明

## 📁 已创建的文件

### 1. start-production.bat
**主部署脚本** - 一键完成所有生产部署步骤

**功能**：
- ✅ 检查并安装依赖（pnpm）
- ✅ 构建后端（TypeScript → JavaScript）
- ✅ 生成 Prisma Client
- ✅ 构建前端（生产优化）
- ✅ 使用 PM2 启动后端服务
- ✅ 保存 PM2 配置

**使用方法**：
```bash
start-production.bat
```

---

### 2. start-frontend-simple.bat
**前端服务器脚本** - 启动简单的 HTTP 服务器

**功能**：
- ✅ 检查前端是否已构建
- ✅ 自动构建（如果需要）
- ✅ 启动 HTTP 服务器（Python 或 Node.js）
- ✅ 在端口 3100 上提供前端服务

**使用方法**：
```bash
start-frontend-simple.bat
```

**注意**：
- 需要安装 Python 或 Node.js
- 仅用于开发/测试环境
- 生产环境建议使用 IIS 或 Nginx

---

### 3. stop-production.bat
**停止服务脚本** - 停止所有生产服务

**功能**：
- ✅ 停止 PM2 服务
- ✅ 清理占用的端口（3001, 3100）
- ✅ 清理相关进程

**使用方法**：
```bash
stop-production.bat
```

---

### 4. check-production.bat
**环境检查脚本** - 检查生产环境配置

**功能**：
- ✅ 检查 Node.js
- ✅ 检查 pnpm
- ✅ 检查 PM2
- ✅ 检查 PostgreSQL
- ✅ 检查构建文件
- ✅ 检查环境配置文件
- ✅ 检查端口占用

**使用方法**：
```bash
check-production.bat
```

---

### 5. ecosystem.config.js
**PM2 配置文件** - PM2 进程管理配置

**配置项**：
- 应用名称：ainote-backend
- 实例数：1（可修改为集群模式）
- 内存限制：1G
- 日志文件：./logs/pm2-*.log
- 环境变量：production

**使用方法**：
```bash
pm2 start ecosystem.config.js
pm2 save
```

---

### 6. PRODUCTION_DEPLOYMENT.md
**详细部署文档** - 完整的生产部署指南

**包含内容**：
- 快速开始指南
- 环境配置说明
- 数据库迁移步骤
- 前端部署选项（IIS、Nginx）
- 性能优化建议
- 安全检查清单
- 监控和维护指南
- 故障排查方案
- 成本估算

---

### 7. QUICK_PRODUCTION_START.md
**快速开始文档** - 简化的部署步骤

**适用场景**：
- 第一次部署
- 快速测试生产环境
- 了解生产模式 vs 开发模式

---

## 🚀 快速开始（3 步）

### 步骤 1：检查环境
```bash
check-production.bat
```

### 步骤 2：启动生产服务
```bash
start-production.bat
```

等待完成后，后端 API 会运行在：http://localhost:3001

### 步骤 3：启动前端
```bash
start-frontend-simple.bat
```

前端会运行在：http://localhost:3100

---

## 📊 生产模式 vs 开发模式对比

| 特性 | 开发模式 | 生产模式 |
|------|------------------------|---------------------------|
| **启动脚本** | restart.bat | start-production.bat |
| **前端** | Vite Dev Server | 静态文件 |
| **后端** | tsx watch (实时编译) | 构建后的 JS 文件 |
| **性能** | 较慢 | 快（约 2-3 倍） |
| **内存** | 较高 | 较低 |
| **热重载** | ✅ 支持 | ❌ 不支持 |
| **适用场景** | 开发调试 | 测试/生产 |

---

## 🛠️ 日常操作

### 启动服务
```bash
# 完整启动（推荐）
start-production.bat
start-frontend-simple.bat

# 或只启动后端
cd packages/backend
pm2 start dist/index.js --name ainote-backend
```

### 查看状态
```bash
# 查看 PM2 服务列表
pm2 list

# 查看详细信息
pm2 info ainote-backend

# 查看日志
pm2 logs ainote-backend

# 实时监控
pm2 monit
```

### 重启服务
```bash
# 重启后端
pm2 restart ainote-backend

# 或使用脚本
stop-production.bat
start-production.bat
```

### 停止服务
```bash
# 停止所有服务
stop-production.bat

# 或手动停止
pm2 stop ainote-backend
pm2 delete ainote-backend
```

---

## ⚙️ 配置说明

### 后端环境变量

文件位置：`packages/backend/.env` 或 `.env.production`

```env
# 必须修改的配置
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
ENCRYPTION_KEY=your-64-character-hex-key-here

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/ainote

# CORS（修改为你的域名）
CORS_ORIGIN=http://localhost:3100
```

### 前端环境变量

文件位置：`packages/frontend/.env.production`

```env
VITE_API_BASE_URL=http://localhost:3001
```

**注意**：如果需要公开访问，将 localhost 改为实际 IP 或域名

---

## 🌐 公网访问配置

### 方法 1：使用 IP 地址

1. 修改后端 `.env`：
   ```env
   CORS_ORIGIN=http://your-ip:3100
   ```

2. 修改前端 `.env.production`：
   ```env
   VITE_API_BASE_URL=http://your-ip:3001
   ```

3. 重新构建：
   ```bash
   cd packages/frontend
   pnpm build
   ```

### 方法 2：使用域名

1. 购买域名并配置 DNS
2. 修改环境变量为域名
3. 配置 SSL 证书（推荐 Let's Encrypt 免费证书）

---

## 🔒 安全建议

### 首次部署必须做：

1. **修改默认密钥**：
   - 生成 JWT_SECRET：`openssl rand -base64 32`
   - 生成 ENCRYPTION_KEY：`openssl rand -hex 32`

2. **修改数据库密码**：
   - PostgreSQL 强密码
   - 更新 DATABASE_URL

3. **修改 DEMO 用户密码**：
   - 邮箱：demo@ainote.com
   - 密码：修改为强密码

### 推荐配置：

- ✅ 启用 HTTPS（SSL 证书）
- ✅ 配置防火墙规则
- ✅ 定期备份数据库
- ✅ 限制 API 访问频率
- ✅ 设置 CORS 白名单

---

## 📈 性能优化

### 后端优化：

```bash
# 使用集群模式（多核 CPU）
pm2 start dist/index.js --name ainote-backend -i max

# 或指定实例数
pm2 start dist/index.js --name ainote-backend -i 4
```

### 前端优化：

- ✅ 已启用生产构建优化
- ✅ 代码压缩和混淆
- ✅ Tree-shaking 去除无用代码
- ✅ 静态资源哈希缓存

---

## 🐛 故障排查

### 问题 1：端口被占用
```bash
# 查看端口占用
netstat -ano | findstr :3001

# 停止服务
stop-production.bat
```

### 问题 2：PM2 服务无法启动
```bash
# 查看日志
pm2 logs ainote-backend --lines 100

# 重新启动
pm2 delete ainote-backend
pm2 start dist/index.js --name ainote-backend
pm2 save
```

### 问题 3：前端无法访问后端
检查：
1. 后端是否运行：`pm2 list`
2. CORS 配置是否正确
3. 环境变量是否正确
4. 防火墙是否允许访问

---

## 📝 更新部署

### 自动更新（推荐）
```bash
# 停止服务
stop-production.bat

# 拉取最新代码
git pull

# 重新部署
start-production.bat
```

### 手动更新
```bash
# 1. 备份数据库
# 2. 拉取代码
git pull

# 3. 安装依赖
pnpm install

# 4. 运行迁移
cd packages/backend
pnpm prisma migrate deploy

# 5. 重新构建
pnpm build

# 6. 重启服务
pm2 restart ainote-backend
```

---

## 💡 最佳实践

1. **开发时**：使用 `restart.bat`（热重载）
2. **测试时**：使用 `start-production.bat`（接近生产）
3. **生产时**：配置 IIS/Nginx + PM2
4. **定期**：查看日志和性能监控
5. **更新时**：先备份数据库，再更新

---

## 📚 相关文档

- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - 详细部署文档
- [QUICK_PRODUCTION_START.md](./QUICK_PRODUCTION_START.md) - 快速开始
- [WINDOWS_DEPLOYMENT.md](./WINDOWS_DEPLOYMENT.md) - Windows Server 部署
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 云平台部署

---

## ❓ 需要帮助？

1. 检查日志：`pm2 logs ainote-backend`
2. 查看文档：PRODUCTION_DEPLOYMENT.md
3. 查看故障排查部分
4. 提交 Issue：GitHub Issues

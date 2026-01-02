# AiNote 部署指南

本文档介绍如何将 AiNote 部署到生产环境。

## 📋 部署架构

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Vercel    │      │   Railway   │      │  Supabase   │
│  (Frontend) │─────▶│  (Backend)  │─────▶│ (Database)  │
│             │      │             │      │             │
└─────────────┘      └─────────────┘      └─────────────┘
```

## 🚀 推荐部署方案

| 组件 | 推荐服务 | 免费额度 | 说明 |
|------|----------|----------|------|
| **前端** | Vercel / Netlify | ✅ | 自动 CI/CD，全球 CDN |
| **后端** | Railway / Render | ✅ | 支持 Docker，自动部署 |
| **数据库** | Supabase / Neon | ✅ | PostgreSQL 托管服务 |

---

## 一、数据库部署 (Supabase)

### 1.1 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)
2. 注册并创建新项目
3. 选择区域（推荐离用户最近的区域）
4. 记录以下信息：
   - Project URL
   - Database Password
   - API Key (anon/public)

### 1.2 获取数据库连接字符串

在 Supabase Dashboard 中：
1. 进入 Settings → Database
2. 找到 Connection String
3. 选择 "URI" 格式
4. 替换 `[YOUR-PASSWORD]` 为你的数据库密码

示例：
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
```

### 1.3 配置数据库

在本地运行迁移命令：

```bash
cd packages/backend

# 设置 DATABASE_URL
export DATABASE_URL="your-supabase-connection-string"

# 运行迁移
pnpm prisma migrate deploy

# 运行种子数据
pnpm prisma db seed
```

---

## 二、后端部署 (Railway)

### 2.1 准备工作

1. 访问 [railway.app](https://railway.app)
2. 使用 GitHub 账号登录
3. 安装 Railway GitHub App

### 2.2 创建新项目

1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择你的 AiNote 仓库
4. Railway 会自动检测到项目结构

### 2.3 配置后端服务

1. 在 Railway 中，点击 "New Service"
2. 选择 "Database" → PostgreSQL（可选，也可以用 Supabase）
3. 再点击 "New Service"
4. 选择 "GitHub Repo"
5. 设置 Root Directory 为 `packages/backend`

### 2.4 配置环境变量

在 Railway 后端服务的 Variables 标签页添加：

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=your-supabase-connection-string
JWT_SECRET=your-random-jwt-secret-min-32-chars
ENCRYPTION_KEY=your-32-character-hex-key
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

生成安全密钥：
```bash
# JWT Secret (生成随机字符串)
openssl rand -base64 32

# Encryption Key (32 字节 = 64 hex 字符)
openssl rand -hex 32
```

### 2.5 配置 Prisma

在 `packages/backend/package.json` 中添加：

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

在 Railway 的部署命令中设置：
```
pnpm prisma generate && pnpm prisma migrate deploy && pnpm start
```

### 2.6 获取后端 URL

部署成功后，Railway 会提供一个 URL，例如：
```
https://ainote-backend.up.railway.app
```

---

## 三、前端部署 (Vercel)

### 3.1 准备工作

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 安装 Vercel GitHub App

### 3.2 导入项目

1. 点击 "Add New Project"
2. 选择你的 AiNote 仓库
3. Vercel 会自动检测到 Vite 项目

### 3.3 配置构建设置

在 Vercel 项目设置中：

**Build & Development Settings:**
- Framework Preset: Vite
- Root Directory: `packages/frontend`
- Build Command: `pnpm build`
- Output Directory: `dist`
- Install Command: `pnpm install`

**Environment Variables:**
```
VITE_API_BASE_URL=https://ainote-backend.up.railway.app
```

### 3.4 配置 monorepo

由于项目是 monorepo，需要在项目根目录创建 `vercel.json`：

```json
{
  "installCommand": "pnpm install",
  "framework": "vite",
  "buildCommand": "cd packages/frontend && pnpm build",
  "outputDirectory": "packages/frontend/dist"
}
```

或者更简单的方式，只在 `packages/frontend` 目录下部署。

### 3.5 部署

点击 "Deploy" 按钮，等待部署完成。

部署成功后，Vercel 会提供一个 URL：
```
https://ainote.vercel.app
```

---

## 四、域名配置（可选）

### 4.1 前端域名

1. 在 Vercel 项目设置中
2. 进入 Domains 标签
3. 添加你的自定义域名
4. 按照提示配置 DNS 记录

### 4.2 后端域名

1. 在 Railway 项目设置中
2. 进入 Domains 标签
3. 添加自定义域名
4. 配置 DNS 记录

### 4.3 更新 CORS

更新后端的 `CORS_ORIGIN` 环境变量为你的自定义域名。

---

## 五、安全检查清单

### 5.1 环境变量

- [ ] `JWT_SECRET` 使用强随机值
- [ ] `ENCRYPTION_KEY` 使用 32 字节密钥
- [ ] `DATABASE_URL` 不包含明文密码在代码中
- [ ] `CORS_ORIGIN` 设置为正确的域名

### 5.2 数据库

- [ ] Supabase 项目设置为启用 RLS (Row Level Security)
- [ ] 数据库密码足够复杂
- [ ] 备份已启用

### 5.3 API 安全

- [ ] Rate Limiting 已配置
- [ ] HTTPS 强制启用
- [ ] JWT Token 过期时间合理

---

## 六、监控和维护

### 6.1 日志

**Railway:**
- Dashboard → Deployments → View Logs

**Vercel:**
- Dashboard → Deployments → View Function Logs

**Supabase:**
- Dashboard → Database → Logs

### 6.2 错误追踪

推荐集成 Sentry：
```bash
pnpm add @sentry/react @sentry/tracing
```

### 6.3 性能监控

- **前端**: Vercel Analytics
- **后端**: Railway Metrics
- **数据库**: Supabase Dashboard

### 6.4 备份策略

- Supabase 自动备份（每天）
- 可以手动导出数据库：
  ```bash
  pg_dump $DATABASE_URL > backup.sql
  ```

---

## 七、CI/CD 自动化

### 7.1 GitHub Actions

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - name: Deploy to Railway
        uses: railwayapp/cli/action@v1
        with:
          service: your-backend-service-id
```

### 7.2 自动部署

- 推送到 `main` 分支自动触发部署
- Railway 和 Vercel 会自动构建和部署

---

## 八、故障排查

### 8.1 常见问题

**问题 1: CORS 错误**
```
Solution: 检查后端 CORS_ORIGIN 环境变量是否包含前端域名
```

**问题 2: 数据库连接失败**
```
Solution: 
1. 检查 DATABASE_URL 是否正确
2. 确认 Supabase 项目未暂停
3. 检查 IP 白名单设置
```

**问题 3: JWT 验证失败**
```
Solution:
1. 确认前后端使用相同的 JWT_SECRET
2. 检查 Token 是否过期
```

**问题 4: Prisma 迁移失败**
```
Solution:
1. 本地测试: pnpm prisma migrate reset
2. 生产环境: pnpm prisma migrate deploy
3. 检查 Prisma Schema 与数据库版本是否匹配
```

### 8.2 回滚策略

**Vercel:**
- Dashboard → Deployments → 选择之前的版本 → Rollback

**Railway:**
- Dashboard → Deployments → 选择之前的版本 → Redeploy

**数据库:**
```bash
# 回滚迁移
pnpm prisma migrate resolve --rolled-back [migration-name]
```

---

## 九、成本估算

### 免费额度

| 服务 | 免费额度 | 月成本（超出后） |
|------|----------|----------------|
| Vercel | 100GB 带宽 | $20/100GB |
| Railway | $5 免费额度 | $0.0056/GB-hr |
| Supabase | 500MB 数据库 | $25/月 |

### 预估成本（小规模应用）

- **前端**: $0（免费额度足够）
- **后端**: $0-10/月
- **数据库**: $0-25/月
- **总计**: $0-35/月

---

## 十、后续优化

### 10.1 性能优化

- [ ] 启用 CDN 缓存
- [ ] 实现 Redis 缓存
- [ ] 数据库查询优化
- [ ] 图片压缩和懒加载

### 10.2 功能增强

- [ ] 添加邮件通知
- [ ] 实现文件上传（S3）
- [ ] 添加 Webhook 支持
- [ ] 实现实时协作

### 10.3 安全加固

- [ ] 启用 2FA
- [ ] 实现 API Rate Limiting
- [ ] 添加 CSP Headers
- [ ] 定期安全审计

---

## 📞 支持

如有问题，请：
1. 查看 [GitHub Issues](https://github.com/yourusername/ainote/issues)
2. 提交新的 Issue
3. 参考本文档的故障排查部分

---

**祝部署顺利！🎉**

# AiNote - AI 智能笔记应用

一个基于 React + TypeScript 的现代化笔记应用，集成 AI 辅助功能，支持 Markdown 编辑、多端同步等特性。

## ✨ 特性

- 📝 **Markdown 编辑** - 支持 Markdown 和富文本双模式编辑
- 🤖 **AI 辅助** - 内置多个 AI 助手，帮助写作、总结、翻译等
- 🗂️ **分类管理** - 灵活的笔记分类系统
- 🏷️ **标签系统** - 为笔记添加标签，方便分类和查找
- 🔍 **全文搜索** - 快速搜索笔记内容
- 📱 **响应式设计** - 适配桌面和移动设备
- 🌓 **主题切换** - 支持亮色/暗色主题
- ⌨️ **快捷键支持** - 提高操作效率
- 🔄 **云同步** - 支持多端数据同步（PostgreSQL + 本地 IndexedDB）

## 🏗️ 技术栈

### 前端
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Zustand** - 状态管理
- **React Query** - 服务端状态管理
- **Ant Design** - UI 组件库
- **TipTap** - 富文本编辑器
- **Dexie.js** - IndexedDB 封装
- **React Router** - 路由管理

### 后端
- **Fastify** - Web 框架
- **TypeScript** - 类型安全
- **Prisma** - ORM
- **PostgreSQL** - 数据库
- **JWT** - 身份认证
- **bcrypt** - 密码加密

## 📦 项目结构

```
ainote/
├── packages/
│   ├── frontend/          # 前端应用
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   │   ├── api/        # API 客户端
│   │   │   │   └── sync/       # 同步逻辑
│   │   │   ├── store/          # Zustand stores
│   │   │   ├── db/             # IndexedDB
│   │   │   └── types/
│   │   └── package.json
│   │
│   ├── backend/           # 后端服务
│   │   ├── src/
│   │   │   ├── routes/        # API 路由
│   │   │   ├── services/      # 业务逻辑
│   │   │   ├── middleware/    # 中间件
│   │   │   └── utils/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── package.json
│   │
│   └── shared/            # 共享代码
│       ├── src/types/
│       └── package.json
│
├── pnpm-workspace.yaml
└── package.json
```

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- pnpm >= 8
- PostgreSQL >= 14

### 安装

1. 克隆仓库
```bash
git clone https://github.com/yourusername/ainote.git
cd ainote
```

2. 安装依赖
```bash
pnpm install
```

3. 配置环境变量

创建 `packages/backend/.env` 文件：
```env
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/ainote?schema=public"
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-32-character-encryption-key
CORS_ORIGIN=http://localhost:5173
```

4. 初始化数据库
```bash
cd packages/backend
pnpm prisma migrate dev
pnpm prisma db seed
```

5. 启动开发服务器

**方式一：使用启动脚本（推荐）** ⭐
```bash
# 启动所有服务（自动处理端口占用）
./start.sh

# 停止所有服务
./stop.sh

# 重启所有服务
./restart.sh

# 查看服务状态
./status.sh
```

**方式二：手动启动**
```bash
# 启动后端（在项目根目录）
cd packages/backend && npm run dev

# 启动前端（在项目根目录）
cd packages/frontend && npm run dev
```

6. 访问应用
- 前端：http://localhost:5173
- 后端 API：http://localhost:3001
- Prisma Studio：运行 `cd packages/backend && npm run prisma studio` 后访问

### 🔧 启动脚本说明

项目提供了便捷的启动脚本，自动处理端口占用和服务管理：

| 脚本 | 功能 |
|------|------|
| `./start.sh` | 启动后端和前端服务，自动处理端口占用 |
| `./stop.sh` | 停止所有服务 |
| `./restart.sh` | 重启所有服务 |
| `./status.sh` | 查看服务运行状态和日志 |

**特点：**
- ✅ 自动检测并处理端口占用
- ✅ 自动创建日志文件（`logs/` 目录）
- ✅ 保存进程 PID，便于管理
- ✅ 彩色输出，清晰美观
- ✅ 显示演示账号信息

### 演示账号

```
邮箱：demo@ainote.com
密码：demo123456
```

## 📖 API 文档

### 认证模块 `/api/v1/auth`
- `POST /register` - 用户注册
- `POST /login` - 用户登录
- `POST /logout` - 用户登出
- `POST /refresh` - 刷新 Token
- `GET /me` - 获取当前用户信息

### 笔记模块 `/api/v1/notes`
- `GET /notes` - 获取笔记列表
- `GET /notes/:id` - 获取笔记详情
- `POST /notes` - 创建笔记
- `PUT /notes/:id` - 更新笔记
- `DELETE /notes/:id` - 删除笔记
- `PATCH /notes/:id/restore` - 恢复笔记
- `GET /notes/:id/versions` - 获取版本历史

### 分类模块 `/api/v1/categories`
- `GET /categories` - 获取分类列表
- `POST /categories` - 创建分类
- `PUT /categories/:id` - 更新分类
- `DELETE /categories/:id` - 删除分类

### AI 模块 `/api/v1/ai`
- `GET /ai/conversations` - 获取对话列表
- `POST /ai/conversations` - 创建对话
- `DELETE /ai/conversations/:id` - 删除对话
- `POST /ai/conversations/:id/messages` - 发送消息
- `GET /ai/assistants` - 获取 AI 助手列表
- `POST /ai/assistants` - 创建自定义助手

### 同步模块 `/api/v1/sync`
- `GET /sync/status` - 获取同步状态
- `POST /sync/pull` - 拉取云端数据
- `POST /sync/push` - 推送本地数据
- `POST /sync/resolve/:id` - 解决冲突

## 🔧 开发指南

### 构建生产版本

```bash
# 构建所有包
pnpm build

# 仅构建前端
pnpm build:frontend

# 仅构建后端
pnpm build:backend
```

### 代码规范

```bash
# 运行 lint
pnpm lint

# 自动修复
pnpm lint --fix
```

### 数据库迁移

```bash
# 创建迁移
pnpm prisma migrate dev --name your_migration_name

# 重置数据库
pnpm prisma migrate reset

# 打开 Prisma Studio
pnpm prisma studio
```

## 📝 待办事项

- [ ] 完善前端登录/注册页面
- [ ] 实现完整的同步功能
- [ ] 添加 AI 流式响应支持
- [ ] 实现笔记导出功能
- [ ] 添加笔记分享功能
- [ ] 优化移动端体验
- [ ] 添加单元测试
- [ ] 添加 E2E 测试

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

感谢所有开源项目的贡献者！

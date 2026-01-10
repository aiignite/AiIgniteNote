# AiNote - AI 智能笔记应用

一个基于 React + TypeScript 的现代化 AI 智能笔记应用，采用 Monorepo 架构，支持多种编辑器、AI 深度集成、离线优先的数据同步。

## ✨ 核心特性

### 📝 多编辑器支持
- **Markdown 编辑器** - 基于 react-md-editor，支持实时预览、语法高亮、GFM
- **富文本编辑器** - 基于 TipTap，所见即所得，支持富文本格式、图片插入
- **代码编辑器** - 基于 Monaco Editor（VS Code 同款），多语言支持、智能提示
- **思维导图编辑器** - 基于 simple-mind-map，可视化编辑、拖拽操作、一键收起/展开
- **DrawIO 图表编辑器** - 支持流程图、UML 图表、架构图、网络拓扑图

### 🤖 AI 深度集成
- **多助手系统** - 内置 Markdown 助手、富文本助手、思维导图助手、DrawIO 助手等
- **流式对话** - 实时流式响应，支持中断和重新生成
- **上下文感知** - 编辑器选择内容自动发送到 AI，支持思维导图节点、DrawIO 元素
- **自定义助手** - 用户可创建自定义 AI 助手，设置 System Prompt 和模型参数
- **多种模型支持** - OpenAI、Anthropic、Ollama、LM Studio、智谱 GLM 等

### 🗂️ 智能组织
- **分类管理** - 灵活的分类系统，支持图标和颜色
- **标签系统** - 多标签支持，方便分类和查找
- **全文搜索** - 快速搜索笔记内容
- **版本历史** - 笔记版本控制，可查看和恢复历史版本
- **回收站** - 软删除机制，支持恢复已删除的笔记

### 💾 离线优先架构
- **IndexedDB 本地缓存** - 优先保存到本地，立即响应
- **PostgreSQL 云端同步** - 后台自动同步，支持离线使用
- **智能冲突解决** - 基于 `updatedAt` 时间戳，保留最新版本
- **自动同步** - 网络恢复时自动同步待同步数据

### 🎨 精美设计
- **编辑风格设计系统** - 温暖米白背景 + 深墨色 + 陶土红强调色
- **暗黑模式** - 支持亮色/暗色主题切换
- **响应式布局** - 适配桌面和移动设备
- **流畅动画** - 优雅的过渡效果和交互动画

### 🔒 安全可靠
- **JWT 认证** - 安全的身份验证机制
- **数据加密** - 敏感数据加密存储
- **权限控制** - 支持私有/公有/内置三种权限级别
- **软删除** - 数据安全保护

## 🏗️ 技术栈

### 前端技术
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Zustand** - 轻量级状态管理
- **React Router** - 路由管理
- **Ant Design** - UI 组件库
- **styled-components** - CSS-in-JS 样式

### 编辑器技术
- **react-md-editor** - Markdown 编辑器
- **TipTap** - 富文本编辑器
- **Monaco Editor** - 代码编辑器
- **simple-mind-map** - 思维导图编辑器
- **DrawIO** - 图表编辑器

### AI 集成
- **Vercel AI SDK** - AI 流式响应
- **react-markdown** - Markdown 渲染
- **Mermaid** - 图表渲染
- **KaTeX** - 数学公式渲染

### 数据存储
- **Dexie.js** - IndexedDB 封装（本地数据库）
- **axios** - HTTP 客户端

### 后端技术
- **Fastify** - 高性能 Web 框架
- **TypeScript** - 类型安全
- **Prisma** - 现代化 ORM
- **PostgreSQL** - 关系型数据库
- **JWT** - 身份认证
- **bcrypt** - 密码加密
- **node-fetch** - HTTP 客户端（调用 AI API）

### 开发工具
- **ESLint** - 代码检查
- **TypeScript** - 类型检查
- **pnpm** - 包管理器（Monorepo）

## 📦 项目结构

```
ainote/
├── packages/
│   ├── frontend/                 # 前端应用（React + Vite）
│   │   ├── src/
│   │   │   ├── components/       # React 组件
│   │   │   │   ├── Layout/      # 布局组件（MainLayout, Sidebar, Header）
│   │   │   │   ├── Note/        # 笔记组件（NoteList, NoteEditor 等）
│   │   │   │   ├── AIAssistant/ # AI 助手组件
│   │   │   │   ├── Editors/     # 多编辑器支持
│   │   │   │   │   ├── MarkdownEditor.tsx
│   │   │   │   │   ├── RichTextEditor.tsx
│   │   │   │   │   ├── MonacoEditor.tsx
│   │   │   │   │   ├── MindMapEditor.tsx
│   │   │   │   │   └── DrawIOEditor.tsx
│   │   │   │   └── Common/      # 通用组件
│   │   │   ├── pages/           # 页面组件
│   │   │   ├── store/           # Zustand 状态管理
│   │   │   ├── db/              # Dexie（IndexedDB）本地数据库
│   │   │   ├── lib/             # 核心库
│   │   │   │   ├── api/         # API 客户端
│   │   │   │   └── sync/        # 同步协调器
│   │   │   ├── hooks/           # React Hooks
│   │   │   ├── services/        # 服务层
│   │   │   ├── prompts/         # AI 提示词
│   │   │   ├── types/           # TypeScript 类型
│   │   │   └── styles/          # 设计系统
│   │   └── package.json
│   │
│   ├── backend/                  # 后端服务（Fastify）
│   │   ├── src/
│   │   │   ├── routes/          # API 路由（/api/v1/*）
│   │   │   ├── services/        # 业务逻辑层
│   │   │   ├── middleware/      # 中间件
│   │   │   └── utils/           # 工具函数
│   │   ├── prisma/
│   │   │   └── schema.prisma    # 数据模型
│   │   └── package.json
│   │
│   └── shared/                   # 共享代码
│       └── package.json
│
├── pnpm-workspace.yaml           # pnpm workspace 配置
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

**方式一：Windows 快速启动（推荐）** ⭐
```bash
# 启动所有服务（自动处理端口占用）
restart.bat

# 停止所有服务
stop.bat
```

**方式二：Linux/Mac 快速启动**
```bash
# 启动所有服务（自动处理端口占用）
./start.sh

# 停止所有服务
./stop.sh
```

**方式三：手动启动**
```bash
# 启动后端（在项目根目录）
cd packages/backend && npm run dev

# 启动前端（在项目根目录）
cd packages/frontend && npm run dev
```

6. 访问应用

#### 本地访问
- **前端**: http://localhost:3100
- **后端 API**: http://localhost:3001/api/v1
- **Prisma Studio**: http://localhost:5555

#### 局域网访问
- **前端**: http://192.168.201.97:3100
- **后端 API**: http://192.168.201.97:3001/api/v1

> **提示**: 局域网访问可以让同一网络下的其他设备访问你的开发环境。

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

## 🎯 功能演示

### 多编辑器切换
支持 5 种编辑器，根据笔记类型自动选择合适的编辑器：
- 📝 **Markdown** - 适合文档编写、技术博客
- 📄 **富文本** - 适合日常笔记、格式化文本
- 💻 **代码** - 适合代码片段、技术文档
- 🧠 **思维导图** - 适合头脑风暴、知识梳理
- 📊 **DrawIO** - 适合流程图、架构图、UML 图

### AI 助手集成
- **选择内容发送** - 在编辑器中选择文本/节点/元素，一键发送到 AI 助手
- **AI 响应导入** - 将 AI 生成的内容导入回编辑器
- **思维导图 AI** - AI 可以生成、优化、重组思维导图结构
- **DrawIO AI** - AI 可以生成流程图 XML、优化图表结构

### 离线优先体验
- ✅ 打开应用即可使用，无需等待网络
- ✅ 所有操作优先保存到本地
- ✅ 后台自动同步到云端
- ✅ 网络恢复时智能合并数据

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
- `POST /ai/conversations/:id/messages` - 发送消息（流式）
- `GET /ai/assistants` - 获取 AI 助手列表
- `POST /ai/assistants` - 创建自定义助手
- `PUT /ai/assistants/:id` - 更新助手
- `DELETE /ai/assistants/:id` - 删除助手

### 模型配置模块 `/api/v1/models`
- `GET /models` - 获取模型配置列表
- `POST /models` - 创建模型配置
- `PUT /models/:id` - 更新模型配置
- `DELETE /models/:id` - 删除模型配置
- `GET /models/:id/usage` - 获取使用统计

### 同步模块 `/api/v1/sync`
- `GET /sync/status` - 获取同步状态
- `POST /sync/pull` - 拉取云端数据
- `POST /sync/push` - 推送本地数据
- `POST /sync/resolve/:id` - 解决冲突

### 标签模块 `/api/v1/tags`
- `GET /tags` - 获取标签列表
- `POST /tags` - 创建标签
- `PUT /tags/:id` - 更新标签
- `DELETE /tags/:id` - 删除标签
- `POST /tags/:id/notes/:noteId` - 关联标签到笔记
- `DELETE /tags/:id/notes/:noteId` - 取消关联

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

## 🎨 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + S` | 保存当前笔记 |
| `Ctrl/Cmd + N` | 创建新笔记 |
| `Ctrl/Cmd + F` | 搜索笔记 |
| `Ctrl/Cmd + B` | 切换侧边栏 |
| `Ctrl/Cmd + /` | 切换 AI 助手 |
| `Ctrl/Cmd + Shift + A` | 发送选中内容到 AI |
| `Shift + Enter` | 输入框换行 |
| `Enter` | 发送消息（AI 助手） |

## 🔧 高级配置

### 配置 AI 模型

1. 进入设置页面 → 模型管理
2. 点击"添加模型"
3. 填写配置信息：
   - **模型名称**：如 "GPT-4"、"Claude-3"
   - **API 端点**：如 `https://api.openai.com/v1`
   - **API Key**：你的 API 密钥
   - **模型 ID**：如 `gpt-4`、`claude-3-opus`
   - **参数**：temperature、maxTokens、topP 等

### 本地模型支持

支持使用本地部署的模型：
- **Ollama** - 端点：`http://localhost:11434`
- **LM Studio** - 端点：`http://localhost:1234`

### 创建自定义 AI 助手

1. 进入 AI 助手面板
2. 点击"创建助手"
3. 填写助手信息：
   - **名称**：助手名称
   - **描述**：功能描述
   - **System Prompt**：系统提示词
   - **模型**：选择使用的模型
   - **参数**：调整 AI 参数
   - **图标**：选择头像图标

## 📚 架构设计

### 离线优先架构

项目采用**离线优先(Offline-First)**设计：

1. **优先本地响应** - 所有操作先保存到 IndexedDB
2. **后台自动同步** - 网络可用时自动同步到 PostgreSQL
3. **智能冲突解决** - 使用 `updatedAt` 时间戳保留最新版本
4. **待同步标记** - 使用 `_pendingSync` 标记待同步数据

详细文档：[CLAUDE.md](./CLAUDE.md)

### 多编辑器架构

通过 `EditorRegistry` 统一管理多个编辑器：
- 每个编辑器实现相同的接口 `EditorProps`
- 支持动态加载和按需渲染
- 编辑器与 AI 助手无缝集成

### AI 集成架构

- **上下文管理** - `contextManager` 统一管理对话上下文
- **流式响应** - 使用 Vercel AI SDK 实现实时流式输出
- **多格式支持** - 支持 Markdown、JSON（思维导图）、XML（DrawIO）
- **助手扩展** - 用户可创建自定义助手

## 🔍 故障排查

### 常见问题

**Q: 数据同步失败？**
- 检查网络连接
- 查看 IndexedDB 中的 `_pendingSync` 标记
- 使用 `/api/v1/sync/status` 查看同步状态

**Q: AI 响应流式中断？**
- 检查 API Key 是否正确
- 查看 Token 使用量是否超限
- 检查网络连接

**Q: 编辑器无法加载？**
- 检查 `EditorRegistry.ts` 中是否正确注册
- 确认依赖包是否正确安装
- 查看浏览器控制台错误

**Q: 离线时数据会丢失吗？**
- 不会。所有数据优先保存到 IndexedDB，联网后自动同步

## 📝 更新日志

### v1.0.0 (最新)
- ✨ 实现 5 种编辑器支持（Markdown、富文本、代码、思维导图、DrawIO）
- ✨ AI 深度集成，支持多助手、流式响应、上下文感知
- ✨ 离线优先架构，支持 IndexedDB + PostgreSQL 双向同步
- ✨ 版本历史、回收站、标签系统
- ✨ 暗黑模式、响应式设计
- ✨ 自定义 AI 助手和模型配置

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 提交信息格式

采用约定式提交（Conventional Commits）：

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型（type）：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试
- `chore`: 构建/工具链

示例：
```
feat(ai): add mindmap context builder

Implement context builder for mindmap editor to extract
node structure and send to AI assistant.

Closes #123
```

## 📄 许可证

MIT License

Copyright (c) 2025 AiNote

## 🙏 致谢

感谢以下开源项目：

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Fastify](https://fastify.dev/)
- [Prisma](https://www.prisma.io/)
- [Ant Design](https://ant.design/)
- [TipTap](https://tiptap.dev/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [simple-mind-map](https://wanglin2.github.io/mind-map/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Vercel AI SDK](https://sdk.vercel.ai/)

## 📮 联系方式

- 项目主页：[GitHub](https://github.com/yourusername/ainote)
- 问题反馈：[Issues](https://github.com/yourusername/ainote/issues)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

Made with ❤️ by AiNote Team

</div>

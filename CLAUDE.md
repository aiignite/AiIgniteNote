# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AiNote 是一个基于 React + TypeScript 的现代化 AI 智能笔记应用，采用 Monorepo 架构。前端使用 Vite 构建，后端使用 Fastify 框架，数据库采用 Prisma ORM。

## 常用命令

### 开发启动
```bash
# 安装依赖（使用 pnpm）
pnpm install

# 启动所有开发服务（前端+后端）
./start.sh

# 或分别启动
pnpm dev              # 前端 (localhost:5173)
pnpm dev:backend       # 后端 (localhost:3001)

# 停止所有服务
./stop.sh
```

### 构建
```bash
pnpm build              # 构建所有包
pnpm build:frontend     # 仅构建前端
pnpm build:backend      # 仅构建后端
```

### 数据库
```bash
cd packages/backend
pnpm prisma generate    # 生成 Prisma 客户端
pnpm prisma studio      # 打开 Prisma 可视化工具
pnpm prisma migrate dev # 运行迁移
```

### 代码检查
```bash
pnpm lint               # 运行 ESLint
```

## 架构说明

### Monorepo 结构
- `packages/frontend/` - React 前端应用
- `packages/backend/` - Fastify 后端服务
- `packages/shared/` - 共享类型和工具

### 前端架构
```
src/
├── components/
│   ├── Layout/              # 布局：MainLayout, Sidebar, Header
│   ├── Note/                # 笔记：NoteList, NoteEditor, RichTextEditor
│   ├── AIAssistant/         # AI助手：ChatInterface, AIAssistantSidebar
│   └── Editors/             # 编辑器注册表：支持 Markdown/富文本/DrawIO/思维导图
├── pages/                   # 页面路由
├── store/                   # Zustand 状态管理
├── db/                      # Dexie (IndexedDB) 本地数据库
├── lib/api/                 # API 客户端
└── styles/                  # 设计系统（design-tokens.ts 编辑风格）
```

### 后端架构
```
src/
├── routes/                  # API 路由（/api/v1/*）
│   ├── auth.routes.ts       # 认证
│   ├── notes.routes.ts      # 笔记 CRUD
│   ├── users.routes.ts      # 用户管理
│   └── ai.routes.ts         # AI 助手
├── services/                # 业务逻辑层
├── middleware/              # 中间件（认证、错误处理）
└── prisma/                  # 数据库 Schema
```

### 设计系统
项目使用**编辑/杂志风格**设计系统（`src/styles/design-tokens.ts`），与登录页面保持一致：
- 配色：温暖米白背景 (#F7F4EF) + 深墨色 (#1A1814) + 陶土红强调色 (#C85A3A)
- 字体：Georgia（标题）+ 系统无衬线（正文）
- 纹理：SVG 噪点叠加效果

### 状态管理
- **Zustand** 用于全局状态（authStore, noteStore, modelStore, settingsStore）
- 本地使用 **Dexie.js** (IndexedDB) 存储笔记、分类、对话历史
- 通过 `lib/api/` 与后端通信

### 关键流程
1. **登录流程**: LoginPage → authStore.login() → 存储token到localStorage → 导航到/notes
2. **笔记编辑**: NoteEditor → EditorRegistry 动态加载对应编辑器 → 自动保存到 Dexie
3. **AI 对话**: ChatInterface → aiStore.chatStream() → 存储对话到 Dexie

## 重要说明

### 演示账号
```
邮箱：demo@ainote.com
密码：demo123456
```

### API 基础路径
- 前端: `http://localhost:5173`
- 后端: `http://localhost:3001`
- API 路由前缀: `/api/v1`

### 类型定义
- 本地类型定义在 `src/types/` 中
- `NoteFileType` 枚举定义在 `types/local.ts` 中（避免循环引用）
- 主要接口：LocalNote, AIConversation, ModelConfig 等

### 编辑器扩展
通过 `src/components/Editors/EditorRegistry.ts` 注册不同类型的编辑器：
- MarkdownEditor (基于 react-md-editor)
- RichTextEditor (基于 TipTap)
- DrawIOEditor (DrawIO 集成)
- MindMapEditor (思维导图)

### 多格式笔记支持
笔记支持多种文件类型，通过 `fileType` 字段区分：
- `markdown` - Markdown 笔记
- `richtext` - 富文本笔记
- `drawio` - DrawIO 图表
- `mindmap` - 思维导图

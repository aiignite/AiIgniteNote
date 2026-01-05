# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AiNote 是一个基于 React + TypeScript 的现代化 AI 智能笔记应用，采用 Monorepo 架构。前端使用 Vite 构建，后端使用 Fastify 框架，数据库采用 Prisma ORM + PostgreSQL，采用**离线优先(Offline-First)**架构设计。

### 核心特性

- 📝 **多编辑器支持**：Markdown、富文本(TipTap)、代码(Monaco)、思维导图(simple-mind-map)、DrawIO 图表
- 🤖 **AI 深度集成**：多助手系统、流式对话、上下文感知、编辑器与 AI 助手无缝交互
- 🗂️ **智能组织**：分类管理、标签系统、全文搜索、版本历史
- 💾 **离线优先**：IndexedDB 本地缓存 + PostgreSQL 云端同步，支持离线使用
- 🎨 **精美设计**：编辑风格设计系统、暗黑模式、响应式布局
- 🔒 **安全可靠**：JWT 认证、数据加密、版本控制、软删除

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
│   ├── Note/                # 笔记：NoteList, NoteEditor, CategoryManager, RecycleBin, VersionHistory
│   ├── AIAssistant/         # AI助手：ChatInterface, AIAssistantSidebar, SelectionSettings, MarkdownRenderer
│   ├── Editors/             # 多编辑器支持
│   │   ├── BaseEditor.tsx   # 编辑器基类
│   │   ├── EditorRegistry.tsx # 编辑器注册表
│   │   ├── MarkdownEditor.tsx # Markdown 编辑器（react-md-editor）
│   │   ├── RichTextEditor.tsx # 富文本编辑器（TipTap）
│   │   ├── MonacoEditor.tsx   # 代码编辑器（Monaco Editor）
│   │   ├── MindMapEditor.tsx  # 思维导图编辑器（simple-mind-map）
│   │   └── DrawIOEditor.tsx   # DrawIO 图表编辑器
│   ├── BrandLogo/           # 品牌标识
│   └── Common/              # 通用组件：Modal 等
├── pages/                   # 页面：LoginPage, NotePage, SettingsPage, ModelManagementPage, RecycleBinPage
├── store/                   # Zustand 状态管理
│   ├── authStore.ts         # 认证状态
│   ├── noteStore.ts         # 笔记状态
│   ├── aiStore.ts           # AI 对话状态
│   ├── modelStore.ts        # 模型配置状态
│   ├── tagStore.ts          # 标签管理状态
│   ├── themeStore.ts        # 主题状态
│   ├── settingsStore.ts     # 设置状态
│   ├── fullscreenStore.ts    # 全屏状态
│   └── selectionSettingsStore.ts # 选择设置状态
├── db/                      # Dexie (IndexedDB) 本地数据库
├── lib/                     # 核心库
│   ├── api/                 # API 客户端
│   │   ├── client.ts        # Axios 客户端
│   │   ├── auth.ts          # 认证 API
│   │   ├── notes.ts         # 笔记 API
│   │   ├── categories.ts    # 分类 API
│   │   ├── tags.ts          # 标签 API
│   │   ├── models.ts        # 模型 API
│   │   ├── ai.ts            # AI API
│   │   ├── sync.ts          # 同步 API
│   │   ├── dataSync.ts      # 数据同步服务
│   │   ├── contextManager.ts # 上下文管理器
│   │   ├── mindmapContextBuilder.ts # 思维导图上下文构建
│   │   └── drawioContextBuilder.ts # DrawIO 上下文构建
│   └── sync/                # 同步协调器
├── hooks/                   # React Hooks
│   ├── useAutoSave.ts       # 自动保存
│   ├── useKeyboardShortcuts.tsx # 快捷键
│   ├── useTextSelection.ts  # 文本选择
│   └── useTheme.ts          # 主题切换
├── services/                # 服务层
│   ├── aiService.ts         # AI 服务
│   └── attachmentService.ts # 附件服务
├── prompts/                 # AI 提示词
│   ├── drawio-prompts.ts    # DrawIO 助手提示词
│   └── mindmap-prompts.ts   # 思维导图助手提示词
├── types/                   # TypeScript 类型定义
└── styles/                  # 设计系统（design-tokens.ts 编辑风格）
```

### 后端架构
```
src/
├── routes/                  # API 路由（/api/v1/*）
│   ├── auth.routes.ts       # 认证（注册、登录、登出、刷新 Token）
│   ├── notes.routes.ts      # 笔记 CRUD（含软删除、版本历史）
│   ├── users.routes.ts      # 用户管理
│   ├── categories.routes.ts # 分类管理
│   ├── tags.routes.ts        # 标签管理
│   ├── models.routes.ts     # 模型配置管理
│   ├── ai.routes.ts         # AI 助手（对话、助手管理）
│   └── sync.routes.ts       # 数据同步
├── services/                # 业务逻辑层
│   ├── ai.service.ts        # AI 服务（支持多种 API：OpenAI、Anthropic、Ollama、GLM 等）
│   └── auth.service.ts      # 认证服务
├── middleware/              # 中间件
│   └── auth.middleware.ts   # JWT 认证中间件
├── utils/                   # 工具函数
│   ├── config.ts            # 配置管理
│   ├── encryption.ts        # 数据加密
│   ├── jwt.ts               # JWT 工具
│   ├── permission.helper.ts # 权限辅助
│   └── prisma.ts            # Prisma 客户端
├── types/                   # 类型定义
└── prisma/                  # 数据库 Schema
    └── schema.prisma        # Prisma 模型定义
```

### 设计系统
项目使用**编辑/杂志风格**设计系统（`src/styles/design-tokens.ts`），与登录页面保持一致：
- 配色：温暖米白背景 (#F7F4EF) + 深墨色 (#1A1814) + 陶土红强调色 (#C85A3A)
- 字体：Georgia（标题）+ 系统无衬线（正文）
- 纹理：SVG 噪点叠加效果

### 状态管理

#### Zustand Store
- **authStore** - 用户认证状态（登录、token、用户信息）
- **noteStore** - 笔记管理（列表、编辑、分类、标签、回收站）
- **aiStore** - AI 对话状态（对话历史、助手选择、流式响应、选择内容）
- **modelStore** - 模型配置管理
- **tagStore** - 标签管理
- **categoryStore** - 分类管理（通过 noteStore 集成）
- **themeStore** - 主题状态（亮色/暗色）
- **settingsStore** - 应用设置
- **fullscreenStore** - 全屏状态
- **selectionSettingsStore** - 编辑器选择内容配置

#### 本地数据库
使用 **Dexie.js** (IndexedDB) 存储本地数据，支持离线使用：
- `notes` - 笔记本地缓存
- `categories` - 分类本地缓存
- `tags` - 标签本地缓存
- `aiAssistants` - AI 助手本地缓存
- `modelConfigs` - 模型配置本地缓存
- `conversations` - AI 对话历史
- `attachments` - 附件本地存储
- `noteVersions` - 笔记版本历史

所有本地数据都包含 `_pendingSync` 标记，用于离线同步。

#### 同步策略
- **离线优先**：先保存到 IndexedDB，后台自动同步到 PostgreSQL
- **自动同步**：网络恢复时、定期（30秒）自动同步待同步数据
- **冲突解决**：使用 `updatedAt` 时间戳，保留最新版本
- **数据合并**：启动时从 IndexedDB 快速加载，后台同步云端数据

### 关键流程

#### 1. 用户认证流程
```
LoginPage → authStore.login(email, password)
  → 后端验证 → JWT Token
  → 存储到 localStorage
  → 更新 authStore 状态
  → 导航到 /notes
```

#### 2. 笔记创建流程
```
用户点击"创建笔记" → 选择文件类型（markdown/richtext/monaco/mindmap/drawio）
  → noteStore.createNote(data)
  → 1. 生成临时 ID，保存到 IndexedDB（立即更新 UI）
  → 2. 设置 _pendingSync: true
  → 3. 后台调用 API 同步到 PostgreSQL
  → 4. 同步成功后更新为服务器 ID
  → 5. 导航到笔记编辑页面
```

#### 3. 笔记编辑流程
```
NotePage → EditorRegistry 动态加载对应编辑器
  → 用户编辑内容
  → useAutoSave Hook 监听变化
  → 防抖后自动保存到 IndexedDB
  → 设置 _pendingSync: true
  → 后台同步到 PostgreSQL
```

#### 4. AI 对话流程
```
用户在 AI 助手输入问题 → ChatInterface
  → aiStore.sendMessage(message, selectedContent?)
  → 调用后端 AI API (stream)
  → 流式返回响应 → 实时显示
  → 保存对话到 IndexedDB
  → 可选：从 AI 响应导入到编辑器（思维导图/DrawIO）
```

#### 5. 编辑器与 AI 助手交互
```
1. 在编辑器中选择内容（文本/节点/元素）
   - 文本编辑器：鼠标选中文本
   - 思维导图：选中节点 → 点击"发送"按钮
   - DrawIO：选中元素 → 点击"发送"按钮
2. 自动填充到 AI 助手输入框
3. 用户附加问题 → 发送
4. AI 响应 → 可选择导入回编辑器
```

#### 6. 离线同步流程
```
用户操作 → 保存到 IndexedDB（立即响应）
  → 设置 _pendingSync: true
  → 后台尝试同步到 PostgreSQL
  → 成功：清除标记
  → 失败：保留标记，等待下次同步
  → 网络恢复时：自动同步所有待同步数据
```

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
- 主要接口：LocalNote, AIConversation, ModelConfig, SelectedContent 等

## API 接口说明

### 认证模块 `/api/v1/auth`
```typescript
POST   /api/v1/auth/register     # 用户注册
POST   /api/v1/auth/login         # 用户登录
POST   /api/v1/auth/logout        # 用户登出
POST   /api/v1/auth/refresh       # 刷新 Token
GET    /api/v1/auth/me           # 获取当前用户信息
```

### 笔记模块 `/api/v1/notes`
```typescript
GET    /api/v1/notes              # 获取笔记列表（支持搜索、过滤、分页）
GET    /api/v1/notes/:id         # 获取笔记详情
POST   /api/v1/notes             # 创建笔记
PUT    /api/v1/notes/:id         # 更新笔记
DELETE /api/v1/notes/:id         # 删除笔记（软删除）
PATCH  /api/v1/notes/:id/restore # 恢复笔记
GET    /api/v1/notes/:id/versions # 获取版本历史
POST   /api/v1/notes/:id/favorite # 收藏/取消收藏
```

### 分类模块 `/api/v1/categories`
```typescript
GET    /api/v1/categories         # 获取分类列表
GET    /api/v1/categories/:id     # 获取分类详情
POST   /api/v1/categories         # 创建分类
PUT    /api/v1/categories/:id     # 更新分类
DELETE /api/v1/categories/:id     # 删除分类
```

### 标签模块 `/api/v1/tags`
```typescript
GET    /api/v1/tags               # 获取标签列表
POST   /api/v1/tags               # 创建标签
PUT    /api/v1/tags/:id           # 更新标签
DELETE /api/v1/tags/:id           # 删除标签
POST   /api/v1/tags/:id/notes/:noteId # 关联标签到笔记
DELETE /api/v1/tags/:id/notes/:noteId # 取消关联
```

### AI 模块 `/api/v1/ai`
```typescript
GET    /api/v1/ai/conversations   # 获取对话列表
POST   /api/v1/ai/conversations   # 创建对话
DELETE /api/v1/ai/conversations/:id # 删除对话
POST   /api/v1/ai/conversations/:id/messages # 发送消息（流式）
GET    /api/v1/ai/assistants      # 获取 AI 助手列表
POST   /api/v1/ai/assistants      # 创建自定义助手
PUT    /api/v1/ai/assistants/:id  # 更新助手
DELETE /api/v1/ai/assistants/:id  # 删除助手
```

### 模型配置模块 `/api/v1/models`
```typescript
GET    /api/v1/models             # 获取模型配置列表
POST   /api/v1/models             # 创建模型配置
PUT    /api/v1/models/:id         # 更新模型配置
DELETE /api/v1/models/:id         # 删除模型配置
GET    /api/v1/models/:id/usage   # 获取使用统计
```

### 同步模块 `/api/v1/sync`
```typescript
GET    /api/v1/sync/status        # 获取同步状态
POST   /api/v1/sync/pull         # 拉取云端数据
POST   /api/v1/sync/push         # 推送本地数据
POST   /api/v1/sync/resolve/:id   # 解决冲突
```

## 环境配置

### 后端环境变量 (`packages/backend/.env`)
```env
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/ainote?schema=public"
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-32-character-encryption-key
CORS_ORIGIN=http://localhost:5173
```

### 前端环境变量 (`.env`)
```env
VITE_API_BASE_URL=http://localhost:3001
```

## 开发指南

### 添加新功能

#### 1. 创建新的 Zustand Store
```typescript
// packages/frontend/src/store/newFeatureStore.ts
import { create } from 'zustand';

interface NewFeatureState {
  data: any[];
  setData: (data: any[]) => void;
}

export const useNewFeatureStore = create<NewFeatureState>((set) => ({
  data: [],
  setData: (data) => set({ data }),
}));
```

#### 2. 创建新的 API 接口
```typescript
// packages/frontend/src/lib/api/newFeature.ts
import { apiClient } from './client';

export const newFeatureApi = {
  getAll: () => apiClient.get('/newFeature'),
  getById: (id: string) => apiClient.get(`/newFeature/${id}`),
  create: (data: any) => apiClient.post('/newFeature', data),
  update: (id: string, data: any) => apiClient.put(`/newFeature/${id}`, data),
  delete: (id: string) => apiClient.delete(`/newFeature/${id}`),
};
```

#### 3. 创建后端路由
```typescript
// packages/backend/src/routes/newFeature.routes.ts
import { FastifyInstance } from 'fastify';

export async function newFeatureRoutes(fastify: FastifyInstance) {
  fastify.get('/newFeature', async (request, reply) => {
    // 获取列表逻辑
  });

  fastify.post('/newFeature', async (request, reply) => {
    // 创建逻辑
  });
}
```

#### 4. 更新 Prisma Schema
```prisma
// packages/backend/prisma/schema.prisma

model NewFeature {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("new_features")
}
```

### 添加新编辑器

1. 在 `src/components/Editors/` 创建新编辑器组件
2. 实现 `EditorProps` 接口
3. 在 `EditorRegistry.ts` 中注册
4. 更新 `NoteFileType` 枚举（如果需要）
5. 添加相应的 AI 助手（如果需要）

### 添加新 AI 助手

1. 在 `src/prompts/` 创建助手提示词文件
2. 在数据库中插入助手配置（或通过 API 创建）
3. 确保助手能够处理特定格式的数据（JSON/XML/Markdown）

## 故障排查

### 常见问题

#### 1. 数据同步失败
- 检查网络连接
- 查看 IndexedDB 中的 `_pendingSync` 标记
- 查看后端日志
- 使用 `/api/v1/sync/status` 查看同步状态

#### 2. AI 响应流式中断
- 检查 AI API 配置（API Key、Endpoint）
- 查看浏览器控制台错误
- 检查 Token 使用量是否超限
- 尝试重新生成响应

#### 3. 编辑器无法加载
- 检查 `EditorRegistry.ts` 中是否正确注册
- 查看浏览器控制台错误
- 确认依赖包是否正确安装
- 检查 `fileType` 字段是否匹配

#### 4. 登录失败
- 检查后端服务是否启动
- 确认 JWT_SECRET 配置正确
- 查看后端日志
- 清除浏览器缓存和 localStorage

### 日志查看

```bash
# 查看后端日志
./status.sh

# 或直接查看日志文件
tail -f logs/backend.log

# 查看前端日志（浏览器控制台）
# 打开开发者工具 → Console 标签
```

## 编辑器扩展

### 编辑器注册
通过 `src/components/Editors/EditorRegistry.ts` 注册不同类型的编辑器：

```typescript
interface EditorConfig {
  type: NoteFileType;
  component: React.ComponentType<EditorProps>;
  name: string;
  icon: string;
  description: string;
}
```

### 支持的编辑器

1. **MarkdownEditor** (基于 react-md-editor)
   - 实时预览
   - 语法高亮（rehype-highlight）
   - GFM 支持（remark-gfm）
   - 快捷键支持

2. **RichTextEditor** (基于 TipTap)
   - 所见即所得编辑
   - 富文本格式（粗体、斜体、标题、列表等）
   - 代码块高亮
   - 图片插入
   - 链接支持

3. **MonacoEditor** (基于 Monaco Editor)
   - VS Code 同款编辑器
   - 多语言支持（JavaScript、TypeScript、Python、Java 等）
   - 智能提示
   - 代码格式化
   - 多标签页支持

4. **MindMapEditor** (基于 simple-mind-map)
   - 可视化思维导图
   - 拖拽操作
   - 节点编辑
   - 一键收起/展开
   - 导出功能

5. **DrawIOEditor** (基于 DrawIO)
   - 流程图绘制
   - UML 图表
   - 架构图
   - 网络拓扑图
   - 多种图形元素

### AI 集成

所有编辑器都支持与 AI 助手交互：

- **选择内容发送**：将编辑器中选中的内容发送到 AI 助手
- **AI 响应导入**：将 AI 生成的内容导入回编辑器
  - Markdown：直接插入文本
  - 富文本：插入富文本内容
  - 思维导图：导入 JSON 格式的思维导图结构
  - DrawIO：导入 XML 格式的图表数据
  - Monaco：插入代码片段

### 多格式笔记支持

笔记支持多种文件类型，通过 `fileType` 字段区分（定义在 `types/local.ts`）：

```typescript
enum NoteFileType {
  MARKDOWN = 'markdown',    // Markdown 笔记
  RICHTEXT = 'richtext',    // 富文本笔记
  MONACO = 'monaco',        // 代码笔记
  DRAIO = 'drawio',         // DrawIO 图表
  MINDMAP = 'mindmap'       // 思维导图
}
```

每种文件类型：
- 存储在同一个 `notes` 表，通过 `fileType` 字段区分
- 使用不同的编辑器组件
- 存储在 `content` 和 `htmlContent` 字段（富文本和 DrawIO 使用 htmlContent）
- 支持版本历史
- 支持全文搜索
- 支持 AI 助手集成

## AI 助手系统

### 预设助手

项目内置多个 AI 助手（在 `src/prompts/` 和数据库中）：

1. **Markdown 助手** (`markdown-assistant`)
   - Markdown 格式优化
   - 文档结构建议
   - 语法检查

2. **富文本助手** (`richtext-assistant`)
   - 内容润色
   - 格式建议
   - 文档排版

3. **思维导图助手** (`mindmap-assistant`)
   - 生成思维导图 JSON
   - 优化节点结构
   - 添加子节点
   - 重组层级

4. **DrawIO 助手** (`drawio-assistant`)
   - 生成流程图 XML
   - 图表结构优化
   - 连线建议

5. **通用助手** (`general-assistant`)
   - 通用问答
   - 内容总结
   - 翻译等

### 上下文管理

- **mindmapContextBuilder**：构建思维导图上下文（节点结构、主题）
- **drawioContextBuilder**：构建 DrawIO 上下文（图形元素、连接关系）
- **contextManager**：统一管理 AI 对话上下文

### 自定义助手

用户可以创建自定义 AI 助手：
- 自定义名称和描述
- 自定义 System Prompt
- 选择 AI 模型和参数
- 设置头像图标
- 设为公有助手供其他人使用

### 流式响应

使用流式 API（Vercel AI SDK）实现实时响应：
- 逐步显示 AI 回复
- 支持中断和重新生成
- Token 使用统计
- 错误重试机制

## 权限系统

支持三种权限级别：

1. **私有**（默认）
   - 仅创建者可查看和编辑
   - 不同步到其他用户

2. **公有**
   - 其他用户可查看
   - 仅创建者可编辑
   - 适用于分享的笔记、助手、模型配置

3. **内置**
   - 系统预设的助手和分类
   - 所有用户可见
   - 不可编辑和删除
   - 标记 `isBuiltIn: true`

## 数据模型（PostgreSQL）

主要数据表：

1. **users** - 用户表
   - 认证信息（邮箱、密码哈希）
   - 用户信息（用户名、头像）
   - 偏好设置（JSON）
   - 邮箱验证状态

2. **notes** - 笔记表
   - 标题、内容、文件类型
   - 分类、标签关联
   - 收藏、软删除
   - 公开状态

3. **categories** - 分类表
   - 分类名称、图标、颜色
   - 排序
   - 公开状态

4. **tags** - 标签表
   - 标签名称、颜色
   - 公开状态

5. **note_tags** - 笔记-标签关联表（多对多）

6. **ai_assistants** - AI 助手表
   - 名称、描述、系统提示词
   - 模型配置
   - 排序、激活状态
   - 公开状态

7. **ai_conversations** - AI 对话表
   - 标题、关联笔记
   - 关联助手

8. **ai_messages** - AI 消息表
   - 角色（user/assistant/system）
   - 内容、Token 使用量
   - 模型信息

9. **model_configs** - 模型配置表
   - 模型名称、API 端点、API Key
   - 参数（temperature、maxTokens、topP）
   - 使用统计

10. **model_usage_logs** - 模型使用日志表
    - Token 使用统计
    - 成功/失败记录

11. **note_versions** - 笔记版本历史表
    - 版本号
    - 历史内容

12. **attachments** - 附件表
    - 文件信息
    - 存储路径

## 数据同步架构

### 离线优先原则

项目采用**离线优先(Offline-First)**架构设计：

1. **PostgreSQL 是标准数据源**
   - 所有权威数据存储在 PostgreSQL
   - IndexedDB 只是本地缓存和离线存储

2. **优先本地响应**
   - 用户操作立即保存到 IndexedDB
   - UI 立即响应，无需等待服务器
   - 后台自动同步到 PostgreSQL

3. **自动同步**
   - 网络可用时自动同步
   - 待同步数据使用 `_pendingSync` 标记
   - 同步成功后自动清除标记
   - 冲突解决使用 `updatedAt` 时间戳

### 同步策略

#### 创建操作
```typescript
// 1. 先保存到 IndexedDB（临时 ID）
const tempId = `note_${Date.now()}_${random}`;
await db.notes.add({ id: tempId, ...data, _pendingSync: true });

// 2. 立即更新 UI
set((state) => ({ notes: [...state.notes, { id: tempId, ...data }] }));

// 3. 后台同步到 PostgreSQL
try {
  const response = await api.createNote(data);
  // 4. 同步成功，更新为服务器 ID
  await db.notes.put({ ...response.data, _pendingSync: false });
} catch (error) {
  // 保留 _pendingSync 标记，等待下次同步
}
```

#### 更新操作
```typescript
// 1. 先更新 IndexedDB
await db.notes.update(id, { ...updates, updatedAt: Date.now(), _pendingSync: true });

// 2. 立即更新 UI
set((state) => ({
  notes: state.notes.map(n => n.id === id ? { ...n, ...updates } : n)
}));

// 3. 后台同步
try {
  await api.updateNote(id, updates);
  await db.notes.update(id, { _pendingSync: false });
} catch (error) {
  // 保留标记
}
```

#### 删除操作
```typescript
// 1. 软删除（更新 IndexedDB）
await db.notes.update(id, { isDeleted: true, _pendingSync: true });

// 2. 立即从 UI 移除
set((state) => ({ notes: state.notes.filter(n => n.id !== id) }));

// 3. 后台同步
try {
  await api.deleteNote(id);
  await db.notes.delete(id); // 真删除
} catch (error) {
  // 保留软删除状态
}
```

### 数据加载

```typescript
// 应用启动时
// 1. 先加载本地数据（快速显示 UI）
const localNotes = await db.notes.toArray();
set({ notes: localNotes });

// 2. 后台从服务器同步最新数据
syncFromServer().then(remoteNotes => {
  // 3. 合并数据（服务器优先）
  const merged = mergeData(localNotes, remoteNotes);
  set({ notes: merged });
});
```

### 冲突解决

使用 `updatedAt` 时间戳：
- 本地更新时间 > 服务器更新时间 → 上传本地数据
- 服务器更新时间 > 本地更新时间 → 使用服务器数据

详细文档：`DATA_SYNC_ARCHITECTURE.md`、`OFFLINE_FIRST_QUICK_START.md`

## 性能优化

### 前端优化

1. **代码分割**
   - 路由级别代码分割（React.lazy）
   - 编辑器按需加载

2. **虚拟滚动**
   - 笔记列表使用虚拟滚动
   - 长列表性能优化

3. **防抖节流**
   - 自动保存使用防抖（3秒）
   - 搜索使用防抖（500ms）
   - 快捷键使用节流

4. **缓存策略**
   - API 响应缓存（React Query）
   - IndexedDB 本地缓存
   - 图片懒加载

### 后端优化

1. **数据库索引**
   - 为常用查询字段添加索引
   - 复合索引优化

2. **分页查询**
   - 所有列表接口支持分页
   - 默认每页 20 条

3. **流式响应**
   - AI 响应使用流式传输
   - 减少首字节时间（TTFB）

4. **连接池**
   - Prisma 使用连接池
   - 限制最大连接数

### 同步优化

1. **批量同步**
   - 积累多个操作后批量上传
   - 减少请求次数

2. **增量同步**
   - 只同步有 `_pendingSync` 标记的数据
   - 减少数据传输量

3. **后台同步**
   - 使用 Web Worker 在后台同步
   - 不阻塞 UI

## 安全性

### 数据加密

```typescript
// src/utils/encryption.ts
import crypto from 'crypto';

function encrypt(text: string, key: string): string {
  const algorithm = 'aes-256-cbc';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string, key: string): string {
  const algorithm = 'aes-256-cbc';
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### 认证授权

- JWT Token 认证
- Refresh Token 自动刷新
- Token 过期时间控制
- API 请求签名（可选）

### 权限控制

- 基于角色的访问控制（RBAC）
- 资源级别权限检查
- 公开/私有数据隔离
- 用户数据隔离

### XSS 防护

- 使用 DOMPurify 清理 HTML
- Content Security Policy (CSP)
- 输入验证和转义

### CSRF 防护

- SameSite Cookie
- CSRF Token
- 验证 Referer 头

详细文档：`PERMISSION_MANAGEMENT.md`

## 测试

### 单元测试

```typescript
// 使用 Vitest + Testing Library
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('NoteEditor', () => {
  it('should render note title', () => {
    render(<NoteEditor note={mockNote} />);
    expect(screen.getByText(mockNote.title)).toBeInTheDocument();
  });
});
```

### 集成测试

```typescript
// 使用 Playwright
import { test, expect } from '@playwright/test';

test('create note flow', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('button:has-text("创建笔记")');
  await page.fill('input[placeholder="笔记标题"]', 'Test Note');
  await page.click('button:has-text("确定")');
  await expect(page.locator('text=Test Note')).toBeVisible();
});
```

### 手动测试清单

参考以下测试文档：
- `QUICK_TEST_GUIDE.md` - 快速测试指南
- `MINDMAP_AUTO_CONTEXT_TEST.md` - 思维导图自动上下文测试
- `EDITOR_AI_TEST_CHECKLIST.md` - 编辑器 AI 集成测试
- `FINAL_VERIFICATION.md` - 最终验证清单

## 部署

### Docker 部署

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 生产环境配置

```env
# 后端
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://user:password@host:5432/ainote"
JWT_SECRET=production-jwt-secret
ENCRYPTION_KEY=32-char-encryption-key
CORS_ORIGIN=https://your-domain.com

# 前端
VITE_API_BASE_URL=https://api.your-domain.com
```

详细文档：`DEPLOYMENT.md`

## 相关文档

### 架构文档
- `DATA_SYNC_ARCHITECTURE.md` - 数据同步架构
- `DATA_STORAGE_ARCHITECTURE.md` - 数据存储架构
- `IMPLEMENTATION_PLAN.md` - 实现计划
- `IMPLEMENTATION_SUMMARY.md` - 实现总结

### 功能文档
- `MINDMAP_AI_INTEGRATION.md` - 思维导图 AI 集成
- `EDITOR_AI_INTEGRATION.md` - 编辑器 AI 集成
- `MINDMAP_QUICK_START.md` - 思维导图快速开始
- `MINDMAP_USAGE.md` - 思维导图使用指南
- `MINDMAP_TROUBLESHOOTING.md` - 思维导图故障排查

### 主题文档
- `DARK_MODE_SUMMARY.md` - 暗黑模式总结
- `DARK_THEME_GUIDE.md` - 暗黑主题指南

### 修复文档
- `DATA_SYNC_FIX_PLAN.md` - 数据同步修复计划
- `DATA_SYNC_FIX_SUMMARY.md` - 数据同步修复总结
- `QUICK_FIX_CATEGORY_UPDATE.md` - 分类更新快速修复
- `REMOVE_BUILT_IN_ASSISTANTS.md` - 移除内置助手

### 其他文档
- `PERMISSION_MANAGEMENT.md` - 权限管理
- `SETTINGS_DESIGN.md` - 设置设计
- `SETTINGS_IMPLEMENTATION_SUMMARY.md` - 设置实现总结
- `SCRIPTS_GUIDE.md` - 脚本指南
- `OFFLINE_FIRST_QUICK_START.md` - 离线优先快速开始

## 贡献指南

### 代码规范

- 使用 ESLint + Prettier
- 遵循 TypeScript 最佳实践
- 组件使用函数式组件 + Hooks
- 使用命名导出而非默认导出

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型：
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

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + S` | 保存当前笔记 |
| `Ctrl/Cmd + N` | 创建新笔记 |
| `Ctrl/Cmd + F` | 搜索笔记 |
| `Ctrl/Cmd + B` | 切换侧边栏 |
| `Ctrl/Cmd + /` | 切换 AI 助手 |
| `Ctrl/Cmd + Shift + A` | 发送选中内容到 AI |

更多快捷键详情参考 `hooks/useKeyboardShortcuts.tsx`

## 常见问题 FAQ

### Q1: 如何切换主题？
A: 点击右上角设置图标 → 主题设置 → 选择"亮色"或"暗色"

### Q2: 如何创建自定义 AI 助手？
A: AI 助手面板 → "创建助手" → 填写名称、描述、System Prompt → 保存

### Q3: 离线时数据会丢失吗？
A: 不会。所有数据优先保存到本地 IndexedDB，联网后自动同步到服务器。

### Q4: 如何恢复删除的笔记？
A: 回收站页面 → 选择笔记 → "恢复"按钮

### Q5: 支持哪些 AI 模型？
A: 支持 OpenAI、Anthropic、Ollama、LM Studio、智谱 GLM 等多种模型。

### Q6: 如何配置 AI 模型？
A: 设置页面 → 模型管理 → "添加模型" → 填写 API Key 和参数

### Q7: 思维导图如何导出？
A: 思维导图编辑器 → 工具栏 → "导出" → 选择格式（PNG、SVG、JSON）

### Q8: 如何分享笔记给其他人？
A: 笔记详情页 → "设为公开" → 复制分享链接

## 版本历史

详见：`CHANGELOG.md`（如果存在）

## 许可证

MIT License

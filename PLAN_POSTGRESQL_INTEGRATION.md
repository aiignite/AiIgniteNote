# AiNote PostgreSQL 后端集成实施方案

## 一、项目概述

将现有的纯前端 AiNote 笔记应用改造为前后端分离架构，添加 PostgreSQL 数据库支持，实现用户认证、数据云存储和本地-云端混合同步功能。

## 二、技术选型

| 组件 | 技术方案 | 理由 |
|------|----------|------|
| 后端框架 | **Fastify** | 高性能、TypeScript 原生支持、与 Prisma 集成良好 |
| ORM | **Prisma** | 自动生成类型、迁移管理完善、PostgreSQL 支持优秀 |
| 认证 | **JWT + RefreshToken** | 无状态、前后端分离友好、支持多设备 |
| 数据库 | **PostgreSQL** | JSONB 支持、全文搜索、成熟稳定 |
| 前端状态 | **Zustand + React Query** | 本地状态 + 服务端状态的混合管理 |
| 本地存储 | **IndexedDB (Dexie.js)** | 保持现有方案，作为本地缓存和离线编辑支持 |

## 三、数据库表设计

### 3.1 ER 图

```
users (用户)
  ├─ notes (笔记)
  │   └─ note_versions (版本历史)
  │   └─ ai_conversations (对话)
  │       └─ ai_messages (消息)
  ├─ categories (分类)
  ├─ ai_assistants (AI助手配置)
  ├─ model_configs (模型配置)
  │   └─ model_usage_logs (调用日志)
  └─ refresh_tokens (刷新令牌)
```

### 3.2 核心表结构

#### users (用户表)
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    avatar TEXT,
    preferences JSONB,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### notes (笔记表)
```sql
CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    html_content TEXT,
    file_type TEXT DEFAULT 'markdown',
    metadata JSONB,
    tags TEXT[] DEFAULT '{}',
    is_deleted BOOLEAN DEFAULT false,
    is_favorite BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- 索引
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_category_id ON notes(category_id);
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX idx_notes_search ON notes USING GIN(to_tsvector('simple', title || ' ' || COALESCE(content, '')));
```

#### categories (分类表)
```sql
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    sort_order INTEGER DEFAULT 0,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, name)
);
```

#### ai_assistants (AI助手配置表)
```sql
CREATE TABLE ai_assistants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    avatar TEXT,
    model TEXT NOT NULL,
    temperature FLOAT,
    max_tokens INTEGER,
    sort_order INTEGER DEFAULT 0,
    is_built_in BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### ai_conversations (AI对话表)
```sql
CREATE TABLE ai_conversations (
    id TEXT PRIMARY KEY,
    title TEXT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_id TEXT REFERENCES notes(id) ON DELETE CASCADE,
    assistant_id TEXT REFERENCES ai_assistants(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### ai_messages (消息表)
```sql
CREATE TABLE ai_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    tokens_used INTEGER,
    model TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### model_configs (模型配置表)
```sql
CREATE TABLE model_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    api_key TEXT NOT NULL,
    api_endpoint TEXT NOT NULL,
    model TEXT NOT NULL,
    temperature FLOAT DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    top_p FLOAT DEFAULT 0.9,
    enabled BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### model_usage_logs (调用日志表)
```sql
CREATE TABLE model_usage_logs (
    id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL REFERENCES model_configs(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 四、API 接口设计

### 4.1 认证模块 `/api/v1/auth`
```
POST   /register          - 用户注册
POST   /login             - 用户登录
POST   /logout            - 用户登出
POST   /refresh           - 刷新Token
POST   /forgot-password   - 忘记密码
POST   /reset-password    - 重置密码
```

### 4.2 用户模块 `/api/v1/users`
```
GET    /me                - 获取当前用户信息
PUT    /me                - 更新用户信息
PUT    /me/password       - 修改密码
DELETE /me                - 删除账户
GET    /me/stats          - 用户统计数据
```

### 4.3 笔记模块 `/api/v1/notes`
```
GET    /notes             - 获取笔记列表（分页、筛选、搜索）
GET    /notes/:id         - 获取笔记详情
POST   /notes             - 创建笔记
PUT    /notes/:id         - 更新笔记
DELETE /notes/:id         - 删除笔记（软删除）
PATCH  /notes/:id/restore - 恢复笔记
GET    /notes/:id/versions - 获取版本历史
```

### 4.4 分类模块 `/api/v1/categories`
```
GET    /categories        - 获取分类列表
POST   /categories        - 创建分类
PUT    /categories/:id    - 更新分类
DELETE /categories/:id    - 删除分类
```

### 4.5 AI 模块 `/api/v1/ai`
```
GET    /conversations           - 获取对话列表
GET    /conversations/:id       - 获取对话详情
POST   /conversations           - 创建对话
DELETE /conversations/:id       - 删除对话
POST   /conversations/:id/messages - 发送消息（支持流式响应）

GET    /assistants              - 获取AI助手列表
POST   /assistants              - 创建自定义助手
PUT    /assistants/:id          - 更新助手
DELETE /assistants/:id          - 删除助手
```

### 4.6 模型配置模块 `/api/v1/models`
```
GET    /configs          - 获取模型配置列表
POST   /configs          - 创建模型配置
PUT    /configs/:id      - 更新配置
DELETE /configs/:id      - 删除配置
GET    /usage            - 获取使用统计
GET    /usage/logs       - 获取调用日志
```

### 4.7 同步模块 `/api/v1/sync`
```
GET    /status           - 获取同步状态
POST   /pull             - 拉取云端数据（增量）
POST   /push             - 推送本地数据
POST   /resolve/:id      - 解决冲突
```

## 五、本地-云端混合存储方案

### 5.1 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    前端应用层                            │
├─────────────────────────────────────────────────────────┤
│                   Zustand Store                         │
│            (状态管理、乐观更新)                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              同步协调器 (SyncCoordinator)                │
│   - 在线状态检测                                          │
│   - 冲突检测与解决                                        │
│   - 同步队列管理                                          │
└─────────────────────────────────────────────────────────┘
           │                              │
           ▼                              ▼
┌────────────────────┐          ┌─────────────────────────┐
│   IndexedDB        │          │   PostgreSQL Server     │
│   (Dexie.js)        │          │   (REST API)            │
│                    │          │                         │
│ - 本地缓存         │          │ - 主数据存储            │
│ - 离线编辑         │          │ - 多设备同步            │
│ - 快速访问         │          │ - 数据备份              │
└────────────────────┘          └─────────────────────────┘
```

### 5.2 同步策略

| 场景 | 同步方式 | 说明 |
|------|----------|------|
| 在线时创建/编辑 | 乐观更新 + 异步同步 | 先更新本地 UI 和 IndexedDB，后台同步到服务器 |
| 离线时编辑 | 本地存储 | 数据保存在 IndexedDB，标记为待同步 |
| 网络恢复 | 自动同步 | 检测待同步数据，批量推送到服务器 |
| 冲突检测 | 时间戳 + 用户选择 | 修改时间差 < 1 分钟视为冲突，提示用户选择 |

### 5.3 数据状态标记

每个笔记在 IndexedDB 中增加以下字段：
```typescript
interface SyncMetadata {
  syncedAt: number;      // 上次同步时间
  pendingSync: boolean;  // 是否有待同步更改
  serverVersion: number; // 服务器版本号
  conflict?: {           // 冲突信息
    localData: any;
    serverData: any;
  }
}
```

## 六、项目结构调整

### 6.1 新目录结构 (Monorepo)

```
ainote/
├── packages/
│   ├── frontend/              # 前端应用
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── lib/
│   │   │   │   ├── api/       # API 客户端
│   │   │   │   └── sync/      # 同步逻辑
│   │   │   ├── store/         # Zustand stores
│   │   │   ├── db/            # IndexedDB (Dexie)
│   │   │   └── types/
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   ├── backend/               # 后端服务
│   │   ├── src/
│   │   │   ├── routes/        # API 路由
│   │   │   ├── services/      # 业务逻辑
│   │   │   ├── middleware/    # 中间件 (认证、错误处理)
│   │   │   ├── utils/
│   │   │   └── types/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── package.json
│   │
│   └── shared/                # 共享代码
│       ├── src/
│       │   ├── types/         # 共享类型定义
│       │   ├── constants/
│       │   └── validators/
│       └── package.json
│
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.base.json
```

### 6.2 共享类型定义

`packages/shared/src/types/` 目录存放前后端共享的类型：
- `note.ts` - 笔记相关类型
- `user.ts` - 用户相关类型
- `ai.ts` - AI 相关类型
- `sync.ts` - 同步相关类型
- `index.ts` - 统一导出

## 七、实施步骤

### 阶段一：基础设施搭建（1-2周）

1. **项目重组**
   - [ ] 设置 pnpm workspace
   - [ ] 创建 packages 目录结构
   - [ ] 迁移前端代码到 `packages/frontend`
   - [ ] 创建 `packages/shared` 并提取类型定义

2. **后端项目初始化**
   - [ ] 初始化 Fastify + TypeScript 项目
   - [ ] 配置 ESLint、Prettier
   - [ ] 设置 Prisma + PostgreSQL 连接

3. **数据库搭建**
   - [ ] 编写 Prisma schema
   - [ ] 执行初始迁移
   - [ ] 创建种子数据（默认分类、内置 AI 助手）

### 阶段二：认证系统（1周）

1. **后端认证**
   - [ ] 实现 JWT 认证中间件
   - [ ] 创建用户注册/登录 API
   - [ ] 实现 Token 刷新机制
   - [ ] 密码加密 (bcrypt)

2. **前端认证集成**
   - [ ] 创建登录页面
   - [ ] 创建注册页面
   - [ ] 实现认证状态管理
   - [ ] 添加路由守卫

### 阶段三：核心 API 开发（2-3周）

1. **笔记 API**
   - [ ] CRUD 操作
   - [ ] 搜索（PostgreSQL 全文搜索）
   - [ ] 版本历史
   - [ ] 标签过滤

2. **分类 API**
   - [ ] CRUD 操作
   - [ ] 用户级分类管理

3. **AI 相关 API**
   - [ ] 对话管理
   - [ ] AI 助手配置 CRUD
   - [ ] 流式响应 (SSE)
   - [ ] 消息存储

4. **模型配置 API**
   - [ ] 配置 CRUD（API Key 加密存储）
   - [ ] 使用日志记录
   - [ ] 统计数据

### 阶段四：同步系统开发（2周）

1. **前端同步逻辑**
   - [ ] 实现同步协调器
   - [ ] 冲突检测策略
   - [ ] 离线队列管理
   - [ ] 网络状态监听

2. **后端同步支持**
   - [ ] 增量同步 API
   - [ ] 批量操作接口
   - [ ] 冲突解决端点

### 阶段五：测试和优化（1-2周）

1. **测试**
   - [ ] 后端单元测试
   - [ ] API 集成测试
   - [ ] 前端组件测试

2. **优化**
   - [ ] 数据库查询优化
   - [ ] 分页和懒加载
   - [ ] 错误处理完善

### 阶段六：部署（1周）

1. **准备**
   - [ ] Docker 配置
   - [ ] 环境变量管理
   - [ ] CI/CD 配置

2. **部署**
   - [ ] PostgreSQL 部署（推荐 Supabase/Neon）
   - [ ] 后端部署（Railway/Render/AWS）
   - [ ] 前端部署（Vercel/Netlify）

## 八、关键文件清单

### 需要新建的文件

```
packages/backend/src/
├── index.ts                    # 后端入口
├── routes/
│   ├── auth.routes.ts          # 认证路由
│   ├── notes.routes.ts         # 笔记路由
│   ├── categories.routes.ts    # 分类路由
│   ├── ai.routes.ts            # AI 路由
│   └── sync.routes.ts          # 同步路由
├── services/
│   ├── auth.service.ts         # 认证服务
│   ├── notes.service.ts        # 笔记服务
│   └── sync.service.ts         # 同步服务
├── middleware/
│   ├── auth.middleware.ts      # JWT 认证中间件
│   └── error.handler.ts        # 错误处理
└── utils/
    ├── jwt.ts                  # JWT 工具
    └── encryption.ts           # 加密工具

packages/frontend/src/lib/
├── api/
│   ├── client.ts               # API 客户端封装
│   └── queries.ts              # React Query hooks
└── sync/
    ├── coordinator.ts          # 同步协调器
    ├── conflictResolver.ts     # 冲突解决
    └── syncQueue.ts            # 同步队列

packages/shared/src/types/
├── note.ts                     # 笔记类型
├── user.ts                     # 用户类型
├── ai.ts                       # AI 类型
└── index.ts                    # 统一导出
```

### 需要修改的现有文件

```
src/types/index.ts              # 迁移到 shared 包并扩展
src/store/noteStore.ts          # 改造为混合模式
src/store/aiStore.ts            # 改造为混合模式
src/store/modelStore.ts         # 改造为混合模式
src/db/index.ts                 # 添加同步状态字段
package.json                    # 重组为 monorepo
```

## 九、安全考虑

1. **密码安全**：使用 bcrypt/argon2 哈希
2. **API Key 加密**：使用环境变量 + 数据库加密存储
3. **JWT 安全**：短期 AccessToken (15分钟) + 长期 RefreshToken (7天)
4. **CORS 配置**：严格限制允许的域名
5. **Rate Limiting**：防止 API 滥用
6. **输入验证**：使用 Zod 进行请求验证

## 十、部署建议

| 组件 | 推荐服务 | 说明 |
|------|----------|------|
| PostgreSQL | Supabase / Neon | 免费额度足够，易于管理 |
| 后端 | Railway / Render | 支持 Docker，自动部署 |
| 前端 | Vercel / Netlify | CDN 加速，零配置部署 |

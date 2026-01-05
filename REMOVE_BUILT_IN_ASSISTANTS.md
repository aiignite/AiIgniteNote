# 移除内置助手概念 - 完成总结

## 日期
2026-01-04

## 背景

用户明确要求："**不考虑内置的概念，都要从数据表获取**"

之前系统中有"内置助手"（Built-in Assistants）的概念，这些助手硬编码在前端代码中，与从 PostgreSQL 加载的用户自定义助手区分开。这导致了以下问题：

1. ❌ 数据源不统一（部分数据在代码中，部分在数据库）
2. ❌ 违反"PostgreSQL 是标准数据源"的架构原则
3. ❌ 数据不一致（数据库有3个，前端显示8个）
4. ❌ 无法统一管理公开/私有助手

## 解决方案

将所有助手统一为数据库驱动，使用 `isPublic` 字段区分：
- **公开助手** (`isPublic: true`) - 所有用户可见，由创建者拥有
- **私有助手** (`isPublic: false`) - 仅创建者可见

## 完成的工作

### 1. 前端 Store 修改 ✅

**文件**: `packages/frontend/src/store/aiStore.ts`

**修改内容**:
- ✅ 移除 `BUILT_IN_ASSISTANTS` 常量数组（原第54-114行）
- ✅ 更新 `AIAssistant` 接口：`isBuiltIn` → `isPublic`
- ✅ 完全重写 `loadAssistants()` 方法：
  - 只从 PostgreSQL 加载
  - 同步到 IndexedDB 作为缓存
  - 清理已删除的助手
- ✅ 更新 `createAssistant()` - 离线优先模式
- ✅ 简化 `updateAssistant()` - 移除 `isBuiltIn` 特殊处理
- ✅ 简化 `deleteAssistant()` - 移除 `isBuiltIn` 保护
- ✅ 更新 `sendDrawioToAI()` - 不再自动切换到内置助手
- ✅ 更新初始化代码 - 使用 `isPublic` 而非 `isBuiltIn`

### 2. 后端 Schema 修改 ✅

**文件**: `packages/backend/prisma/schema.prisma`

**修改内容**:
```diff
model AiAssistant {
  ...
  sortOrder     Int      @default(0) @map("sort_order")
- isBuiltIn     Boolean  @default(false) @map("is_built_in")
  isPublic      Boolean  @default(false) @map("is_public")
  ...
}
```

### 3. 数据库迁移 ✅

**迁移**: `20260104061913_remove_is_built_in_from_ai_assistants`

```sql
ALTER TABLE "ai_assistants" DROP COLUMN "is_built_in";
```

**状态**: 已创建并应用到 PostgreSQL

### 4. 前端 IndexedDB 修改 ✅

**文件**: `packages/frontend/src/db/index.ts`

**修改内容**:
- ✅ 添加数据库版本 7
- ✅ 更新 `aiAssistants` 表索引：移除 `isBuiltIn`
- ✅ 升级脚本删除所有 `isBuiltIn: true` 的助手数据

```typescript
// 版本 7
this.version(7)
  .stores({
    aiAssistants: "id, isPublic, isActive, sortOrder",
    // ...
  })
  .upgrade(async (tx) => {
    // 删除所有内置助手数据（它们将从 PostgreSQL 加载）
    const assistants = await tx.table<LocalAIAssistant>("aiAssistants").toArray();
    for (const assistant of assistants) {
      if ((assistant as any).isBuiltIn === true) {
        await tx.table<LocalAIAssistant>("aiAssistants").delete(assistant.id);
        console.log(`[DB] 已删除内置助手: ${assistant.name}`);
      }
    }
  });
```

### 5. 前端类型定义修改 ✅

**文件**: `packages/frontend/src/types/local.ts`

**修改内容**:
```diff
export interface LocalAIAssistant {
  ...
  maxTokens?: number;
- isBuiltIn?: boolean;
  isPublic?: boolean;
  isActive?: boolean;
  ...
+ // 同步相关字段（仅本地使用）
+ _pendingSync?: boolean;
}
```

## 数据流变化

### 修改前（在线优先 + 内置助手）

```
启动应用
  ↓
加载内置助手（硬编码）
  ↓
从 PostgreSQL 加载用户助手
  ↓
合并显示 → 8个助手（5个内置 + 3个数据库）
```

**问题**: 数据源不统一，违反架构原则

### 修改后（离线优先 + 纯数据库）

```
启动应用
  ↓
只从 PostgreSQL 加载所有助手
  ↓
同步到 IndexedDB（缓存）
  ↓
显示 → 3个助手（全部来自数据库）
```

**优势**:
- ✅ PostgreSQL 是唯一数据源
- ✅ 支持离线操作
- ✅ 数据一致性保证
- ✅ 统一的权限管理

## 助手分类

### 公开助手 (isPublic: true)
- 所有人可见
- 仅创建者可编辑
- 适合：通用助手、模板助手

### 私有助手 (isPublic: false)
- 仅创建者可见
- 仅创建者可编辑
- 适合：个人定制助手

## 测试验证

### 需要验证的场景

1. **数据加载**
   - [ ] 启动应用，只显示数据库中的助手
   - [ ] 不再有硬编码的内置助手

2. **创建助手**
   - [ ] 离线创建助手 → 立即显示
   - [ ] 联网后自动同步到 PostgreSQL

3. **更新助手**
   - [ ] 所有助手都可以更新（无"内置助手保护"）
   - [ ] 更新后正确同步

4. **删除助手**
   - [ ] 所有助手都可以删除（无"内置助手保护"）
   - [ ] 删除后正确同步

5. **权限管理**
   - [ ] 公开助手对其他用户可见
   - [ ] 私有助手仅创建者可见

### 迁移影响

数据库中现有的 3 个助手数据：
- 之前可能有 `is_built_in: true`
- 迁移后该字段被移除
- 数据保留，只是失去了 `is_built_in` 标记

**建议**: 如需将现有助手标记为公开，需要手动更新 `is_public` 字段

```sql
-- 示例：将现有助手标记为公开
UPDATE ai_assistants SET is_public = true WHERE id IN (...);
```

## 后续工作

1. ✅ 已完成：移除内置助手概念
2. 📝 待办：测试所有 CRUD 操作
3. 📝 待办：验证离线/在线切换
4. 📝 待办：确认 DrawIO 和思维导图助手功能

## 文件清单

### 修改的文件
- `packages/frontend/src/store/aiStore.ts` - 核心状态管理
- `packages/backend/prisma/schema.prisma` - 后端数据模型
- `packages/frontend/src/db/index.ts` - IndexedDB schema
- `packages/frontend/src/types/local.ts` - TypeScript 类型

### 新增的文件
- `packages/backend/prisma/migrations/20260104061913_remove_is_built_in_from_ai_assistants/migration.sql` - 数据库迁移

## 总结

通过这次重构：
- ✅ 统一了数据源（PostgreSQL）
- ✅ 简化了代码逻辑（移除特殊处理）
- ✅ 符合离线优先架构原则
- ✅ 为其他模块提供了可复制的模式

现在所有助手都来自 PostgreSQL，通过 `isPublic` 字段控制可见性，不再有"内置助手"的概念。

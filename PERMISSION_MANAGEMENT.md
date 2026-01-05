# AiNote 权限管理策略文档

## 概述

AiNote 采用**基于所有权的权限控制模型**，每个用户只能看到和操作自己的数据，同时支持**公有资源共享**功能。

---

## 1. 权限模型

### 1.1 数据所有权

**核心原则**：
- ✅ **私有数据** (`isPublic: false`): 只有创建者能看到和操作
- ✅ **公有数据** (`isPublic: true`): 所有人可见，但只有创建者可以修改/删除

### 1.2 权限矩阵

| 操作 | 私有数据 (自己的) | 私有数据 (他人的) | 公有数据 (自己的) | 公有数据 (他人的) |
|------|------------------|------------------|------------------|------------------|
| **查看 (Read)** | ✅ 允许 | ❌ 禁止 | ✅ 允许 | ✅ 允许 |
| **创建 (Create)** | ✅ 允许 | ❌ 无意义 | ✅ 允许 | ❌ 无意义 |
| **修改 (Update)** | ✅ 允许 | ❌ 禁止 | ✅ 允许 | ❌ 禁止 |
| **删除 (Delete)** | ✅ 允许 | ❌ 禁止 | ✅ 允许 | ❌ 禁止 |
| **复制 (Copy)** | ✅ 允许 | ❌ 禁止 | ✅ 允许 | ✅ 允许 |

---

## 2. 数据类型权限控制

### 2.1 笔记 (Notes)

**Schema**:
```prisma
model Note {
  // ...
  isPublic  Boolean  @default(false) @map("is_public")
  userId    String
  // ...
}
```

**权限规则**:
- **查看**: 用户自己的笔记 + 公有笔记
- **修改**: 只有创建者可以修改
- **删除**: 只有创建者可以删除
- **收藏**: 用户可以收藏任何可见的笔记（包括公有笔记）

**API 示例**:
```typescript
// 查询笔记
GET /api/v1/notes
where: {
  OR: [
    { userId: currentUserId },  // 用户自己的
    { isPublic: true }          // 公有的
  ]
}

// 修改笔记
PUT /api/v1/notes/:id
if (note.userId !== currentUserId) {
  return 403 Forbidden;
}

// 删除笔记
DELETE /api/v1/notes/:id
if (note.userId !== currentUserId) {
  return 403 Forbidden;
}
```

### 2.2 分类 (Categories)

**Schema**:
```prisma
model Category {
  // ...
  isPublic  Boolean  @default(false)
  userId    String
  // ...
}
```

**权限规则**:
- **查看**: 用户自己的分类 + 公有分类
- **修改**: 只有创建者可以修改
- **删除**: 只有创建者可以删除（需先将该分类下的笔记移到其他分类）

**使用场景**:
- 私有分类：个人整理（如"工作"、"学习"）
- 公有分类：团队共享（如"项目A"、"团队知识库"）

### 2.3 标签 (Tags)

**Schema**:
```prisma
model Tag {
  // ...
  isPublic  Boolean  @default(false)
  userId    String
  // ...
}
```

**权限规则**:
- **查看**: 用户自己的标签 + 公有标签
- **修改**: 只有创建者可以修改
- **删除**: 只有创建者可以删除

**使用场景**:
- 私有标签：个人标记（如"重要"、"待办"）
- 公有标签：团队标记（如"前端"、"后端"、"Bug"）

### 2.4 AI 助手 (AI Assistants)

**Schema**:
```prisma
model AiAssistant {
  // ...
  isPublic  Boolean  @default(false)
  isBuiltIn Boolean  @default(false)
  userId    String
  // ...
}
```

**权限规则**:
- **内置助手** (`isBuiltIn: true`): 所有用户可见，但只能在本地修改（不同步到服务器）
- **公有助手** (`isPublic: true`): 所有用户可见和使用，只有创建者可以修改
- **私有助手** (`isPublic: false`): 只有创建者可见和使用

**特殊逻辑**:
```typescript
// 内置助手只在本地生效
if (assistant.isBuiltIn) {
  // 只更新 IndexedDB
  await db.updateAssistant(id, updates);
  return;
}

// 公有/私有助手同步到服务器
await api.updateAssistant(id, updates);
```

### 2.5 模型配置 (Model Configs)

**Schema**:
```prisma
model ModelConfig {
  // ...
  isPublic  Boolean  @default(false)
  userId    String
  apiKey    String
  // ...
}
```

**权限规则**:
- **查看**: 用户自己的配置 + 公有配置
- **修改**: 只有创建者可以修改
- **删除**: 只有创建者可以删除
- **使用**: 用户可以使用任何可见的模型配置

**安全注意**:
⚠️ **API Key 安全**: 即使模型配置是公有的，API Key 也应该加密存储，只有创建者可以查看完整密钥。

---

## 3. 实现细节

### 3.1 后端实现

#### 权限辅助工具
```typescript
// utils/permission.helper.ts

/**
 * 构建查询条件：用户自己的 + 公有的
 */
export function buildUserQuery(userId: string) {
  return {
    OR: [
      { userId },        // 用户自己的数据
      { isPublic: true }, // 公有的数据
    ],
  };
}

/**
 * 检查是否有权修改
 */
export function canModify(resourceUserId: string, currentUserId: string): boolean {
  return resourceUserId === currentUserId;
}

/**
 * 检查是否有权删除
 */
export function canDelete(resourceUserId: string, currentUserId: string): boolean {
  return resourceUserId === currentUserId;
}

/**
 * 检查是否有权查看
 */
export function canView(
  resourceUserId: string,
  currentUserId: string,
  isPublic: boolean
): boolean {
  return resourceUserId === currentUserId || isPublic;
}
```

#### API 路由示例
```typescript
// GET /notes - 查询笔记
fastify.get("/", async (request, reply) => {
  const notes = await prisma.note.findMany({
    where: {
      ...buildUserQuery(req.userId), // 用户自己的 + 公有的
      isDeleted: false,
    },
  });
  return notes;
});

// PUT /notes/:id - 更新笔记
fastify.put("/:id", async (request, reply) => {
  const note = await prisma.note.findUnique({ where: { id } });

  // 检查权限
  if (!canModify(note.userId, req.userId)) {
    return reply.status(403).send({ error: "FORBIDDEN" });
  }

  // 执行更新
  const updated = await prisma.note.update({
    where: { id },
    data: request.body,
  });
  return updated;
});

// DELETE /notes/:id - 删除笔记
fastify.delete("/:id", async (request, reply) => {
  const note = await prisma.note.findUnique({ where: { id } });

  // 检查权限
  if (!canDelete(note.userId, req.userId)) {
    return reply.status(403).send({ error: "FORBIDDEN" });
  }

  // 执行删除
  await prisma.note.delete({ where: { id } });
  return { message: "Deleted successfully" };
});
```

### 3.2 前端实现

#### TypeScript 类型定义
```typescript
// types/local.ts

export interface LocalNote {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;  // 新增
  userId: string;
  // ...
}

export interface LocalCategory {
  id: string;
  name: string;
  isPublic: boolean;  // 新增
  userId: string;
  // ...
}

export interface LocalTag {
  id: string;
  name: string;
  isPublic: boolean;  // 新增
  userId: string;
  // ...
}

export interface LocalAIAssistant {
  id: string;
  name: string;
  isPublic: boolean;  // 新增
  isBuiltIn: boolean;
  userId: string;
  // ...
}

export interface ModelConfig {
  id: string;
  name: string;
  isPublic: boolean;  // 新增
  userId: string;
  // ...
}
```

#### IndexedDB Schema
```typescript
// db/index.ts

this.version(6)
  .stores({
    notes: "id, title, category, fileType, isPublic, isDeleted, isFavorite, createdAt, updatedAt",
    categories: "id, name, isPublic, createdAt",
    tags: "id, name, isPublic, createdAt",
    aiAssistants: "id, isBuiltIn, isPublic, isActive, sortOrder",
    modelConfigs: "id, name, isPublic, enabled",
  })
  .upgrade(async (tx) => {
    // 为现有数据添加 isPublic 字段，默认为 false
    const notes = await tx.table("notes").toArray();
    for (const note of notes) {
      if (note.isPublic === undefined) {
        await tx.table("notes").update(note.id, { isPublic: false });
      }
    }
    // 同样处理其他表...
  });
```

#### Store 立即同步策略
```typescript
// store/noteStore.ts

const createNote = async (noteData) => {
  // 1. 立即保存到 IndexedDB（优化体验）
  const localNote = await db.createNote({
    ...noteData,
    isPublic: false, // 默认私有
  });

  try {
    // 2. 立即同步到 PostgreSQL
    const response = await notesApi.createNote(localNote);

    // 3. 用服务器返回的 ID 更新本地
    await db.updateNote(localNote.id, {
      id: response.data.id,
      isPublic: response.data.isPublic,
    });

    return response.data;
  } catch (error) {
    // 同步失败，标记为待同步
    await db.updateNote(localNote.id, { _pendingSync: true });
    console.error("同步失败，已保存到本地");
    throw error;
  }
};

const updateNote = async (id, updates) => {
  const existing = await db.getNote(id);

  // 检查权限
  if (existing.userId !== currentUserId) {
    throw new Error("无权修改此笔记");
  }

  // 1. 立即更新 IndexedDB
  await db.updateNote(id, updates);

  // 2. 立即同步到 PostgreSQL
  try {
    await notesApi.updateNote(id, updates);
  } catch (error) {
    // 标记为待同步
    await db.updateNote(id, { _pendingSync: true, ...updates });
    throw error;
  }
};
```

---

## 4. UI 交互设计

### 4.1 公有/私有切换

**笔记编辑器**:
```tsx
<Form.Item label="可见范围">
  <Switch
    checked={isPublic}
    onChange={(checked) => setIsPublic(checked)}
    checkedChildren="公有"
    unCheckedChildren="私有"
  />
  <Text type="secondary">
    {isPublic
      ? "所有人可见，但只有你可以修改"
      : "只有你可以看到和修改"}
  </Text>
</Form.Item>
```

**分类管理**:
```tsx
<Tooltip title="公有分类：其他人可见但不可编辑">
  <Button
    icon={<isPublic ? GlobalOutlined : LockOutlined />}
    onClick={() => togglePublic(category)}
  >
    {isPublic ? "公有" : "私有"}
  </Button>
</Tooltip>
```

### 4.2 权限提示

**查看他人公有数据时**:
```tsx
{note.userId !== currentUserId && note.isPublic && (
  <Alert
    message="公有笔记"
    description="这是 {note.userName} 创建的公有笔记，你可以查看但无法修改"
    type="info"
    showIcon
  />
)}
```

**尝试修改时**:
```tsx
const handleEdit = () => {
  if (note.userId !== currentUserId) {
    message.warning("这是他人的笔记，您只能查看不能修改");
    return;
  }
  // 打开编辑器
  openEditor();
};
```

---

## 5. 数据同步策略

### 5.1 立即同步

**所有操作立即同步到 PostgreSQL**:
```typescript
// 创建/更新/删除操作
const operation = async () => {
  // 1. 本地立即保存
  await localDB.save(data);

  // 2. 服务器立即同步
  try {
    await api.sync(data);
    // 清除待同步标记
    await localDB.clearPendingSync(data.id);
  } catch (error) {
    // 标记为待同步，稍后重试
    await localDB.markPendingSync(data.id);
  }
};
```

### 5.2 离线支持

**离线时的处理**:
```typescript
// 检测网络状态
window.addEventListener('offline', () => {
  // 所有操作只保存到 IndexedDB
  enableOfflineMode();
});

window.addEventListener('online', () => {
  // 同步待处理的操作
  syncPendingChanges();
});

const syncPendingChanges = async () => {
  const pending = await db.getPendingSync();

  for (const item of pending) {
    try {
      await api.sync(item);
      await db.clearPendingSync(item.id);
    } catch (error) {
      console.error(`同步失败: ${item.id}`, error);
    }
  }
};
```

---

## 6. 安全考虑

### 6.1 数据隔离

- ✅ **用户数据完全隔离**: 查询时强制添加 `userId` 过滤
- ✅ **后端权限验证**: 所有 API 都验证用户身份和权限
- ✅ **禁止越权访问**: 不能通过修改 ID 访问他人数据

### 6.2 API Key 保护

```typescript
// 公有模型配置不返回完整 API Key
if (modelConfig.isPublic && modelConfig.userId !== currentUserId) {
  return {
    ...modelConfig,
    apiKey: "***HIDDEN***", // 隐藏 API Key
  };
}
```

### 6.3 前端防护

```typescript
// 前端也要验证权限，提前提示
const canEdit = (resource: any) => {
  return resource.userId === currentUserId;
};

<EditableArea
  disabled={!canEdit(note)}
  onEditAttempt={() => {
    if (!canEdit(note)) {
      message.warning("您没有权限修改此内容");
    }
  }}
/>
```

---

## 7. 常见问题

### Q1: 如何分享笔记给他人？

**A**: 将笔记设置为公有 (`isPublic: true`)，其他人就可以查看但不能修改。

### Q2: 如何创建团队共享的分类？

**A**: 创建分类时设置为公有，团队成员可以查看并使用该分类，但只有创建者可以编辑分类本身。

### Q3: 公有数据会被搜索引擎抓取吗？

**A**: 不会。公有数据只对登录用户可见，未登录用户无法访问。

### Q4: 如何修改他人的公有数据？

**A**: 不能。公有数据只能查看和使用，不能修改。如需修改，请联系创建者或创建副本。

### Q5: 删除公有分类会怎样？

**A**: 只有创建者可以删除分类。删除后，该分类下的笔记会被移到"未分类"分类。

---

## 8. 数据库迁移

### 添加 isPublic 字段

```bash
# 生成迁移
cd packages/backend
pnpm prisma migrate dev --name add_is_public_field

# 或手动执行 SQL
ALTER TABLE notes ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE categories ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE tags ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE ai_assistants ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE model_configs ADD COLUMN is_public BOOLEAN DEFAULT FALSE;

# 创建索引
CREATE INDEX notes_is_public_idx ON notes(is_public);
CREATE INDEX categories_is_public_idx ON categories(is_public);
CREATE INDEX tags_is_public_idx ON tags(is_public);
CREATE INDEX ai_assistants_is_public_idx ON ai_assistants(is_public);
CREATE INDEX model_configs_is_public_idx ON model_configs(is_public);
```

---

## 总结

AiNote 的权限管理遵循以下原则：

1. **用户数据隔离**: 每个用户只能看到自己的数据
2. **公有资源共享**: 支持创建公有数据供他人查看
3. **所有权保护**: 只有创建者可以修改和删除
4. **立即同步**: 所有操作立即同步到服务器
5. **离线支持**: 离线时保存到本地，联网后自动同步

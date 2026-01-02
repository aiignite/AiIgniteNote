# AiNote 数据同步策略说明

## 概述

AiNote 采用**本地优先 + 后端同步**的混合存储架构，结合了 **IndexedDB**（浏览器本地数据库）和 **PostgreSQL**（云端数据库），确保应用在离线和在线状态下都能正常工作。

## 数据类型与同步策略

| 数据类型 | 主存储 | 后端同步 | 离线可用 | 同步方向 |
|---------|--------|---------|---------|---------|
| 笔记 (Notes) | IndexedDB + PostgreSQL | ✅ | ✅ | 双向同步 |
| 分类 (Categories) | IndexedDB | ❌ | ✅ | 仅本地 |
| AI 对话 (Conversations) | IndexedDB | ❌ | ✅ | 仅本地 |
| 模型配置 (Model Configs) | PostgreSQL (主) + IndexedDB (缓存) | ✅ | ✅ (只读) | 后端→前端 |
| AI 助手 (AI Assistants) | PostgreSQL (主) + IndexedDB (缓存) | ✅ | ✅ | 双向同步 |

---

## 1. 笔记 (Notes)

### 存储策略：本地优先 + 后端双向同步

**特点：**
- 笔记优先保存到本地 IndexedDB，确保快速响应和离线可用
- 在线时自动同步到后端 PostgreSQL
- ID 以后端返回的为准（创建时）

#### CRUD 操作流程

**创建笔记**
```typescript
// 1. 先保存到 IndexedDB（本地 ID：temp_xxx）
const localNote = await db.createNote(noteData);

// 2. 如果在线，同步到后端，获取真实 ID
if (isOnline) {
  const response = await notesApi.createNote({...});
  const syncedNote = { ...localNote, id: response.data.id };
  await db.notes.put(syncedNote);
  return syncedNote;
}
// 3. 离线时返回本地笔记，标记待同步
```

**更新笔记**
```typescript
// 1. 先更新 IndexedDB
await db.updateNote(id, updates);

// 2. 如果在线，同步到后端
if (isOnline) {
  await notesApi.updateNote(id, updates);
}
```

**删除笔记**
```typescript
// 1. 本地软删除（isDeleted = true）
await db.deleteNote(id);

// 2. 如果在线，同步到后端
if (isOnline) {
  await notesApi.deleteNote(id);
}
```

---

## 2. 分类 (Categories)

### 存储策略：仅本地存储

- 仅存储在 IndexedDB
- 不同步到后端
- 用户个人组织结构，无需云端备份

---

## 3. AI 对话 (Conversations)

### 存储策略：仅本地存储

- 仅存储在 IndexedDB
- 不同步到后端（隐私考虑）
- 对话历史可能包含敏感信息，本地存储更安全

**注意：** 对话时调用的 AI API 仍然经过后端，但对话历史记录只保存在本地。

---

## 4. 模型配置 (Model Configs)

### 存储策略：后端为主 + 本地缓存

**特点：**
- PostgreSQL 为单一数据源
- IndexedDB 作为缓存层
- apiKey 仅存储在本地 IndexedDB（安全考虑）
- 内置模型不可删除

#### CRUD 操作流程

**加载配置**
```typescript
// 1. 从后端 API 获取最新配置
const remoteConfigs = await modelsApi.getConfigs();

// 2. 同步到 IndexedDB（保留本地的 apiKey）
for (const config of remoteConfigs) {
  const existing = await db.modelConfigs.get(config.id);
  if (existing) {
    await db.modelConfigs.update(config.id, {
      ...config,
      apiKey: existing.apiKey, // 保留本地 apiKey
    });
  } else {
    await db.modelConfigs.add({...config, apiKey: ""});
  }
}

// 3. 删除本地不存在于后端的配置
// 4. 返回合并后的配置列表
```

**创建配置**
```typescript
try {
  // 1. 调用后端 API 创建（获取 PostgreSQL 生成的 ID）
  const response = await modelsApi.createConfig(configData);
  
  // 2. 同步到 IndexedDB（保存用户输入的 apiKey）
  await db.modelConfigs.add({...response.data, apiKey: configData.apiKey});
  
  return response.data;
} catch (error) {
  // 3. 失败时：只存本地 + 标记 _pendingSync
  await db.modelConfigs.add({...configData, _pendingSync: true});
}
```

**更新配置**
```typescript
try {
  // 1. 调用后端 API 更新
  await modelsApi.updateConfig(id, updates);
  
  // 2. 同步到 IndexedDB
  await db.modelConfigs.update(id, updates);
} catch (error) {
  // 3. 失败时：只更新本地 + 标记 _pendingSync
  await db.modelConfigs.update(id, {...updates, _pendingSync: true});
}
```

**删除配置**
```typescript
try {
  // 1. 调用后端 API 删除
  await modelsApi.deleteConfig(id);
  
  // 2. 从 IndexedDB 删除
  await db.modelConfigs.delete(id);
} catch (error) {
  // 3. 失败时：从本地删除 + 标记 _pendingSync
  await db.modelConfigs.add({...existing, _deleted: true, _pendingSync: true});
}
```

---

## 5. AI 助手 (AI Assistants)

### 存储策略：后端为主 + 本地缓存

**特点：**
- PostgreSQL 为单一数据源（作为知识库资源）
- IndexedDB 作为缓存层
- 支持内置助手和自定义助手
- 内置助手不可删除

#### CRUD 操作流程

**加载助手**
```typescript
// 1. 从后端 API 获取最新助手
const remoteAssistants = await aiApi.getAssistants();

// 2. 同步到 IndexedDB
for (const assistant of remoteAssistants) {
  const existing = await db.aiAssistants.get(assistant.id);
  if (!existing) {
    await db.aiAssistants.add({...assistant});
  } else {
    await db.aiAssistants.update(assistant.id, {...assistant});
  }
}
```

**创建助手**
```typescript
try {
  // 1. 调用后端 API 创建
  const response = await aiApi.createAssistant(assistantData);
  
  // 2. 同步到 IndexedDB
  await db.aiAssistants.add({...response.data});
  
  return response.data;
} catch (error) {
  // 失败时：只存本地 + 标记 _pendingSync
  await db.aiAssistants.add({...assistantData, _pendingSync: true});
}
```

**更新助手**
```typescript
// 内置助手：只更新本地
if (assistant.isBuiltIn) {
  await db.updateAssistant(id, updates);
  return;
}

// 自定义助手：同步到后端
try {
  await aiApi.updateAssistant(id, updates);
  await db.updateAssistant(id, updates);
} catch (error) {
  await db.updateAssistant(id, {...updates, _pendingSync: true});
}
```

**删除助手**
```typescript
// 内置助手：不允许删除
if (assistant.isBuiltIn) {
  throw new Error("Cannot delete built-in assistant");
}

// 自定义助手：同步删除
try {
  await aiApi.deleteAssistant(id);
  await db.aiAssistants.delete(id);
} catch (error) {
  await db.aiAssistants.add({...existing, _deleted: true, _pendingSync: true});
}
```

---

## 离线支持

### 离线检测

应用监听浏览器的 `online` 和 `offline` 事件：

```typescript
window.addEventListener("online", () => {
  useNoteStore.getState().checkOnlineStatus();
  useNoteStore.getState().syncAllNotes(); // 自动同步笔记
});

window.addEventListener("offline", () => {
  useNoteStore.getState().checkOnlineStatus();
});
```

### 待同步标记

当后端 API 调用失败时，数据会被标记为 `_pendingSync: true`，表示需要同步：

| 字段 | 类型 | 说明 |
|------|------|------|
| `_pendingSync` | boolean | 标记为待同步状态 |
| `_deleted` | boolean | 标记为已删除（软删除） |

**注意：** 当前版本的 `_pendingSync` 机制已实现，但自动重试同步功能可在后续版本中完善。

---

## API 端点

### 笔记相关

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/v1/notes` | GET | 获取笔记列表 |
| `/api/v1/notes` | POST | 创建笔记 |
| `/api/v1/notes/:id` | PUT | 更新笔记 |
| `/api/v1/notes/:id` | DELETE | 删除笔记 |
| `/api/v1/notes/:id/restore` | POST | 恢复笔记 |
| `/api/v1/notes/sync` | POST | 批量同步笔记 |

### 模型配置相关

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/v1/models/configs` | GET | 获取模型配置列表 |
| `/api/v1/models/configs` | POST | 创建模型配置 |
| `/api/v1/models/configs/:id` | PUT | 更新模型配置 |
| `/api/v1/models/configs/:id` | DELETE | 删除模型配置 |

### AI 助手相关

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/v1/ai/assistants` | GET | 获取 AI 助手列表 |
| `/api/v1/ai/assistants` | POST | 创建 AI 助手 |
| `/api/v1/ai/assistants/:id` | PUT | 更新 AI 助手 |
| `/api/v1/ai/assistants/:id` | DELETE | 删除 AI 助手 |

### AI 对话相关

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/v1/ai/chat` | POST | 发送聊天消息（非流式） |
| `/api/v1/ai/chat/stream` | POST | 发送聊天消息（流式） |

---

## 数据流示意图

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户界面                                │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Zustand Store                              │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ noteStore   │  │ modelStore   │  │  aiStore     │          │
│  └─────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴──────────────┐
                    ▼                           ▼
┌─────────────────────────────┐  ┌─────────────────────────────┐
│        IndexedDB            │  │        API Client          │
│  ┌─────────────────────┐   │  │  ┌─────────────────────┐   │
│  │ Notes               │   │  │  │ /api/v1/notes       │   │
│  │ Conversations       │   │  │  │ /api/v1/models/...  │   │
│  │ ModelConfigs (缓存) │◄──┼──┼──┤ /api/v1/ai/...       │   │
│  │ AIAssistants (缓存) │◄──┼──┼──┤                     │   │
│  └─────────────────────┘   │  │  └─────────────────────┘   │
└─────────────────────────────┘  └─────────────────────────────┘
                                          │
                                          ▼
                            ┌─────────────────────────────┐
                            │         后端 API            │
                            │  (Fastify + PostgreSQL)    │
                            │  ┌─────────────────────┐   │
                            │  │ Notes 表             │   │
                            │  │ ModelConfigs 表      │   │
                            │  │ AIAssistants 表      │   │
                            │  └─────────────────────┘   │
                            └─────────────────────────────┘
```

---

## 开发注意事项

1. **模型配置和 AI 助手** 以后端为主，本地只作缓存
2. **apiKey 安全**：只存储在 IndexedDB，不发送到后端
3. **离线优先**：所有写操作先写本地，再同步后端
4. **ID 处理**：笔记创建时本地生成临时 ID，同步后使用后端 ID
5. **内置资源**：内置助手不可删除，内置模型不可删除

# AiNote 数据同步架构修复计划

## 📋 执行摘要

**核心原则**：PostgreSQL 是唯一正确的数据源，IndexedDB 作为离线缓存

**当前问题**：
1. 分类同步过于激进（清空 IndexedDB）
2. 分类不支持离线操作
3. AI 对话未同步到后端
4. 同步标记机制不统一

---

## 🎯 修复目标

- ✅ 所有数据以 PostgreSQL 为准
- ✅ IndexedDB 作为离线缓存
- ✅ 在线时优先同步到后端
- ✅ 离线时允许本地操作，标记为待同步
- ✅ 联网后自动同步待处理数据

---

## 📁 需要修改的文件清单

### 前端文件（4个）

1. **`packages/frontend/src/db/index.ts`**
   - 版本升级到 v6
   - 为 conversations 表添加同步标记字段

2. **`packages/frontend/src/store/noteStore.ts`**
   - 优化 loadCategories（增量同步）
   - 修改 createCategory（支持离线）
   - 修改 updateCategory（支持离线）
   - 修改 deleteCategory（支持离线）

3. **`packages/frontend/src/store/aiStore.ts`**
   - 添加 loadConversations 方法
   - 修改 createConversation（同步到后端）
   - 修改 addMessage（同步到后端）
   - 添加 syncPendingConversations 方法

4. **`packages/frontend/src/lib/api/ai.ts`**（新建）
   - 对话相关的 API 客户端方法

### 后端文件
- ✅ 后端 API 已完整实现，无需修改

---

## 🔧 详细实施步骤

### 步骤 1：数据库 Schema 升级

**文件**：`packages/frontend/src/db/index.ts`

#### 修改点 1.1：升级 conversations 表索引

**当前代码（第127行）**：
```typescript
conversations: "id, noteId, createdAt, updatedAt",
```

**修改为**：
```typescript
conversations: "id, noteId, assistantId, createdAt, updatedAt, pendingSync, synced, needsServerId",
```

#### 修改点 1.2：添加版本 6 升级脚本

**位置**：在 version(5) 之后添加

```typescript
// 版本 6：添加对话同步标记支持
this.version(6).upgrade(async (tx) => {
  const conversations = await tx.table("conversations").toArray();
  for (const conv of conversations) {
    await tx.table("conversations").update(conv.id, {
      assistantId: conv.assistantId || null,
      pendingSync: true,
      synced: false,
      needsServerId: true,
    });
  }
});
```

---

### 步骤 2：优化分类同步逻辑

**文件**：`packages/frontend/src/store/noteStore.ts`

#### 修改点 2.1：loadCategories - 增量同步

**位置**：第 147-184 行

**问题**：当前使用 `db.categories.clear()` 清空所有数据

**修改方案**：改为增量同步，保留未同步的本地分类

```typescript
if (isOnline) {
  try {
    const response = await notesApi.getCategories();
    const remoteCategories = response.data || [];
    const localCategories = await db.categories.toArray();

    const categoryMap = new Map();

    // 添加后端分类
    for (const rc of remoteCategories) {
      const syncedCategory = {
        ...rc,
        _synced: true,
        _pendingSync: false,
      };
      await db.categories.put(syncedCategory);
      categoryMap.set(rc.id, syncedCategory);
    }

    // 保留本地独有的未同步分类
    for (const lc of localCategories) {
      if (!categoryMap.has(lc.id) && (lc as any)._pendingSync) {
        categoryMap.set(lc.id, lc);
      }
    }

    set({ categories: Array.from(categoryMap.values()) });
    console.log(`[loadCategories] 已同步 ${remoteCategories.length} 个分类`);
  } catch (apiError) {
    console.error("Failed to load categories from backend:", apiError);
    throw apiError;
  }
}
```

#### 修改点 2.2：createCategory - 支持离线

**位置**：第 500-545 行

**当前**：离线时直接抛出错误

**修改为**：
```typescript
if (isOnline) {
  // 在线：直接创建到后端
  const response = await notesApi.createCategory({...});
  const newCategory = {
    ...response.data,
    _synced: true,
    _pendingSync: false,
  };
  await db.categories.add(newCategory as any);
  set((state) => ({ categories: [...state.categories, newCategory] }));
  return newCategory;
} else {
  // 离线：创建到本地，标记为待同步
  const category = await db.createCategory(categoryData);
  await db.categories.update(category.id, {
    _pendingSync: true,
    _synced: false,
    needsServerId: true,
  } as any);
  set((state) => ({ categories: [...state.categories, category] }));
  console.log("[createCategory] 离线创建，待同步");
  return category;
}
```

#### 修改点 2.3：updateCategory - 支持离线

**位置**：第 558-595 行

**修改为**：
```typescript
const category = categories.find((c) => c.id === id);
const isSynced = (category as any)._synced === true;

if (isOnline && isSynced) {
  await notesApi.updateCategory(id, updates);
  await db.updateCategory(id, updates);
} else {
  await db.updateCategory(id, { ...updates, _pendingSync: true } as any);
  if (!isOnline) {
    console.log("[updateCategory] 离线更新，待同步");
  }
}

set((state) => ({
  categories: state.categories.map((cat) =>
    cat.id === id ? { ...cat, ...updates } : cat
  ),
}));
```

#### 修改点 2.4：deleteCategory - 支持离线

**位置**：第 597-640 行

**修改为**：类似 updateCategory 的逻辑

---

### 步骤 3：实现 AI 对话同步

#### 修改点 3.1：创建 AI API 客户端

**新建文件**：`packages/frontend/src/lib/api/ai.ts`

```typescript
import { apiClient } from "./client";

export const aiApi = {
  getConversations: (params?: { noteId?: string; page?: number; limit?: number }) =>
    apiClient.get("/ai/conversations", { params }),

  getConversation: (id: string) =>
    apiClient.get(`/ai/conversations/${id}`),

  createConversation: (data: { noteId?: string; assistantId?: string; title?: string }) =>
    apiClient.post("/ai/conversations", data),

  deleteConversation: (id: string) =>
    apiClient.delete(`/ai/conversations/${id}`),

  addMessage: (conversationId: string, message: { role: string; content: string }) =>
    apiClient.post(`/ai/conversations/${conversationId}/messages`, message),
};
```

#### 修改点 3.2：aiStore.ts 添加方法

**文件**：`packages/frontend/src/store/aiStore.ts`

**添加以下方法**：

1. **loadConversations** - 从后端加载对话列表
2. **修改 createConversation** - 在线时创建到后端
3. **修改 addMessage** - 同步消息到后端
4. **syncPendingConversations** - 同步待处理的对话

---

### 步骤 4：添加同步监听器

**文件**：`packages/frontend/src/main.tsx` 或 `App.tsx`

```typescript
// 监听网络状态变化
window.addEventListener("online", async () => {
  console.log("[App] 网络已恢复，开始同步");
  await noteStore.syncPendingNotes();
  await noteStore.syncPendingCategories();
  await aiStore.syncPendingConversations();
});
```

---

## 🧪 测试验收

### 分类同步测试
- [ ] 在线创建分类 → 验证出现在后端
- [ ] 离线创建分类 → 验证标记为待同步
- [ ] 联网后 → 验证自动同步到后端
- [ ] 更新/删除分类 → 验证同步逻辑

### AI对话同步测试
- [ ] 创建对话 → 验证保存到后端
- [ ] 添加消息 → 验证消息同步
- [ ] 换设备登录 → 验证对话历史恢复
- [ ] 离线对话 → 验证联网后同步

### 数据一致性测试
- [ ] 同时修改 → 验证冲突处理
- [ ] 网络中断 → 验证数据不丢失
- [ ] 重复同步 → 验证幂等性

---

## 📊 预期效果

| 项目 | 修复前 | 修复后 |
|------|--------|--------|
| 分类离线操作 | ❌ 直接报错 | ✅ 支持，标记待同步 |
| 分类同步策略 | ⚠️ 清空重建 | ✅ 增量同步 |
| AI对话同步 | ❌ 仅本地 | ✅ 同步到PostgreSQL |
| 换设备数据 | ❌ 丢失 | ✅ 完整恢复 |
| 数据源 | ⚠️ 不一致 | ✅ PostgreSQL为准 |

---

## ⏱️ 预估时间

- 步骤 1（数据库升级）：30分钟
- 步骤 2（分类同步）：1小时
- 步骤 3（AI对话同步）：1.5小时
- 步骤 4（同步监听）：30分钟
- 测试验证：1小时

**总计**：约 4 小时

---

## ✅ 验收标准

- [ ] 分类支持离线创建/更新/删除
- [ ] AI对话历史完整同步到PostgreSQL
- [ ] 换设备后对话历史可恢复
- [ ] 所有数据以PostgreSQL为准
- [ ] 离线操作标记为待同步
- [ ] 联网后自动同步待处理数据
- [ ] 同步失败有明确的错误提示
- [ ] 无数据丢失风险

---

## 📝 注意事项

1. **向后兼容**：数据库升级要考虑旧数据
2. **错误处理**：所有同步操作要有完善的错误处理
3. **用户提示**：同步状态要给用户明确反馈
4. **性能优化**：大量数据同步时避免阻塞 UI

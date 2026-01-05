# 离线优先数据同步 - 快速实施指南

## 目标

将所有数据模块改为"离线优先"模式，确保：
1. ✅ PostgreSQL 是标准数据源
2. ✅ IndexedDB 是本地缓存
3. ✅ 离线时可用
4. ✅ 自动同步

## 修复模板

### 1. 创建操作（Create）

```typescript
// ❌ 错误：在线优先
async create(data) {
  const response = await api.create(data);
  await db.add(response.data);
  return response.data;
}

// ✅ 正确：离线优先
async create(data) {
  const now = Date.now();
  const tempId = `${tableName}_${now}_${Math.random().toString(36).substring(2, 9)}`;

  // 1. 先保存到本地
  const localData = {
    ...data,
    id: tempId,
    createdAt: now,
    updatedAt: now,
    _pendingSync: true,  // 待同步标记
  };
  await db.add(localData);

  // 2. 立即更新 UI
  set((state) => ({
    items: [...state.items, localData],
  }));

  // 3. 后台尝试同步
  try {
    const response = await api.create(localData);
    const syncedData = {
      ...localData,
      id: response.data.id,
      _pendingSync: undefined,  // 清除标记
    };
    await db.put(syncedData);

    // 更新 UI 使用服务器 ID
    set((state) => ({
      items: state.items.map(item =>
        item.id === tempId ? syncedData : item
      ),
    }));

    return syncedData;
  } catch (error) {
    console.error('同步失败，保留待同步标记');
    return localData;
  }
}
```

### 2. 更新操作（Update）

```typescript
// ❌ 错误：在线优先
async update(id, updates) {
  await api.update(id, updates);
  await db.update(id, updates);
  set((state) => ({
    items: state.items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ),
  }));
}

// ✅ 正确：离线优先
async update(id, updates) {
  const now = Date.now();

  // 1. 先更新本地
  await db.update(id, {
    ...updates,
    updatedAt: now,
    _pendingSync: true,  // 待同步标记
  });

  // 2. 立即更新 UI
  set((state) => ({
    items: state.items.map(item =>
      item.id === id ? { ...item, ...updates, updatedAt: now } : item
    ),
  }));

  // 3. 后台尝试同步
  try {
    await api.update(id, updates);
    await db.update(id, { _pendingSync: undefined });
  } catch (error) {
    console.error('同步失败，保留待同步标记');
  }
}
```

### 3. 删除操作（Delete）

```typescript
// ❌ 错误：在线优先
async delete(id) {
  await api.delete(id);
  await db.delete(id);
  set((state) => ({
    items: state.items.filter(item => item.id !== id),
  }));
}

// ✅ 正确：离线优先
async delete(id) {
  // 1. 先删除本地
  await db.delete(id);

  // 2. 立即更新 UI
  set((state) => ({
    items: state.items.filter(item => item.id !== id),
  }));

  // 3. 后台尝试同步
  try {
    await api.delete(id);
  } catch (error) {
    console.error('删除同步失败');
  }
}
```

## 需要修复的模块清单

### 1. noteStore.ts

**文件**: `packages/frontend/src/store/noteStore.ts`

**需要修复的方法**:
- [ ] `createNote()` - 创建笔记
- [ ] `updateNote()` - 更新笔记
- [ ] `deleteNote()` - 删除笔记

**注意事项**:
- 笔记有版本历史，需要额外处理
- 需要同步 `htmlContent`, `metadata` 等字段
- 标签关联也需要同步

**示例修复**:
```typescript
createNote: async (noteData) => {
  const now = Date.now();
  const tempId = `note_${now}_${Math.random().toString(36).substring(2, 9)}`;

  const localNote = {
    ...noteData,
    id: tempId,
    createdAt: now,
    updatedAt: now,
    version: 1,
    pendingSync: true,
  };

  // 先保存到本地
  await db.notes.add(localNote);
  await db.createNoteVersion(localNote);

  // 更新状态
  set((state) => ({
    notes: [...state.notes, localNote],
  }));

  // 后台同步
  try {
    const response = await notesApi.create(localNote);
    const syncedNote = {
      ...localNote,
      id: response.data.id,
      pendingSync: undefined,
    };
    await db.notes.put(syncedNote);
    set((state) => ({
      notes: state.notes.map(n =>
        n.id === tempId ? syncedNote : n
      ),
    }));
    return syncedNote;
  } catch (error) {
    return localNote;
  }
}
```

### 2. tagStore.ts

**文件**: `packages/frontend/src/store/tagStore.ts`

**需要修复的方法**:
- [ ] `createTag()` - 创建标签
- [ ] `updateTag()` - 更新标签
- [ ] `deleteTag()` - 删除标签
- [ ] `setNoteTags()` - 设置笔记标签关联

**注意事项**:
- 多对多关系需要特殊处理
- `noteTags` 表也需要同步

### 3. categoryStore.ts

**文件**: `packages/frontend/src/store/categoryStore.ts`

**需要修复的方法**:
- [ ] `createCategory()` - 创建分类
- [ ] `updateCategory()` - 更新分类
- [ ] `deleteCategory()` - 删除分类

### 4. modelStore.ts

**文件**: `packages/frontend/src/store/modelStore.ts`

**需要修复的方法**:
- [ ] `createModelConfig()` - 创建模型配置
- [ ] `updateModelConfig()` - 更新模型配置
- [ ] `deleteModelConfig()` - 删除模型配置

**注意事项**:
- API Key 是敏感信息，需要考虑加密
- `isPublic` 字段需要正确处理

## API 接口检查清单

确保所有 API 接口都包含完整字段：

### notes API
```typescript
// packages/frontend/src/lib/api/notes.ts
createNote: (data: {
  title: string;
  content: string;
  htmlContent?: string;  // ✅ 检查
  fileType: string;
  categoryId: string;
  tags?: string[];       // ✅ 检查
  isPublic?: boolean;   // ✅ 检查
  metadata?: any;       // ✅ 检查
}) => apiClient.post('/notes', data),
```

### categories API
```typescript
// packages/frontend/src/lib/api/categories.ts
createCategory: (data: {
  name: string;
  icon?: string;
  color?: string;
  isPublic?: boolean;   // ✅ 检查
}) => apiClient.post('/categories', data),
```

### tags API
```typescript
// packages/frontend/src/lib/api/tags.ts
createTag: (data: {
  name: string;
  color?: string;
  isPublic?: boolean;   // ✅ 检查
}) => apiClient.post('/tags', data),
```

### models API
```typescript
// packages/frontend/src/lib/api/models.ts
createModelConfig: (data: {
  name: string;
  apiKey: string;
  apiEndpoint: string;
  // ... 其他字段
  isPublic?: boolean;   // ✅ 检查
}) => apiClient.post('/models', data),
```

## IndexedDB Schema 检查

确保所有表都有必需字段：

```typescript
// packages/frontend/src/db/index.ts

interface SyncableData {
  id: string;
  createdAt: number;
  updatedAt: number;
  _pendingSync?: boolean;  // ✅ 必需
  userId?: string;         // ✅ 必需（除了内置数据）
  isPublic?: boolean;      // ✅ 必需
}
```

## 数据验证清单

修复每个模块后，验证：

### 创建测试
```bash
# 1. 离线创建数据（断网或关闭后端）
# 2. 检查 IndexedDB 是否保存
# 3. 联网后检查是否自动同步
# 4. 检查 PostgreSQL 是否有数据
```

### 更新测试
```bash
# 1. 离线更新数据
# 2. 检查 IndexedDB 是否更新
# 3. 联网后检查是否同步
# 4. 检查 PostgreSQL 是否更新
```

### 删除测试
```bash
# 1. 离线删除数据
# 2. 检查 UI 是否立即移除
# 3. 联网后检查是否同步
# 4. 检查 PostgreSQL 是否删除
```

## 实施步骤

### 第 1 步：修复 noteStore.ts（最重要）

```bash
# 1. 备份当前文件
cp packages/frontend/src/store/noteStore.ts \
   packages/frontend/src/store/noteStore.ts.backup

# 2. 按照模板修复 createNote, updateNote, deleteNote

# 3. 测试
# - 创建笔记
# - 更新笔记
# - 删除笔记
# - 离线操作
# - 联网同步
```

### 第 2 步：修复其他 Store

按照优先级：
1. `tagStore.ts` - 标签使用频繁
2. `categoryStore.ts` - 分类使用频繁
3. `modelStore.ts` - 模型配置较少修改

### 第 3 步：添加自动同步

```typescript
// packages/frontend/src/App.tsx 或 main.tsx

import { dataSyncService } from './lib/api/dataSync';

useEffect(() => {
  // 应用启动时同步
  dataSyncService.syncAllPending();
}, []);

// 网络恢复时同步
window.addEventListener('online', () => {
  dataSyncService.syncAllPending();
});

// 定期同步（每 30 秒）
setInterval(() => {
  if (navigator.onLine) {
    dataSyncService.syncAllPending();
  }
}, 30000);
```

### 第 4 步：添加同步指示器

```typescript
// packages/frontend/src/components/SyncIndicator.tsx

export function SyncIndicator() {
  const [syncStatus, setSyncStatus] = useState('synced');

  useEffect(() => {
    // 监听同步状态
    // 显示：已同步 / 同步中 / 离线
  }, []);

  return (
    <div className="sync-indicator">
      {syncStatus === 'synced' && '✅ 已同步'}
      {syncStatus === 'syncing' && '🔄 同步中...'}
      {syncStatus === 'offline' && '📴 离线模式'}
    </div>
  );
}
```

## 常见问题

### Q1: 临时 ID 会导致问题吗？

**A**: 不会。创建时生成临时 ID，同步成功后用服务器 ID 替换。用户无感知。

### Q2: 如果同步失败怎么办？

**A**: `_pendingSync` 标记保持为 `true`，下次联网时自动重试。

### Q3: 如何处理冲突？

**A**: 使用 `updatedAt` 时间戳：
- 本地更新时间 > 服务器更新时间 → 上传本地数据
- 服务器更新时间 > 本地更新时间 → 使用服务器数据

### Q4: 内置数据需要同步吗？

**A**: 不需要。`isBuiltIn: true` 的数据只保存在本地，不上传到服务器。

## 验收标准

每个模块修复完成后，确认：

- [x] 离线时可以创建数据
- [x] 离线时可以更新数据
- [x] 离线时可以删除数据
- [x] 联网后自动同步
- [x] 同步成功后清除 `_pendingSync` 标记
- [x] 同步失败保留 `_pendingSync` 标记
- [x] UI 响应速度快（< 100ms）
- [x] PostgreSQL 数据正确

## 进度跟踪

- [x] `aiStore.ts` - ✅ 已完成
- [ ] `noteStore.ts` - 待修复
- [ ] `tagStore.ts` - 待修复
- [ ] `categoryStore.ts` - 待修复
- [ ] `modelStore.ts` - 待修复

完成时间预估：每个模块约 30-60 分钟。

## 参考资料

- [数据同步架构文档](./DATA_SYNC_ARCHITECTURE.md)
- [修复总结文档](./DATA_SYNC_FIX_SUMMARY.md)
- [aiStore.ts 修复示例](../packages/frontend/src/store/aiStore.ts)

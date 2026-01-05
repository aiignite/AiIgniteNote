# 数据同步架构文档

## 概述

AiNote 采用**离线优先(Offline-First)**架构,PostgreSQL 作为标准数据源,IndexedDB 作为本地缓存和离线存储。

## 核心原则

1. **PostgreSQL 是标准数据源**
   - 所有权威数据存储在 PostgreSQL
   - IndexedDB 只是本地缓存和离线时的临时存储

2. **离线优先设计**
   - 优先使用本地数据 (IndexedDB)
   - 在后台自动同步到 PostgreSQL
   - 网络不可用时依然可以正常工作

3. **数据同步标记**
   - 每个可同步的表都需要 `_pendingSync` 或 `pendingSync` 字段
   - 标记为 `true` 表示需要同步到服务器
   - 同步成功后自动清除标记

## 数据表分类

### 需要同步到 PostgreSQL 的表

| 表名 | IndexedDB | PostgreSQL | 说明 |
|------|-----------|------------|------|
| 笔记 | `notes` | `notes` | 用户创建的笔记内容 |
| 分类 | `categories` | `categories` | 笔记分类 |
| 标签 | `tags` | `tags` | 标签 |
| 笔记-标签关联 | `noteTags` | `note_tags` | 多对多关系 |
| AI 助手 | `aiAssistants` | `ai_assistants` | 自定义 AI 助手 |
| 模型配置 | `modelConfigs` | `model_configs` | AI 模型配置 |

### 仅存储在 IndexedDB 的表

| 表名 | IndexedDB | 说明 |
|------|-----------|------|
| 对话 | `conversations` | AI 对话历史 (临时) |
| 附件 | `attachments`, `fileAttachments` | 文件附件 (文件存储在对象存储) |
| 版本历史 | `noteVersions` | 笔记版本历史 (可选同步) |

### 不需要同步的数据

| 类型 | 说明 |
|------|------|
| 内置助手 | `isBuiltIn: true` 的 AI 助手由代码定义,不需要同步 |
| 临时数据 | 对话消息、使用日志等临时数据 |

## 数据同步策略

### 创建数据

```typescript
// 1. 先保存到 IndexedDB
const localData = await db.notes.create(noteData);

// 2. 尝试同步到 PostgreSQL
try {
  const remoteData = await api.createNote(localData);

  // 3. 同步成功,更新本地 ID 和清除标记
  await db.notes.update(localData.id, {
    id: remoteData.id,  // 使用服务器返回的 ID
    _pendingSync: false,
    syncedAt: Date.now()
  });
} catch (error) {
  // 4. 同步失败,标记为待同步
  await db.notes.update(localData.id, {
    _pendingSync: true
  });
}
```

### 更新数据

```typescript
// 1. 先更新 IndexedDB
await db.notes.update(id, updates);

// 2. 尝试同步到 PostgreSQL
try {
  await api.updateNote(id, updates);
  await db.notes.update(id, { _pendingSync: false });
} catch (error) {
  await db.notes.update(id, { _pendingSync: true });
}
```

### 删除数据

```typescript
// 1. 软删除 (标记为已删除)
await db.notes.update(id, { isDeleted: true, _pendingSync: true });

// 2. 尝试同步到 PostgreSQL
try {
  await api.deleteNote(id);
  await db.notes.permanentDeleteNote(id);  // 真删除
} catch (error) {
  // 保留 _pendingSync 标记,下次同步
}
```

## 数据加载策略

### 应用启动时

```typescript
// 1. 先加载本地数据 (快速显示 UI)
const localNotes = await db.notes.toArray();
displayNotes(localNotes);

// 2. 后台从 PostgreSQL 同步最新数据
syncFromServer().then(remoteNotes => {
  mergeData(localNotes, remoteNotes);
});
```

### 数据合并规则

1. **优先使用服务器数据**
   - 如果本地和服务器都有数据,使用服务器的 (updatedAt 更新的)
   - 本地有 `_pendingSync` 标记的,先上传再下载

2. **冲突解决**
   - 使用 `updatedAt` 时间戳判断
   - 服务器更新时间 > 本地更新时间 → 使用服务器数据
   - 本地更新时间 > 服务器更新时间 → 上传本地数据

## 离线支持

### 检测网络状态

```typescript
window.addEventListener('online', () => {
  // 网络恢复,同步待同步数据
  syncPendingData();
});

window.addEventListener('offline', () => {
  // 网络断开,提示用户
  showOfflineMessage();
});
```

### 定期同步

```typescript
// 每 30 秒检查一次待同步数据
setInterval(async () => {
  if (navigator.onLine) {
    await syncPendingData();
  }
}, 30000);
```

## API 客户端封装

所有 API 调用都应该通过统一的 API 客户端:

```typescript
// packages/frontend/src/lib/api/client.ts
export const apiClient = {
  async get(url: string) {
    try {
      return await axios.get(url);
    } catch (error) {
      if (error.code === 'NETWORK_ERROR') {
        // 网络错误,标记需要从本地缓存读取
        throw new OfflineError();
      }
      throw error;
    }
  }
};
```

## 字段映射规则

### 时间字段

| PostgreSQL | IndexedDB | 转换 |
|------------|-----------|------|
| `created_at` (TIMESTAMP) | `createdAt` (number) | `new Date(created_at).getTime()` |
| `updated_at` (TIMESTAMP) | `updatedAt` (number) | 同上 |

### 布尔字段

| PostgreSQL | IndexedDB | 示例 |
|------------|-----------|------|
| `is_public` (boolean) | `isPublic` (boolean) | 直接映射 |
| `is_deleted` (boolean) | `isDeleted` (boolean) | 直接映射 |

### ID 字段

- PostgreSQL 使用 `cuid` 格式: `cmjvi1hia0000rzlxxl5l10w1`
- IndexedDB 临时 ID: `note_${Date.now()}_${random}`
- 同步后使用 PostgreSQL 的 ID

## 实现检查清单

- [ ] 所有表的 schema 都有 `_pendingSync` 字段
- [ ] 创建/更新/删除操作都设置同步标记
- [ ] API 失败时自动标记为待同步
- [ ] 网络恢复时自动同步
- [ ] 定期同步待同步数据
- [ ] 数据加载时正确合并本地和远程数据
- [ ] 时间戳字段正确转换
- [ ] ID 字段正确更新

## 测试场景

1. **离线创建笔记**
   - 断网 → 创建笔记 → 刷新页面 → 数据应该还在
   - 联网 → 应该自动同步到服务器

2. **在线创建笔记**
   - 创建笔记 → 应该立即保存到本地和服务器

3. **冲突解决**
   - 两个设备同时修改同一笔记
   - 应该使用 `updatedAt` 较新的版本

4. **删除同步**
   - 删除笔记 → 应该在服务器上也删除

## 性能优化

1. **批量同步**
   - 积累多个操作后批量上传,减少请求次数

2. **增量同步**
   - 只同步有 `_pendingSync` 标记的数据

3. **后台同步**
   - 使用 Web Worker 在后台同步,不阻塞 UI

4. **数据压缩**
   - 大文本内容压缩后再传输

## 安全性

1. **加密敏感数据**
   - API Key 等敏感字段加密存储

2. **权限验证**
   - 同步前验证用户权限
   - 只同步用户自己的数据

3. **防止数据丢失**
   - 同步前备份本地数据
   - 同步失败时保留原数据

# 分类更新错误修复计划

## 🐛 问题描述

用户尝试修改分类时报错：
```
Error: 只能修改已同步到服务器的分类
```

## 🔍 根本原因

之前为了实现"PostgreSQL 为准"的策略，我们添加了严格检查：
- `updateCategory` 中要求分类必须有 `_synced: true` 标记
- 但 `loadCategories` 从后端加载数据后，store state 使用的是后端原始数据（没有 `_synced` 标记）

**代码位置**：`packages/frontend/src/store/noteStore.ts`

### 问题代码分析

**第 156-171 行（loadCategories）**：
```typescript
// 将后端分类同步到 IndexedDB
for (const category of remoteCategories) {
  const localCategory = {
    ...category,
    _synced: true, // ✅ IndexedDB 有标记
  };
  await db.categories.put(localCategory);
}

set({ categories: remoteCategories }); // ❌ store 用后端原始数据（无 _synced）
```

**第 558-595 行（updateCategory）**：
```typescript
const isSynced = (category as any)._synced === true;

if (!isSynced) {
  throw new Error("只能修改已同步到服务器的分类"); // ❌ 因为没有 _synced，所以抛出错误
}
```

## 🎯 修复方案

### 方案：统一数据结构

确保从后端加载的数据也带有 `_synced: true` 标记。

### 修改文件

**文件**：`packages/frontend/src/store/noteStore.ts`

**位置**：第 156-171 行

**当前代码**：
```typescript
// 将后端分类同步到 IndexedDB
for (const category of remoteCategories) {
  const localCategory = {
    id: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color,
    sortOrder: category.sortOrder,
    createdAt: new Date(category.createdAt).getTime(),
    _synced: true,
  };
  await db.categories.put(localCategory);
}

set({ categories: remoteCategories });
```

**修改为**：
```typescript
// 将后端分类同步到 IndexedDB 和 store
const syncedCategories = remoteCategories.map((category) => {
  const localCategory = {
    id: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color,
    sortOrder: category.sortOrder,
    createdAt: new Date(category.createdAt).getTime(),
    _synced: true, // 标记为已同步
  };
  await db.categories.put(localCategory);
  return localCategory;
});

set({ categories: syncedCategories });
```

## ✅ 验收标准

修复后应该能够：
- [ ] 成功修改从后端加载的分类
- [ ] `_synced` 标记正确传递到 store state
- [ ] 不影响其他功能（创建、删除分类）

## ⏱️ 预估时间

5分钟（单行代码修改）

## 📝 相关问题

同样的模式可能存在于：
- `deleteCategory` - 使用同样的 `_synced` 检查
- 需要确保所有加载后端数据的地方都正确添加同步标记

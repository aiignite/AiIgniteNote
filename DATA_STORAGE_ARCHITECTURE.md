# AiNote 数据存储架构文档

## 概述

AiNote 采用**双层存储架构**：
- **PostgreSQL** (后端): 主数据库，负责数据持久化和多设备同步
- **IndexedDB** (前端): 本地缓存，支持离线优先和快速访问

---

## 1. PostgreSQL 数据库结构

### 1.1 核心表结构

#### 用户表 (`users`)
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  username      String?  @unique
  passwordHash  String
  displayName   String?
  avatar        String?
  preferences   Json?    // 用户偏好设置 (JSONB)
  isActive      Boolean  @default(true)
  emailVerified Boolean  @default(false)
  lastLoginAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // 关系
  notes            Note[]
  categories       Category[]
  aiAssistants     AiAssistant[]
  modelConfigs     ModelConfig[]
  aiConversations  AiConversation[]
  refreshTokens    RefreshToken[]
  tags             Tag[]
}
```

#### 笔记表 (`notes`)
```prisma
model Note {
  id          String   @id @default(cuid())
  title       String
  content     String   @default("")
  htmlContent String?  // 富文本内容
  fileType    String   @default("markdown") // markdown, richtext, drawio, mindmap
  metadata    Json?    // 扩展数据 (JSONB) - 编辑器特定数据
  tags        String[] @default([]) // PostgreSQL 数组类型
  isDeleted   Boolean  @default(false)
  isFavorite  Boolean  @default(false)
  version     Int      @default(1)
  userId      String
  categoryId  String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  // 关系
  user         User              @relation(fields: [userId], references: [id])
  category     Category          @relation(fields: [categoryId], references: [id])
  versions     NoteVersion[]
  conversations AiConversation[]
  attachments   Attachment[]
  noteTags     NoteTag[]         // 多对多关系
}
```

**关键字段说明**：
- `fileType`: 文件类型枚举 (markdown, richtext, drawio, mindmap, monaco)
- `metadata`: JSONB 类型，存储编辑器特定数据（如思维导图 JSON、DrawIO XML）
- `tags`: PostgreSQL 原生数组，存储标签 ID

#### 分类表 (`categories`)
```prisma
model Category {
  id        String   @id @default(cuid())
  name      String
  icon      String?
  color     String?
  sortOrder Int      @default(0)
  userId    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 关系
  user  User?   @relation(fields: [userId], references: [id])
  notes Note[]

  @@unique([userId, name])
}
```

#### 标签表 (`tags`)
```prisma
model Tag {
  id        String   @id @default(cuid())
  name      String
  color     String?
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 关系
  user     User      @relation(fields: [userId], references: [id])
  noteTags NoteTag[]

  @@unique([userId, name])
}
```

#### 笔记-标签关联表 (`note_tags`)
```prisma
model NoteTag {
  id        String   @id @default(cuid())
  noteId    String
  tagId     String
  createdAt DateTime @default(now())

  // 关系
  note Note @relation(fields: [noteId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([noteId, tagId])  // 防止重复关联
}
```

#### AI 助手表 (`ai_assistants`)
```prisma
model AiAssistant {
  id           String   @id @default(cuid())
  name         String
  description  String?
  systemPrompt String
  avatar       String?
  model        String   // 空字符串表示使用默认模型
  temperature  Float?
  maxTokens    Int?
  sortOrder    Int      @default(0)
  isBuiltIn    Boolean  @default(false) // 内置助手标记
  isActive     Boolean  @default(true)
  userId       String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // 关系
  user          User               @relation(fields: [userId], references: [id])
  conversations AiConversation[]

  @@index([userId])
}
```

#### 模型配置表 (`model_configs`)
```prisma
model ModelConfig {
  id          String   @id @default(cuid())
  name        String
  description String?
  apiKey      String
  apiEndpoint String
  apiType     String   @default("openai") // openai, anthropic, ollama, lmstudio, glm
  model       String
  temperature Float    @default(0.7)
  maxTokens   Int      @default(2000)
  topP        Float    @default(0.9)
  enabled     Boolean  @default(false)
  isDefault   Boolean  @default(false)
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 关系
  user      User             @relation(fields: [userId], references: [id])
  usageLogs ModelUsageLog[]

  @@index([userId])
}
```

#### AI 对话表 (`ai_conversations`)
```prisma
model AiConversation {
  id          String   @id @default(cuid())
  title       String?
  userId      String
  noteId      String?  // 关联笔记 ID
  assistantId String?  // 关联助手 ID
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 关系
  user      User          @relation(fields: [userId], references: [id])
  note      Note?         @relation(fields: [noteId], references: [id])
  assistant AiAssistant?  @relation(fields: [assistantId], references: [id])
  messages  AiMessage[]

  @@index([userId])
  @@index([noteId])
}
```

#### AI 消息表 (`ai_messages`)
```prisma
model AiMessage {
  id             String   @id @default(cuid())
  conversationId String
  role           String   // user, assistant, system
  content        String   @db.Text
  tokensUsed     Int?
  model          String?
  metadata       Json?
  createdAt      DateTime @default(now())

  conversation AiConversation @relation(fields: [conversationId], references: [id])

  @@index([conversationId])
  @@index([conversationId, createdAt])
}
```

### 1.2 PostgreSQL 特性使用

#### JSONB 类型
- **用途**: 灵活存储结构化数据
- **应用场景**:
  - `User.preferences`: 用户偏好设置
  - `Note.metadata`: 编辑器特定数据（思维导图 JSON、DrawIO XML 等）
  - `AiMessage.metadata`: 消息元数据

#### 数组类型
- **用途**: 原生数组支持
- **应用场景**:
  - `Note.tags`: 笔记标签 ID 数组
  - 可直接使用 `ANY`, `ALL`, `&&` 等数组操作符

#### 索引策略
```prisma
@@index([userId])
@@index([categoryId])
@@index([isDeleted])
@@index([userId, isDeleted])
```

---

## 2. IndexedDB 数据库结构

### 2.1 数据库版本

**当前版本**: 5
**数据库名**: `AiNoteDB`

### 2.2 表结构

#### 笔记表 (`notes`)
```typescript
{
  id: string
  title: string
  content: string
  category: string      // 分类 ID
  fileType: string      // markdown, richtext, drawio, mindmap, monaco
  isDeleted: boolean
  isFavorite: boolean
  createdAt: number     // 时间戳
  updatedAt: number
  pendingSync?: boolean // 离线同步标记

  // 索引
  // "id, title, category, fileType, isDeleted, isFavorite, createdAt, updatedAt, pendingSync"
}
```

#### 分类表 (`categories`)
```typescript
{
  id: string
  name: string
  icon?: string
  color?: string
  createdAt: number
  _pendingSync?: boolean

  // 索引
  // "id, name, createdAt, _pendingSync"
}
```

#### 标签表 (`tags`)
```typescript
{
  id: string
  name: string
  color?: string
  createdAt: number
  updatedAt: number
  _pendingSync?: boolean

  // 索引
  // "id, name, createdAt, _pendingSync"
}
```

#### 笔记-标签关联表 (`noteTags`)
```typescript
{
  id: string
  noteId: string
  tagId: string
  createdAt: number

  // 索引
  // "id, noteId, tagId, createdAt"
  @@unique([noteId, tagId])
}
```

#### AI 助手表 (`aiAssistants`)
```typescript
{
  id: string
  name: string
  description: string
  systemPrompt: string
  avatar?: string
  model: string
  temperature?: number
  maxTokens?: number
  sortOrder: number
  isBuiltIn: boolean
  isActive: boolean
  createdAt: number
  updatedAt: number

  // 索引
  // "id, isBuiltIn, isActive, sortOrder"
}
```

#### 模型配置表 (`modelConfigs`)
```typescript
{
  id: string
  name: string
  description?: string
  apiKey: string
  apiEndpoint: string
  apiType: string      // openai, anthropic, ollama, lmstudio, glm
  model: string
  temperature: number
  maxTokens: number
  topP: number
  enabled: boolean
  isDefault: boolean
  _pendingSync?: boolean

  // 索引
  // "id, name, enabled, _pendingSync"
}
```

#### 对话表 (`conversations`)
```typescript
{
  id: string
  noteId?: string
  messages: AIMessage[]
  createdAt: number
  updatedAt: number

  // 索引
  // "id, noteId, createdAt, updatedAt"
}
```

### 2.3 IndexedDB 特性

#### 离线优先
- **本地 ID 生成**: 使用时间戳 + 随机数
  ```typescript
  id = `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  ```
- **待同步标记**: `_pendingSync` 字段标记需同步的数据
- **自动版本控制**: 笔记自动创建版本历史

#### 数据迁移
```typescript
// 版本 2: 添加文件类型支持
.upgrade(async (tx) => {
  const notes = await tx.table<Note>("notes").toArray();
  for (const note of notes) {
    if (!note.fileType) {
      await tx.table<Note>("notes").update(note.id, {
        fileType: NoteFileType.MARKDOWN
      });
    }
  }
})
```

---

## 3. 数据同步策略

### 3.1 同步流程

```
┌─────────────┐
│  用户操作   │
└──────┬──────┘
       │
       ├─> 1. 更新 IndexedDB (立即)
       │
       ├─> 2. 调用后端 API (异步)
       │
       └─> 3. 成功: 更新 PostgreSQL
            失败: 保留在 IndexedDB，标记 _pendingSync
```

### 3.2 同步示例代码

#### 笔记同步
```typescript
// noteStore.ts
const createNote = async (noteData) => {
  // 1. 立即保存到 IndexedDB
  const localNote = await db.createNote(noteData);

  // 2. 异步同步到 PostgreSQL
  try {
    const response = await notesApi.createNote(localNote);
    // 3. 用服务器返回的 ID 更新本地记录
    await db.updateNote(localNote.id, {
      id: response.data.id,
      pendingSync: false
    });
  } catch (error) {
    // 标记为待同步
    await db.updateNote(localNote.id, {
      _pendingSync: true
    });
  }
};
```

#### AI 助手同步
```typescript
// aiStore.ts
const updateAssistant = async (id, updates) => {
  const existing = get().assistants.find(a => a.id === id);

  if (existing?.isBuiltIn) {
    // 内置助手只更新本地
    const localUpdates = {
      ...updates,
      updatedAt: Date.now()
    };
    await db.updateAssistant(id, localUpdates);
    set((state) => ({
      assistants: state.assistants.map(a =>
        a.id === id ? { ...a, ...localUpdates } : a
      )
    }));
  } else {
    // 自定义助手同步到后端
    await aiApi.updateAssistant(id, updates);
    await db.updateAssistant(id, updates);
  }
};
```

### 3.3 数据一致性保证

#### 时间戳比较
```typescript
// 加载时检查本地修改
const isLocallyModified = existing.updatedAt > (
  assistant.updatedAt
    ? new Date(assistant.updatedAt).getTime()
    : 0
);

if (assistant.isBuiltIn && isLocallyModified) {
  // 保留本地修改，不覆盖
  console.log(`保留本地修改: ${assistant.name}`);
  continue;
}
```

#### 冲突解决策略
1. **最后写入优先**: 基于 `updatedAt` 时间戳
2. **本地优先**: 内置助手的本地修改
3. **服务器优先**: 自定义助手以服务器为准

---

## 4. 文件类型存储

### 4.1 支持的文件类型

```typescript
enum NoteFileType {
  MARKDOWN = "markdown",      // Markdown 文档
  RICH_TEXT = "richtext",     // 富文本 (TipTap)
  DRAWIO = "drawio",         // DrawIO 流程图
  MINDMAP = "mindmap",       // 思维导图
  MONACO = "monaco"          // 代码编辑器
}
```

### 4.2 不同类型的存储策略

#### Markdown / 富文本 / 代码
```typescript
// content: 纯文本内容
{
  fileType: "markdown",
  content: "# Hello World\n\n这是 Markdown 内容"
}
```

#### DrawIO 图表
```typescript
// metadata: 存储 DrawIO XML
{
  fileType: "drawio",
  content: "<mxfile>...</mxfile>",  // 兼容性内容
  metadata: {
    xml: "<mxfile>...</mxfile>",   // 完整 XML
    compressed: true               // 压缩标记
  }
}
```

#### 思维导图
```typescript
// metadata: 存储思维导图 JSON
{
  fileType: "mindmap",
  content: "思维导图数据",
  metadata: {
    data: {
      "root": {
        "topic": "中心主题",
        "children": [...]
      }
    }
  }
}
```

---

## 5. 标签系统存储

### 5.1 数据结构

**PostgreSQL**:
```prisma
Tag {
  id, name, color, userId, createdAt, updatedAt
}

NoteTag {
  id, noteId, tagId, createdAt
  @@unique([noteId, tagId])  // 多对多关系
}
```

**IndexedDB**:
```typescript
tags: {
  id, name, color, createdAt, updatedAt
}

noteTags: {
  id, noteId, tagId, createdAt
}
```

### 5.2 标签操作

#### 添加标签
```typescript
// 1. 创建或获取标签
let tag = await db.getTag(tagName);
if (!tag) {
  tag = await db.createTag({ name: tagName, color: '#1890ff' });
}

// 2. 建立笔记-标签关联
await db.setNoteTags(noteId, [...existingTagIds, tag.id]);
```

#### 查询带标签的笔记
```typescript
const notesWithTag = await db.getNotesByTagId(tagId);
```

---

## 6. 性能优化

### 6.1 PostgreSQL 优化

#### 索引策略
```prisma
@@index([userId, isDeleted])  // 复合索引
@@index([noteId, createdAt])   // 消息排序
@@unique([noteId, tagId])     // 防止重复
```

#### JSONB 查询
```sql
-- 查询包含特定元数据的笔记
SELECT * FROM notes
WHERE metadata->>'editor' = 'mindmap';

-- GIN 索引加速 JSONB 查询
CREATE INDEX notes_metadata_idx ON notes USING GIN (metadata);
```

### 6.2 IndexedDB 优化

#### 索引设计
```typescript
// 复合索引加速查询
"notes": "id, title, category, fileType, isDeleted, isFavorite, createdAt, updatedAt"

// 按分类查询
db.notes.where("category").equals(categoryId).toArray()

// 按删除状态过滤
db.notes.filter(note => !note.isDeleted).toArray()
```

#### 批量操作
```typescript
// 批量添加标签关联
for (const tagId of tagIds) {
  await db.noteTags.add({
    id: `notetag_${Date.now()}_${Math.random()}`,
    noteId,
    tagId,
    createdAt: Date.now()
  });
}
```

---

## 7. 数据备份与恢复

### 7.1 PostgreSQL 备份

```bash
# 完整备份
pg_dump -U username ainote > backup.sql

# 仅数据备份
pg_dump -U username -a ainote > data.sql

# 恢复
psql -U username ainote < backup.sql
```

### 7.2 IndexedDB 导出/导入

```typescript
// 导出所有数据
const exportData = async () => {
  const data = {
    notes: await db.notes.toArray(),
    categories: await db.categories.toArray(),
    tags: await db.tags.toArray(),
    // ...
  };
  return JSON.stringify(data);
};

// 导入数据
const importData = async (json) => {
  const data = JSON.parse(json);
  await db.notes.bulkAdd(data.notes);
  await db.categories.bulkAdd(data.categories);
  // ...
};
```

---

## 8. 安全性

### 8.1 数据加密

**敏感字段加密**:
```typescript
// API Key 加密存储
const encryptedApiKey = encrypt(apiKey, userKey);
await db.modelConfigs.add({
  ...config,
  apiKey: encryptedApiKey
});
```

### 8.2 权限控制

```prisma
// 用户隔离
@@unique([userId, name])  // 标签名在用户范围内唯一

// 关联验证
user  User  @relation(fields: [userId], references: [id])
```

---

## 9. 监控与日志

### 9.1 使用日志

```prisma
ModelUsageLog {
  id           String   @id
  modelId      String
  action       String   // chat, completion, embedding
  inputTokens  Int      @default(0)
  outputTokens Int      @default(0)
  totalTokens  Int      @default(0)
  success      Boolean
  errorMessage String?
  metadata     Json?
  createdAt    DateTime @default(now())

  @@index([modelId])
  @@index([createdAt])
}
```

### 9.2 同步日志

```typescript
console.log(`[AIStore] 保留本地修改的内置助手: ${assistant.name}`);
console.log(`[Sync] 已同步 ${count} 条笔记到服务器`);
```

---

## 10. 最佳实践

### 10.1 数据一致性
1. **优先使用 PostgreSQL**: 最终数据源
2. **IndexedDB 作为缓存**: 快速访问
3. **时间戳同步**: 防止冲突

### 10.2 错误处理
```typescript
try {
  await api.update(data);
  await db.update(data);
} catch (error) {
  // 本地保存，标记待同步
  await db.update(data, { _pendingSync: true });
  console.error("同步失败，已保存到本地");
}
```

### 10.3 性能建议
1. **批量操作**: 使用 `bulkAdd`, `bulkPut`
2. **索引优化**: 为常用查询字段建立索引
3. **分页加载**: 大数据集使用 `limit()`, `offset()`
4. **清理垃圾**: 定期清理 `isDeleted` 数据

---

## 总结

AiNote 的存储架构设计遵循以下原则：

1. **PostgreSQL 为主**: 数据持久化和多设备同步
2. **IndexedDB 为辅**: 离线优先和快速访问
3. **JSONB 灵活性**: 支持多种文件类型和扩展数据
4. **关系规范化**: 使用外键和关联表维护数据完整性
5. **渐进式迁移**: IndexedDB 版本升级支持数据迁移
6. **离线优先**: 本地操作优先，后台同步到服务器

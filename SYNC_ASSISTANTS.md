# AI 助手 ID 一致性同步指南

## 问题说明

之前系统中存在助手 ID 不一致的问题，导致富文本笔记无法自动切换到写作助手。

## 解决方案

已创建统一的助手配置文件，确保前后端使用相同的助手 ID：

### 1. 后端配置文件
`packages/backend/prisma/assistants.config.ts` - 定义所有内置助手的配置

### 2. 前端配置文件
`packages/frontend/src/config/assistants.config.ts` - 与后端保持同步

### 3. 统一的助手 ID 列表

| 助手名称 | 助手 ID | 用途 |
|---------|---------|------|
| 通用助手 | `general_public` | 通用问答 |
| 写作助手 | `writing_public` | Markdown/富文本笔记 ✅ |
| 总结助手 | `summary_public` | 内容总结 |
| 翻译助手 | `translation_public` | 多语言翻译 |
| 代码助手 | `coding_public` | Monaco 代码笔记 ✅ |
| 思维导图助手 | `mindmap` | 思维导图笔记 ✅ |
| DrawIO 助手 | `drawio` | DrawIO 图表 ✅ |

### 4. 文件类型映射

```typescript
{
  markdown: "writing_public",    // ✅ 写作助手
  richtext: "writing_public",    // ✅ 写作助手
  monaco: "coding_public",       // ✅ 代码助手
  mindmap: "mindmap",            // ✅ 思维导图助手
  drawio: "drawio",              // ✅ DrawIO 助手
}
```

## 同步步骤

### 步骤 1：同步 PostgreSQL 数据库

```bash
cd packages/backend
npx ts-node prisma/seed-unified-assistants.ts
```

这将：
- 创建/更新所有内置助手到 PostgreSQL
- 使用统一的助手 ID
- 显示同步结果统计

### 步骤 2：清理前端 IndexedDB（可选）

如果前端有旧的助手数据缓存，建议清理：

1. 打开浏览器开发者工具（F12）
2. 进入 Application 标签
3. 左侧找到 Storage → IndexedDB → ainote
4. 右键删除 `aiAssistants` 表
5. 刷新页面，系统会自动从服务器重新加载助手

### 步骤 3：验证

1. 打开 AiNote 应用
2. 点击富文本笔记
3. 观察控制台日志，应该看到：
   ```
   [NoteEditor] 已自动切换到写作助手助手 (ID: writing_public)
   ```
4. AI 助手面板应显示"写作助手"

## 快速修复命令

```bash
# 1. 同步数据库助手
cd packages/backend && npx ts-node prisma/seed-unified-assistants.ts

# 2. 重启后端服务
cd ../.. && ./stop.sh && ./start.sh
```

## 配置文件同步检查

如果需要添加新的内置助手，请同时更新：

1. `packages/backend/prisma/assistants.config.ts`
2. `packages/frontend/src/config/assistants.config.ts`
3. 运行同步脚本

## 技术细节

### 助手 ID 命名规范

- **公有助手**: `<type>_public` (如 `writing_public`)
- **特殊用途助手**: 描述性名称 (如 `mindmap`, `drawio`)
- **私有助手**: `<type>` (如 `general`)

### 数据同步流程

```
1. PostgreSQL (权威数据源)
   ↓
2. 前端通过 API (/api/v1/ai/assistants) 加载
   ↓
3. 缓存到 IndexedDB (本地缓存)
   ↓
4. NoteEditor 使用映射配置自动切换
```

### 相关文件

- `packages/backend/prisma/seed-unified-assistants.ts` - 数据库同步脚本
- `packages/backend/prisma/assistants.config.ts` - 后端助手配置
- `packages/frontend/src/config/assistants.config.ts` - 前端助手配置
- `packages/frontend/src/db/index.ts` - IndexedDB 初始化
- `packages/frontend/src/components/Note/NoteEditor.tsx` - 自动切换逻辑

## 故障排查

### 问题：富文本笔记点击后助手没有切换

**检查步骤**：

1. 打开浏览器控制台，查看是否有错误日志
2. 检查日志中的可用助手列表：
   ```
   [NoteEditor] 当前可用的助手: [...]
   ```
3. 确认 `writing_public` 是否在列表中
4. 如果不在，说明数据库未同步，运行步骤 1

### 问题：日志显示"未找到助手 ID"

**原因**：数据库中的助手 ID 与代码不匹配

**解决**：运行统一同步脚本

```bash
cd packages/backend
npx ts-node prisma/seed-unified-assistants.ts
```

## 后续维护

当需要修改助手配置时：

1. 修改两个配置文件（保持同步）
2. 运行数据库同步脚本
3. 重启后端服务
4. 刷新前端页面

---

**最后更新**: 2026-01-06
**作者**: Claude Code
**状态**: ✅ 已完成

# AiNote 多文件类型编辑器扩展计划

## 概述

为 AiNote 添加四种文件类型支持：**富文本**、**Markdown**、**DrawIO 画图**、**思维导图**，并为每种类型设计独立的编辑器组件。

---

## 一、类型定义扩展

### 修改文件：`src/types/index.ts`

```typescript
// 新增：笔记文件类型枚举
export enum NoteFileType {
  MARKDOWN = 'markdown',
  RICH_TEXT = 'richtext',
  DRAWIO = 'drawio',
  MINDMAP = 'mindmap',
}

// 新增：笔记元数据接口
export interface NoteMetadata {
  drawioData?: string;           // DrawIO XML 数据
  drawioThumbnail?: string;      // 缩略图
  mindmapData?: string;          // 思维导图 JSON 数据
  mindmapLayout?: 'mindmap' | 'organization' | 'tree';
  customConfig?: Record<string, any>;
}

// 扩展 Note 接口
export interface Note {
  // ... 原有字段 ...
  fileType: NoteFileType;        // 新增：文件类型（默认 markdown）
  metadata?: NoteMetadata;       // 新增：类型特定元数据
}

// 新增：文件附件类型
export interface FileAttachment {
  id: string;
  noteId: string;
  fileName: string;
  fileType: 'drawio' | 'png' | 'svg' | 'pdf' | 'xml';
  fileSize: number;
  fileData: string;
  createdAt: number;
}
```

---

## 二、数据库升级

### 修改文件：`src/db/index.ts`

1. 升级数据库版本到 v2
2. 添加 `fileAttachments` 表
3. 添加附件 CRUD 方法
4. 添加数据迁移逻辑（兼容旧数据）

---

## 三、编辑器架构设计

### 新建目录：`src/components/Editors/`

```
src/components/Editors/
├── index.ts                   # 导出入口
├── BaseEditor.tsx            # 编辑器接口定义
├── EditorRegistry.tsx        # 编辑器注册表
├── MarkdownEditor.tsx        # Markdown 编辑器（增强版）
├── RichTextEditor.tsx        # 富文本编辑器（从原位置迁移）
├── DrawIOEditor.tsx          # DrawIO 编辑器
└── MindMapEditor.tsx         # 思维导图编辑器
```

### 1. BaseEditor.tsx - 编辑器接口

```typescript
export interface EditorProps {
  noteId: string;
  title: string;
  content: string;
  metadata?: NoteMetadata;
  onChange: (content: string, metadata?: NoteMetadata) => void;
  onTitleChange: (title: string) => void;
  onSave?: () => void;
  onDownload?: (format: string) => void;
}

export interface EditorConfig {
  type: NoteFileType;
  name: string;
  icon: ReactNode;
  component: React.ComponentType<EditorProps>;
  supportedActions: string[];
}
```

### 2. EditorRegistry.tsx - 编辑器注册表

统一管理所有编辑器类型，支持动态扩展。

---

## 四、各编辑器实现方案

### 1. Markdown 编辑器（增强版）

**文件**：`src/components/Editors/MarkdownEditor.tsx`

- 基于现有 `@uiw/react-md-editor`
- 新增：导出为 MD/HTML/PDF
- 新增：全屏编辑模式
- 新增：快捷键支持

### 2. 富文本编辑器（增强版）

**文件**：`src/components/Editors/RichTextEditor.tsx`

- 从 `src/components/Note/RichTextEditor.tsx` 迁移
- 基于 TipTap 增强
- 新增：更多格式选项
- 新增：媒体嵌入

### 3. DrawIO 编辑器

**文件**：`src/components/Editors/DrawIOEditor.tsx`

**技术方案**：iframe 嵌入 DrawIO 在线编辑器
- URL: `https://embed.diagrams.net/?embed=1&proto=json`
- 通过 postMessage 通信
- 支持导出：PNG、SVG、PDF、XML
- 支持导入：.drawio、.xml 文件
- 数据存储在 `metadata.drawioData`

### 4. 思维导图编辑器

**文件**：`src/components/Editors/MindMapEditor.tsx`

**技术方案**：使用 `@antv/g6`

**新增依赖**：
```bash
npm install @antv/g6
```

**功能**：
- 支持多种布局（放射状、树状、组织结构）
- 节点拖拽和编辑
- 导出为 PNG、JSON
- 数据存储在 `metadata.mindmapData`

---

## 五、主编辑器重构

### 修改文件：`src/components/Note/NoteEditor.tsx`

**核心改动**：
1. 使用 `EditorRegistry` 动态加载编辑器
2. Segmented 切换器支持四种类型
3. 统一的内容变更接口 `handleContentChange`
4. 支持文件类型切换（带确认提示）
5. 创建笔记时可选择类型

---

## 六、状态管理更新

### 修改文件：`src/store/noteStore.ts`

- 添加 `fileType` 状态支持
- 更新 `createNote` 方法支持 `fileType` 和 `metadata` 参数

---

## 七、实施步骤

### 第一阶段：类型定义和数据库（优先级：高）

1. [ ] 扩展 `src/types/index.ts`
2. [ ] 升级 `src/db/index.ts` 数据库版本
3. [ ] 更新 `src/store/noteStore.ts`

### 第二阶段：编辑器架构（优先级：高）

1. [ ] 创建 `src/components/Editors/` 目录
2. [ ] 实现 `BaseEditor.tsx` 接口
3. [ ] 实现 `EditorRegistry.tsx` 注册表
4. [ ] 迁移 `RichTextEditor.tsx`
5. [ ] 创建增强版 `MarkdownEditor.tsx`

### 第三阶段：DrawIO 编辑器（优先级：中）

1. [ ] 实现 `DrawIOEditor.tsx`
2. [ ] 实现 iframe 通信机制
3. [ ] 实现导入/导出功能

### 第四阶段：思维导图编辑器（优先级：中）

1. [ ] 安装 `@antv/g6` 依赖
2. [ ] 实现 `MindMapEditor.tsx`
3. [ ] 实现节点编辑功能
4. [ ] 实现导入/导出功能

### 第五阶段：主编辑器集成（优先级：高）

1. [ ] 重构 `NoteEditor.tsx` 集成编辑器注册表
2. [ ] 实现动态编辑器切换
3. [ ] 测试各编辑器切换和数据保存

---

## 八、关键文件路径汇总

### 新增文件

| 路径 | 说明 |
|------|------|
| `src/components/Editors/index.ts` | 导出入口 |
| `src/components/Editors/BaseEditor.tsx` | 编辑器接口 |
| `src/components/Editors/EditorRegistry.tsx` | 编辑器注册表 |
| `src/components/Editors/MarkdownEditor.tsx` | Markdown 编辑器 |
| `src/components/Editors/DrawIOEditor.tsx` | DrawIO 编辑器 |
| `src/components/Editors/MindMapEditor.tsx` | 思维导图编辑器 |

### 修改文件

| 路径 | 修改内容 |
|------|----------|
| `src/types/index.ts` | 添加 NoteFileType、NoteMetadata |
| `src/db/index.ts` | 数据库 v2 升级，添加 fileAttachments 表 |
| `src/store/noteStore.ts` | 支持 fileType 和 metadata |
| `src/components/Note/NoteEditor.tsx` | 重构为动态编辑器加载 |

---

## 九、新增依赖

```bash
npm install @antv/g6
```

---

## 十、数据兼容性处理

- 旧笔记没有 `fileType` 字段 → 默认为 `markdown`
- `htmlContent` 字段已废弃，保留兼容性
- 数据库升级时自动添加 `fileType` 字段到现有记录

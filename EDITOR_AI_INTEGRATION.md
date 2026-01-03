# 编辑器与 AI 助手集成功能

## 功能概述

实现了编辑器（Markdown、富文本、Monaco、思维导图、DrawIO）与 AI 助手之间的无缝集成，用户可以快速将选中内容发送到 AI 助手进行提问或处理。

## 核心功能

### 1. 统一选择内容类型 (`types/selection.ts`)

```typescript
interface SelectedContent {
  type: 'text' | 'mindmap_nodes' | 'drawio_elements' | 'code';
  source: 'markdown' | 'richtext' | 'mindmap' | 'drawio' | 'monaco';
  text: string;              // 格式化后的文本（AI 使用）
  raw?: any;                 // 原始数据（可选）
  metadata?: {
    count?: number;          // 节点/元素数量
    maxLevel?: number;       // 最深层级（思维导图）
    hasStructure?: boolean;  // 是否包含结构
    timestamp?: number;      // 选择时间
  };
}
```

### 2. 各编辑器实现

#### 文本编辑器（Markdown/富文本/Monaco）
- **触发方式**：鼠标选中文本
- **反馈**：AI 助手输入框自动显示选择内容
- **格式**：纯文本，保留换行

#### 思维导图编辑器
- **触发方式**：点击节点选中 → 点击工具栏"发送"按钮
- **反馈**：工具栏按钮显示选中节点数量
- **格式**：带层级的缩进文本
  ```
  📍 中心主题
    ├─ 子主题 1
    └─ 子主题 2
      └─ 子主题 2.1
  ```

#### DrawIO 编辑器
- **触发方式**：选中元素 → 点击工具栏"发送"按钮
- **反馈**：工具栏按钮显示选中元素数量
- **格式**：元素列表
  ```
  [1] 流程开始 (起点)
  [2] 处理步骤 (矩形)
  ```

### 3. AI 助手界面更新

#### 选择内容指示器
- 显示来源图标（📍思维导图、🔷DrawIO、📄文档）
- 显示内容描述（数量、类型）
- 结构化内容预览
- 一键清除按钮

#### 消息发送
- 自动附加选择内容到消息
- 格式：`[用户输入] + [选择描述] + [选择内容]`
- 发送后自动清除选择

### 4. 用户配置（设置面板）

点击 AI 助手工具栏的 ⚙️ 设置图标可配置：

| 配置项 | 说明 | 默认值 |
|-------|------|--------|
| 发送模式 | text（文本）/ json（完整数据）/ hybrid（混合） | text |
| 最大节点数 | 单次选择的节点数量上限 | 20 |
| 最大文本长度 | 选择文本的最大字符数 | 2000 |
| 显示预览 | 是否在输入框显示预览 | 开启 |
| 发送后清除 | 发送消息后自动清除选择 | 开启 |

## 文件结构

```
packages/frontend/src/
├── types/
│   └── selection.ts                    # 选择内容类型定义
├── store/
│   ├── aiStore.ts                      # AI 状态管理（已扩展）
│   └── selectionSettingsStore.ts       # 选择设置存储
├── hooks/
│   └── useTextSelection.ts             # 文本选择 Hook
├── components/
│   ├── AIAssistant/
│   │   ├── ChatInterface.tsx           # AI 对话界面（已更新）
│   │   └── SelectionSettings.tsx       # 设置面板（新增）
│   └── Editors/
│       ├── MindMapEditor.tsx           # 思维导图（已更新）
│       ├── DrawIOEditor.tsx            # DrawIO（已更新）
│       ├── MarkdownEditor.tsx          # Markdown（支持）
│       ├── RichTextEditor.tsx          # 富文本（支持）
│       └── MonacoEditor.tsx            # Monaco（支持）
```

## 使用示例

### 思维导图 → AI 助手

1. 在思维导图中选中多个节点（Shift+点击）
2. 工具栏显示"发送 3 个节点"按钮
3. 点击发送按钮
4. AI 助手输入框显示：
   ```
   📋 已选择 3 个思维导图节点
   
   📍 中心主题
     ├─ 子主题 1
     └─ 子主题 2
   ```
5. 输入问题，点击发送

### 文本编辑器 → AI 助手

1. 在 Markdown/富文本中选中文本
2. AI 助手输入框自动显示选择提示
3. 输入问题，点击发送

## API 参考

### SelectionHelper 工具类

```typescript
// 格式化思维导图节点
SelectionHelper.formatMindMapNodes(nodes: MindMapNodeData[]): string

// 格式化 DrawIO 元素
SelectionHelper.formatDrawIOElements(elements: DrawIOElementData[]): string

// 获取选择描述
SelectionHelper.getSelectionDescription(content: SelectedContent): string

// 验证选择有效性
SelectionHelper.isValidSelection(content: SelectedContent): boolean

// 截断过长文本
SelectionHelper.truncateText(text: string, maxLength?: number): string
```

### useAIStore Hooks

```typescript
const {
  selectedContent,           // 当前选择内容
  setSelectedContent,        // 设置选择内容
  clearSelectedContent,      // 清除选择内容
} = useAIStore();
```

### useTextSelection Hook

```typescript
const {
  clearSelection,           // 清除文本选择
  manualSetSelection,       // 手动设置选择（Monaco 等）
} = useTextSelection({
  fileType: NoteFileType.MARKDOWN,
  enabled: true,
  onSelectionChange: (content) => console.log(content),
});
```

## 技术亮点

1. **类型安全**：完整的 TypeScript 类型定义
2. **跨编辑器统一**：不同编辑器使用相同的数据结构
3. **用户可控**：丰富的配置选项
4. **视觉友好**：清晰的 UI 反馈和预览
5. **性能优化**：文本长度限制，避免 Token 过度消耗

## 注意事项

1. **DrawIO 限制**：当前通过 postMessage 通信，需要 DrawIO iframe 支持
2. **节点数量限制**：建议不超过 20 个节点，避免 Token 消耗过大
3. **文本长度限制**：默认 2000 字符，超出会被截断
4. **浏览器兼容**：需要现代浏览器支持 ES6+

## 未来增强

- [ ] DrawIO 深度集成（修改源码支持精确选择）
- [ ] 快捷键支持（Ctrl+Shift+A 快速发送）
- [ ] 跨编辑器选择合并
- [ ] AI 回调操作（直接修改选中节点）
- [ ] 选择历史记录

# 富文本编辑器选择功能修复 - 测试指南

## 🐛 问题描述

在富文本编辑器中选中文本时，AI 助手没有反应。

## ✅ 已修复

### 修复内容

#### 1. 富文本编辑器 (RichTextEditor.tsx)
**问题**: TipTap 编辑器有独立的 DOM 结构，不响应原生的 `selectionchange` 事件

**解决方案**: 使用 TipTap 的 `selectionUpdate` 事件监听选择变化

```typescript
editor.on("selectionUpdate", handleSelectionUpdate);
```

#### 2. Monaco 编辑器 (MonacoEditor.tsx)  
**问题**: Monaco 编辑器有自己的选区 API，不使用原生 DOM 选择

**解决方案**: 使用 `onDidChangeCursorSelection` 事件监听选择变化

```typescript
editor.onDidChangeCursorSelection((e) => {
  const selection = e.selection;
  const selectedText = model.getValueInRange(selection);
  // 更新 AI Store
});
```

---

## 🧪 测试步骤

### 测试 1: 富文本编辑器

1. **启动项目**
   ```bash
   ./start.sh
   ```

2. **创建富文本笔记**
   - 点击"创建笔记"
   - 选择文件类型: "富文本"
   - 输入一些内容

3. **选择文本**
   - 在富文本编辑器中用鼠标选中一段文字
   - 可以选择带格式的文字（粗体、斜体等）

4. **观察 AI 助手**
   - 右侧 AI 助手输入框上方应显示选择指示器
   - 格式: `📋 已选择富文本内容: "..."`
   - 如果文本 >50 字符，显示预览内容

5. **发送到 AI**
   - 在 AI 助手输入框输入问题
   - 点击"发送"
   - 消息应包含选中的文本

6. **清除选择**
   - 点击选择指示器的"清除"按钮
   - 指示器应消失

### 测试 2: Monaco 代码编辑器

1. **创建代码笔记**
   - 点击"创建笔记"
   - 选择文件类型: "代码编辑器"
   - 选择语言（如 JavaScript）

2. **输入代码**
   ```javascript
   function hello() {
     console.log("Hello World");
   }
   ```

3. **选择代码**
   - 用鼠标选中代码的一部分

4. **观察 AI 助手**
   - 应显示: `📋 已选择 代码 内容: "..."`
   - 来源图标: 📄

5. **测试功能**
   - 输入: "请解释这段代码"
   - 点击发送
   - AI 应接收到选中的代码

---

## ✅ 验证清单

### 富文本编辑器
- [ ] 选中文本后，AI 助手立即显示选择指示器
- [ ] 显示正确的来源（富文本）
- [ ] 文本内容正确显示
- [ ] 点击清除按钮后指示器消失
- [ ] 发送消息时包含选中文本

### Monaco 编辑器
- [ ] 选中代码后，AI 助手立即显示选择指示器
- [ ] 显示正确的来源（代码）
- [ ] 代码内容正确显示（保留格式）
- [ ] 点击清除按钮后指示器消失
- [ ] 发送消息时包含选中代码

---

## 🔍 调试信息

### 打开浏览器控制台

在选中文本时，应该看到以下日志：

```
[AIStore] Selection updated: {
  type: "text",
  source: "richtext",  // 或 "monaco"
  text: "...",
  metadata: { count: 10, timestamp: ... }
}
```

### 常见问题

**Q: 选中文本后没有反应**

A: 检查：
1. 浏览器控制台是否有错误
2. 确认使用的是富文本或 Monaco 编辑器
3. 尝试重新加载页面

**Q: 选择内容显示不完整**

A: 这是正常的，长文本会被截断显示预览，但发送时会包含完整内容

**Q: AI 没有收到选择内容**

A: 检查：
1. 是否点击了"发送"按钮
2. 输入框是否有内容
3. 浏览器控制台是否有错误

---

## 📝 代码变更

### RichTextEditor.tsx
```typescript
// 新增导入
import { useAIStore } from "../../store/aiStore";

// 新增选择监听
useEffect(() => {
  if (!editor) return;
  
  const handleSelectionUpdate = () => {
    const { from, to, empty } = editor.state.selection;
    
    if (!empty && from !== to) {
      const selectedText = editor.state.doc.textBetween(from, to, " ");
      setSelectedContent({
        type: "text",
        source: "richtext",
        text: selectedText.trim(),
        metadata: { count: selectedText.length, timestamp: Date.now() }
      });
    }
  };
  
  editor.on("selectionUpdate", handleSelectionUpdate);
  return () => editor.off("selectionUpdate", handleSelectionUpdate);
}, [editor]);
```

### MonacoEditor.tsx
```typescript
// 新增导入
import { useAIStore } from "../../store/aiStore";

// 在 handleEditorDidMount 中添加
const selectionChangeListener = editor.onDidChangeCursorSelection((e) => {
  const selection = e.selection;
  const model = editor.getModel();
  
  if (!selection.isEmpty()) {
    const selectedText = model.getValueInRange(selection);
    setSelectedContent({
      type: "code",
      source: "monaco",
      text: selectedText.trim(),
      metadata: { count: selectedText.length, timestamp: Date.now() }
    });
  }
});
```

---

## ✨ 修复完成

现在所有编辑器都支持选择功能：

| 编辑器 | 选择方式 | 状态 |
|--------|---------|------|
| Markdown | 原生 DOM 选择 | ✅ |
| 富文本 | TipTap 事件 | ✅ 已修复 |
| Monaco | Monaco 事件 | ✅ 已修复 |
| 思维导图 | 节点 API | ✅ |
| DrawIO | postMessage | ✅ |

---

**测试完成后，请反馈结果！**

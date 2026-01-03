# 思维导图助手上下文管理策略设计

## 📊 需求分析

### 核心问题
当前思维导图助手存在以下问题:
1. ❌ 用户需要手动复制JSON到输入框
2. ❌ AI无法"看到"完整的思维导图上下文
3. ❌ 每次编辑都要重新发送完整数据
4. ❌ 历史消息+JSON可能超出token限制

### 期望体验
1. ✅ 打开思维导图笔记,AI自动"看到"完整结构
2. ✅ 用户只需输入需求,如"添加子节点"
3. ✅ AI理解上下文并生成修改后的JSON
4. ✅ 自动处理大文件和token限制

## 🎯 设计方案

### 1. 上下文注入机制

#### 自动检测笔记类型
```typescript
// 在 aiStore 中检测当前笔记类型
interface AIStore {
  currentNoteType?: 'markdown' | 'richtext' | 'mindmap' | 'drawio' | 'monaco';
  currentNoteId?: string;
}
```

#### 思维导图专用上下文构建器
```typescript
// mindmap-context-builder.ts
export async function buildMindMapContext(
  noteId: string,
  userMessage: string,
  conversation: AIConversation,
  systemPrompt: string
): Promise<ChatMessage[]> {
  // 1. 获取最新思维导图数据
  const mindmapData = await getMindMapData(noteId);
  
  // 2. 估算JSON的token数
  const jsonTokens = estimateTokens(JSON.stringify(mindmapData));
  
  // 3. 根据大小决定策略
  if (jsonTokens > 1000) {
    // 大文件策略
    return buildLargeMindMapContext(mindmapData, userMessage, systemPrompt);
  } else {
    // 小文件策略
    return buildSmallMindMapContext(mindmapData, userMessage, conversation, systemPrompt);
  }
}
```

### 2. 消息构建策略

#### 策略 A: 小文件 (< 1000 tokens)
```
发送内容:
1. System Prompt (思维导图助手定义)
2. 当前思维导图完整JSON
3. 历史对话消息 (如果token允许)
4. 用户当前输入

优点: AI有完整上下文,可以进行多轮对话
缺点: JSON较大时会占用较多token
```

#### 策略 B: 大文件 (> 1000 tokens)
```
发送内容:
1. System Prompt (思维导图助手定义)
2. 当前思维导图完整JSON
3. 用户当前输入

不发送历史消息,每次请求都是独立的

优点: 节省token,避免超限
缺点: 无法进行多轮对话
```

#### 策略 C: 超大文件 (> 2000 tokens)
```
发送内容:
1. System Prompt (思维导图助手定义)
2. 思维导图结构摘要 (节点数量、层级、主题)
3. 用户当前输入

AI生成后验证,如果需要完整数据再要求用户明确指定

优点: 最大程度节省token
缺点: AI可能需要多次交互
```

### 3. 实现架构

```
┌─────────────────────────────────────┐
│   用户输入: "添加子节点"              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   buildMessagesForAI (入口)         │
│   - 检测当前笔记类型                  │
│   - 如果是mindmap,调用专用构建器      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   buildMindMapContext (专用)         │
│   - 从noteStore获取最新JSON          │
│   - 估算JSON token大小               │
│   - 选择合适的策略                    │
└──────────────┬──────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
      ▼                 ▼
┌──────────┐    ┌──────────────┐
│ 小文件策略  │    │  大文件策略    │
│+历史消息   │    │  无历史消息   │
└──────────┘    └──────────────┘
      │                 │
      └────────┬────────┘
               ▼
┌─────────────────────────────────────┐
│   返回 ChatMessage[]                │
│   - system: prompt + json           │
│   - user: 当前输入                   │
│   - assistant: 历史消息 (可选)       │
└─────────────────────────────────────┘
```

### 4. 关键代码设计

#### 4.1 扩展 AIConversation
```typescript
interface AIConversation {
  id: string;
  noteId?: string;
  messages: AIMessage[];
  contextSummary?: string; // 已有
  
  // 新增: 思维导图专用字段
  mindmapContext?: {
    lastDataHash: string; // 数据哈希,检测变化
    lastSyncTime: number; // 最后同步时间
    structureSummary?: string; // 结构摘要(大文件用)
  };
}
```

#### 4.2 扩展 buildMessagesForAI
```typescript
export async function buildMessagesForAI(
  conversation: AIConversation,
  systemPrompt: string,
  config: ContextManagerConfig = {},
  signal?: AbortSignal,
): Promise<ChatMessage[]> {
  // 检查是否是思维导图笔记
  const isMindMapNote = await isMindMapNote(conversation.noteId);
  
  if (isMindMapNote && conversation.noteId) {
    console.log("[ContextManager] 检测到思维导图笔记,使用专用上下文构建");
    return buildMindMapContext(
      conversation.noteId,
      conversation.messages[conversation.messages.length - 1]?.content || "",
      conversation,
      systemPrompt,
      config,
      signal
    );
  }
  
  // 原有的普通对话逻辑...
}
```

#### 4.3 思维导图上下文构建器
```typescript
async function buildMindMapContext(
  noteId: string,
  userMessage: string,
  conversation: AIConversation,
  systemPrompt: string,
  config: ContextManagerConfig,
  signal?: AbortSignal
): Promise<ChatMessage[]> {
  // 1. 获取最新思维导图数据
  const note = await db.notes.get(noteId);
  if (!note?.metadata?.mindmapData) {
    // 没有思维导图数据,使用普通逻辑
    return buildDefaultMessages(conversation, systemPrompt);
  }
  
  const mindmapData = JSON.parse(note.metadata.mindmapData);
  const jsonStr = JSON.stringify(mindmapData, null, 2);
  const jsonTokens = estimateTokens(jsonStr);
  
  console.log(`[MindMapContext] JSON大小: ${jsonTokens} tokens`);
  
  // 2. 构建系统提示词(包含JSON)
  const contextPrompt = `${systemPrompt}

## 当前思维导图数据
以下是用户当前正在编辑的思维导图的完整JSON数据:

\`\`\`json
${jsonStr}
\`\`\`

请基于以上思维导图数据,理解用户的需求并生成修改后的完整JSON。`;

  // 3. 根据JSON大小决定策略
  const maxTokens = config.maxTokens || TOKEN_CONFIG.DEFAULT_MAX_TOKENS;
  const systemPromptTokens = estimateTokens(contextPrompt);
  const userMessageTokens = estimateTokens(userMessage);
  
  // 剩余可用token
  const availableTokens = maxTokens - systemPromptTokens - userMessageTokens - 500; // 500 buffer
  
  if (jsonTokens < 1000) {
    // 小文件策略: 可以包含一些历史消息
    console.log("[MindMapContext] 使用小文件策略");
    return buildWithHistory(contextPrompt, userMessage, conversation, availableTokens);
  } else {
    // 大文件策略: 不包含历史消息
    console.log("[MindMapContext] 使用大文件策略");
    return [
      { role: "system", content: contextPrompt },
      { role: "user", content: userMessage }
    ];
  }
}

function buildWithHistory(
  systemPrompt: string,
  userMessage: string,
  conversation: AIConversation,
  availableTokens: number
): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt }
  ];
  
  // 从旧到新添加历史消息,直到token用完
  let usedTokens = 0;
  for (const msg of conversation.messages) {
    const msgTokens = estimateTokens(msg.content);
    if (usedTokens + msgTokens > availableTokens) {
      break;
    }
    messages.push({
      role: msg.role as "user" | "assistant",
      content: msg.content
    });
    usedTokens += msgTokens;
  }
  
  // 添加当前用户消息
  messages.push({ role: "user", content: userMessage });
  
  return messages;
}
```

### 5. 优化点

#### 5.1 数据哈希检测
```typescript
// 只在JSON变化时更新
function getDataHash(data: any): string {
  return JSON.stringify(data).length.toString();
}

if (conversation.mindmapContext?.lastDataHash === getDataHash(mindmapData)) {
  // 数据未变化,可以缓存
}
```

#### 5.2 结构摘要(大文件优化)
```typescript
function generateStructureSummary(data: any): string {
  const count = countNodes(data);
  const depth = getDepth(data);
  const themes = extractMainThemes(data);
  
  return `思维导图包含 ${count} 个节点,最大深度 ${depth} 层,主要主题: ${themes.join(", ")}`;
}
```

#### 5.3 增量更新模式
```typescript
// 如果用户选中了节点,只发送选中部分
if (selectedNodes) {
  const partialData = extractSubTree(data, selectedNodes);
  // 发送部分数据+修改指令
}
```

### 6. 实现步骤

#### Phase 1: 基础实现 (优先)
- [ ] 扩展 AIConversation 类型
- [ ] 实现 isMindMapNote() 检测函数
- [ ] 实现 buildMindMapContext() 基础版本
- [ ] 集成到 buildMessagesForAI()

#### Phase 2: 策略优化
- [ ] 实现小文件/大文件策略分支
- [ ] 添加token估算和日志
- [ ] 测试不同大小的思维导图

#### Phase 3: 高级特性
- [ ] 实现数据哈希检测
- [ ] 实现结构摘要生成
- [ ] 实现增量更新模式

### 7. 测试场景

#### 场景 1: 小型思维导图 (< 50 节点)
```
输入: "添加3个子节点"
预期: AI能看到完整JSON和历史对话
Token使用: ~1500
策略: 小文件策略
```

#### 场景 2: 中型思维导图 (50-100 节点)
```
输入: "优化结构"
预期: AI能看到完整JSON,无历史对话
Token使用: ~2500
策略: 大文件策略
```

#### 场景 3: 大型思维导图 (> 100 节点)
```
输入: "重组第一章"
预期: AI能看到结构摘要,需要用户明确指定
Token使用: ~1000
策略: 超大文件策略
```

### 8. 性能指标

| 指标 | 目标 | 说明 |
|-----|------|------|
| Token使用率 | < 80% | 避免超限 |
| 响应时间 | < 10s | 包含上下文构建 |
| 数据准确性 | 100% | 必须是最新数据 |
| 用户体验 | ⭐⭐⭐⭐⭐ | 无需手动复制 |

### 9. 风险与缓解

#### 风险 1: JSON过大导致token超限
**缓解**: 实现多级策略,大文件时自动切换

#### 风险 2: 数据不是最新的
**缓解**: 每次发送前从noteStore获取最新数据

#### 风险 3: 历史消息丢失影响体验
**缓解**: 小文件时保留历史,大文件时说明原因

#### 风险 4: 其他笔记类型也需要类似功能
**缓解**: 设计通用接口,便于扩展

## 🎯 总结

这个设计方案的核心思想是:
1. **自动检测**: 自动识别思维导图笔记
2. **智能注入**: 每次自动注入最新JSON
3. **分级策略**: 根据大小选择不同策略
4. **用户透明**: 用户无需关心实现细节

实现后,用户只需要:
- 打开思维导图笔记
- 输入需求,如"添加子节点"
- AI自动理解上下文并生成

完全符合"默认获取完整JSON作为输入"的需求! 🎉

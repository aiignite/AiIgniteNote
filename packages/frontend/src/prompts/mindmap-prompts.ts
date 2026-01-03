/**
 * 思维导图 AI 助手提示词模板
 */

export const MINDMAP_ASSISTANT_PROMPT = `# 角色定义
你是一个专业的思维导图编辑助手,精通思维导图的结构化设计和优化。你能够理解用户的需求,并对思维导图的JSON数据进行精确的修改和优化。

# 数据格式规范
你使用的思维导图数据格式必须严格遵守以下结构:

\`\`\`json
{
  "data": {
    "text": "中心主题",
    "children": [
      {
        "data": {
          "text": "子主题1",
          "children": [
            {
              "data": {
                "text": "孙主题1",
                "children": []
              }
            }
          ]
        }
      }
    ]
  }
}
\`\`\`

**重要**: 每个节点都必须包含 data 字段，格式为 {data: {text, children}}！

# 核心规则
1. **完整性**: 必须输出完整的JSON结构,不能有任何省略或"..."表示
2. **可解析性**: JSON必须能够被 JSON.parse() 直接解析,不能有任何语法错误
3. **结构正确**: 根节点必须包含 data.data.text 字段，data.children 必须是数组
4. **层级限制**: 建议不超过5层嵌套,以保证可读性
5. **文本简洁**: 节点文本建议不超过20个字,使用关键词而非长句
6. **代码块包裹**: 所有JSON输出必须使用 \`\`\`json ... \`\`\` 代码块包裹

# ⚠️ 重要输出规范

## 你只能输出一段完整的JSON代码

**绝对禁止**:
- ❌ 输出多个JSON代码块
- ❌ 在JSON之外添加其他文本说明
- ❌ 使用多个 \`\`\` 代码块
- ❌ 分段输出JSON
- ❌ 节点直接使用 {text, children} 格式，必须用 data 包装

**必须遵守**:
- ✅ 只输出一个 \`\`\`json ... \`\`\` 代码块
- ✅ JSON必须是完整的思维导图数据
- ✅ 节点格式必须是 {data: {text: "...", children: [...]}}
- ✅ 不要在代码块外添加任何解释性文字
- ✅ 如果需要说明,请在JSON生成前简短说明(1-2句话),然后只输出一段JSON

## 正确的输出格式示例

\`\`\`
好的,这是为您创建的思维导图:
\`\`\`json
{
  "data": {
    "text": "中心主题",
    "children": [
      {
        "data": {
          "text": "子主题1",
          "children": []
        }
      }
    ]
  }
}
\`\`\`
\`\`\`

## 错误的输出格式示例

❌ 不要这样（缺少 data 包装）:
\`\`\`
\`\`\`json
{
  "text": "中心主题",
  "children": [...]
}
\`\`\`
\`\`\`

✅ 应该这样（有 data 包装）:
\`\`\`
\`\`\`json
{
  "data": {
    "text": "中心主题",
    "children": [...]
  }
}
\`\`\`
\`\`\`

# 工作模式

## 模式1: 全局修改
当用户提供完整思维导图JSON时:
- 分析整体结构和主题
- 根据用户需求调整整体布局
- 输出修改后的完整JSON

## 模式2: 局部修改
当用户只提供选中节点的JSON时:
- 只修改选中的节点及其子节点
- 保持其他部分不变
- 输出修改后的完整JSON

## 模式3: 增量生成
当用户描述新需求时:
- 基于现有JSON结构添加新节点
- 保持原有结构不变
- 输出包含新旧内容的完整JSON

# 响应格式

对于思维导图修改请求,你的响应格式:

1. **简短说明** (可选): 最多1-2句话说明你做了什么
2. **唯一JSON代码块**: 使用一个 \`\`\`json ... \`\`\` 代码块输出完整的思维导图数据

示例:
\`\`\`
已为您添加了3个子主题。
\`\`\`json
{
  "data": {
    "text": "中心主题",
    "children": [...]
  }
}
\`\`\`
\`\`\`

# 常见操作

- **添加节点**: 在指定位置添加新的子节点
- **删除节点**: 移除指定节点(注意保留其子节点或合并到父节点)
- **重组结构**: 调整节点的层级关系和顺序
- **优化内容**: 简化文本、统一术语、改进表达
- **扩展内容**: 根据主题添加更多细节和子节点
- **生成导图**: 从零开始创建符合需求的完整思维导图

# 注意事项
1. 如果用户提供的JSON格式不正确,先指出问题并请求正确的格式
2. 修改后的JSON必须能够直接被思维导图编辑器使用
3. 保持JSON的可读性,使用适当的缩进
4. 如果用户的需求不明确,主动询问具体要求
5. 输出中文时使用简体中文
6. **最重要**: 只输出一个JSON代码块,不要有多个，每个节点必须有 data 包装`;

/**
 * 思维导图助手配置
 */
export const MINDMAP_ASSISTANT_CONFIG = {
  id: "mindmap",
  name: "思维导图助手",
  avatar: "🧠",
  description: "专业的思维导图编辑和优化助手",
  systemPrompt: MINDMAP_ASSISTANT_PROMPT,
  temperature: 0.7,
  maxTokens: 4000,
};

/**
 * 思维导图数据剪贴板类型
 */
export interface MindMapClipboardData {
  /** 完整的思维导图数据 */
  fullData: any;
  /** 选中的节点数据(可选) */
  selectedData?: any;
  /** 选中的节点路径 */
  selectedPath?: number[];
  /** 数据来源 */
  source: "mindmap_editor";
  /** 时间戳 */
  timestamp: number;
}

/**
 * 从思维导图编辑器提取数据
 */
export function extractMindMapData(
  fullData: any,
  selectedNodes?: any[],
  selectedPath?: number[],
): MindMapClipboardData {
  return {
    fullData,
    selectedData: selectedNodes,
    selectedPath,
    source: "mindmap_editor",
    timestamp: Date.now(),
  };
}

/**
 * 格式化思维导图数据用于发送给AI
 */
export function formatMindMapForAI(data: MindMapClipboardData): string {
  let prompt = "";

  // 添加完整JSON
  prompt += `## 完整思维导图数据\n\`\`\`json\n${JSON.stringify(data.fullData, null, 2)}\n\`\`\`\n\n`;

  // 添加选中节点信息
  if (data.selectedData && data.selectedData.length > 0) {
    prompt += `## 选中的节点\n`;
    prompt += `已选中 ${data.selectedData.length} 个节点\n\n`;

    if (data.selectedPath) {
      prompt += `节点路径: ${data.selectedPath.join(" → ")}\n\n`;
    }

    prompt += `选中节点数据:\n\`\`\`json\n${JSON.stringify(data.selectedData, null, 2)}\n\`\`\`\n\n`;
  }

  return prompt;
}

/**
 * 递归转换思维导图节点数据
 * 将简单格式 {text, children} 转换为 simple-mind-map 期望的格式 {data: {text, children}}
 * @param node - 节点数据，格式为 {text, children}
 * @returns 转换后的节点数据 {data: {text, children}}
 */
function convertMindMapNode(node: any): any {
  // 创建 simple-mind-map 期望的格式
  const converted: any = {
    data: {
      text: node.text || "未命名",
    },
  };

  // 递归转换子节点
  if (
    node.children &&
    Array.isArray(node.children) &&
    node.children.length > 0
  ) {
    converted.data.children = node.children.map((child: any) =>
      convertMindMapNode(child),
    );
  } else {
    converted.data.children = [];
  }

  return converted;
}

/**
 * 验证思维导图JSON结构
 * simple-mind-map 期望的格式: { data: { text: "...", children: [...] } }
 *
 * 支持两种输入格式:
 * 1. simple-mind-map 原生格式: { "data": { "text": "...", "children": [...] } }
 * 2. 简化格式 (AI 可能生成): { "text": "...", "children": [...] }
 *
 * 统一输出为 simple-mind-map 格式
 */
export function validateMindMapJSON(json: any): {
  valid: boolean;
  error?: string;
  normalized?: any; // 返回 simple-mind-map 格式: {data: {text, children}}
} {
  if (!json || typeof json !== "object") {
    return { valid: false, error: "数据不是有效的对象" };
  }

  let actualData = json;

  // 如果是包装格式,提取实际的根节点
  if (json.root) {
    actualData = json.root;
  }

  // 检查是否是 simple-mind-map 原生格式 (有 data 包装)
  if (actualData.data && typeof actualData.data === "object") {
    // 已经是正确的格式，验证并直接返回
    if (!actualData.data.text || typeof actualData.data.text !== "string") {
      return { valid: false, error: "缺少必需的 data.text 字段(中心主题)" };
    }

    if (actualData.data.children && !Array.isArray(actualData.data.children)) {
      return { valid: false, error: "children 必须是数组" };
    }

    console.log("[validateMindMapJSON] 检测到 simple-mind-map 原生格式");
    return {
      valid: true,
      normalized: actualData, // 直接返回 {data: {text, children}}
    };
  }

  // 简化格式：直接检查 text 字段
  if (!actualData.text || typeof actualData.text !== "string") {
    return { valid: false, error: "缺少必需的 text 字段(中心主题)" };
  }

  // 验证 children 结构
  if (actualData.children && !Array.isArray(actualData.children)) {
    return { valid: false, error: "children 必须是数组" };
  }

  // 简化格式，需要转换为 simple-mind-map 格式
  console.log(
    "[validateMindMapJSON] 检测到简化格式，转换为 simple-mind-map 格式...",
  );
  const converted = convertMindMapNode(actualData);

  return {
    valid: true,
    normalized: converted, // 返回 {data: {text: "...", children: [...]}}
  };
}

/**
 * 从AI响应中提取思维导图JSON
 */
export function extractMindMapJSONFromResponse(response: string): {
  success: boolean;
  data?: any;
  error?: string;
} {
  try {
    console.log(
      "[extractMindMapJSON] 开始提取JSON, 响应长度:",
      response.length,
    );

    // 尝试提取 ```json 代码块
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    let jsonStr = "";

    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
      console.log("[extractMindMapJSON] 找到json代码块, 长度:", jsonStr.length);
    } else {
      // 尝试匹配 ``` 代码块(不带json标记)
      const codeMatch = response.match(/```\s*([\s\S]*?)\s*```/);
      if (codeMatch) {
        jsonStr = codeMatch[1].trim();
        console.log(
          "[extractMindMapJSON] 找到普通代码块, 长度:",
          jsonStr.length,
        );
      } else {
        // 尝试直接解析整个响应
        jsonStr = response.trim();
        console.log(
          "[extractMindMapJSON] 尝试解析整个响应, 长度:",
          jsonStr.length,
        );
      }
    }

    if (!jsonStr) {
      console.error("[extractMindMapJSON] 未找到有效的JSON内容");
      return {
        success: false,
        error:
          '未找到JSON代码块。AI应该输出一个完整的 ```json ... ``` 代码块。请检查AI的响应是否符合要求,或者使用"粘贴导入"功能手工复制JSON。',
      };
    }

    // 清理可能的markdown格式
    jsonStr = jsonStr
      .replace(/^```json\s*/, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "")
      .trim();

    console.log(
      "[extractMindMapJSON] 清理后的JSON前100字符:",
      jsonStr.substring(0, 100),
    );

    // 解析JSON
    const data = JSON.parse(jsonStr);

    // 验证结构
    const validation = validateMindMapJSON(data);
    if (!validation.valid) {
      console.error("[extractMindMapJSON] JSON结构验证失败:", validation.error);
      return {
        success: false,
        error: `JSON结构验证失败: ${validation.error}。AI输出的JSON格式不正确,请要求AI重新生成。`,
      };
    }

    console.log("[extractMindMapJSON] JSON提取成功");
    return { success: true, data };
  } catch (error) {
    console.error("[extractMindMapJSON] 解析失败:", error);
    return {
      success: false,
      error: `JSON解析失败: ${error instanceof Error ? error.message : "未知错误"}。AI输出的不是有效的JSON格式,请检查AI的响应或使用"粘贴导入"功能。`,
    };
  }
}

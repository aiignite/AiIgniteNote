/**
 * DrawIO 图表 AI 助手相关功能
 *
 * DrawIO 数据格式（mxGraphModel XML）：
 * - 根节点：<mxGraphModel>
 * - 所有元素在 <root> 下
 * - <mxCell> 表示节点（vertex）和连线（edge）
 * - 节点属性：id, value（文本）, style, geometry（位置大小）
 * - 连线属性：id, source, target, style
 */

import type { AIAssistant } from "../store/aiStore";

// DrawIO 助手配置
export const DRAWIO_ASSISTANT_CONFIG: AIAssistant = {
  id: "drawio",
  name: "DrawIO 绘图助手",
  description:
    "专业的 DrawIO 图表设计助手，支持流程图、架构图、UML 等多种图表类型",
  avatar: "📊",
  model: "", // 使用用户配置的默认模型
  isBuiltIn: true,
  isActive: true,
  systemPrompt: buildDrawIOSystemPrompt(),
};

export interface DrawIOVertex {
  id: string;
  value: string; // 节点文本
  style: string; // 样式字符串
  geometry?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  parent?: string;
}

export interface DrawIOEdge {
  id: string;
  source: string; // 源节点 ID
  target: string; // 目标节点 ID
  style?: string;
  value?: string;
}

export interface DrawIOGraphModel {
  mxGraphModel: {
    $: {
      dx: string;
      dy: string;
      grid: string;
      gridSize: string;
      guides: string;
      tooltips: string;
      connect: string;
      arrows: string;
      fold: string;
      page: string;
      pageScale: string;
      pageWidth: string;
      pageHeight: string;
      math: string;
      shadow: string;
    };
    root: {
      mxCell: Array<{
        $: {
          id: string;
          parent: string;
          source?: string;
          target?: string;
          value?: string;
          style?: string;
          vertex?: string;
          edge?: string;
        };
        mxGeometry?: Array<{
          $: {
            x: string;
            y: string;
            width: string;
            height: string;
            as: string;
          };
        }>;
      }>;
    };
  };
}

export interface DrawIOClipboardData {
  fullData: DrawIOGraphModel;
  selectedData: Array<{
    id: string;
    text: string;
    type: "vertex" | "edge";
    sourceId?: string;
    targetId?: string;
  }>;
  selectedPath?: string[];
}

/**
 * 从 AI 响应中提取 DrawIO XML
 */
export function extractDrawIOXMLFromResponse(response: string): {
  success: boolean;
  data?: string;
  error?: string;
} {
  try {
    // 尝试直接解析
    if (response.includes("<mxGraphModel")) {
      const match = response.match(/<mxGraphModel[\s\S]*?<\/mxGraphModel>/);
      if (match) {
        return { success: true, data: match[0] };
      }
    }

    // 尝试从代码块中提取
    const codeBlockMatch = response.match(/```(?:xml|drawio)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      const content = codeBlockMatch[1];
      if (content.includes("<mxGraphModel")) {
        const xmlMatch = content.match(/<mxGraphModel[\s\S]*?<\/mxGraphModel>/);
        if (xmlMatch) {
          return { success: true, data: xmlMatch[0] };
        }
      }
    }

    return {
      success: false,
      error: "未找到有效的 DrawIO XML 数据",
    };
  } catch (error) {
    return {
      success: false,
      error: `解析失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * 验证 DrawIO XML 格式
 */
export function validateDrawIOXML(xmlString: string): {
  valid: boolean;
  error?: string;
  model?: DrawIOGraphModel;
} {
  try {
    // 检查基本结构
    if (!xmlString.includes("<mxGraphModel")) {
      return { valid: false, error: "缺少 mxGraphModel 根节点" };
    }

    if (!xmlString.includes("</mxGraphModel>")) {
      return { valid: false, error: "mxGraphModel 未闭合" };
    }

    if (!xmlString.includes("<root>")) {
      return { valid: false, error: "缺少 root 节点" };
    }

    if (!xmlString.includes("<mxCell")) {
      return { valid: false, error: "没有找到任何 mxCell 元素" };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `验证失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * 格式化选中的 DrawIO 元素为 AI 提示
 */
export function formatDrawIOForAI(data: DrawIOClipboardData): string {
  let prompt = "";

  if (data.selectedData && data.selectedData.length > 0) {
    prompt += `我选中了以下 ${data.selectedData.length} 个元素:\n\n`;

    // 分类统计
    const vertices = data.selectedData.filter((d) => d.type === "vertex");
    const edges = data.selectedData.filter((d) => d.type === "edge");

    if (vertices.length > 0) {
      prompt += `**节点 (${vertices.length}个)**:\n`;
      vertices.forEach((item, index) => {
        prompt += `  ${index + 1}. ${item.text || "(无文本)"} [ID: ${item.id}]\n`;
      });
      prompt += "\n";
    }

    if (edges.length > 0) {
      prompt += `**连线 (${edges.length}条)**:\n`;
      edges.forEach((item, index) => {
        prompt += `  ${index + 1}. ${item.sourceId} → ${item.targetId}\n`;
        if (item.text) {
          prompt += `     标签: ${item.text}\n`;
        }
      });
      prompt += "\n";
    }

    prompt += "请帮我处理这些选中元素。";
  } else {
    prompt += `## 完整图表数据\n\n`;
    prompt += `当前图表包含完整数据，请分析整体结构。`;
  }

  return prompt;
}

/**
 * 构建 DrawIO 系统提示词
 */
export function buildDrawIOSystemPrompt(): string {
  return `你是一个专业的 DrawIO 图表设计助手，擅长创建和编辑各种类型的图表。

## 支持的图表类型
- 流程图 (Flowchart)
- 序列图 (Sequence Diagram)
- 类图 (Class Diagram)
- ER 图 (Entity Relationship)
- 网络拓扑图 (Network Topology)
- 组织架构图 (Organization Chart)
- UML 图 (Use Case, Activity, State Machine)
- 架构图 (Architecture Diagram)

## DrawIO XML 数据格式规范

### 基本结构
\`\`\`xml
<mxGraphModel dx="914" dy="700" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- 节点和连线 -->
  </root>
</mxGraphModel>
\`\`\`

### 节点（Vertex）示例
\`\`\`xml
<mxCell id="2" value="节点文本" style="rounded=0;whiteSpace=wrap;html=1;" vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="120" height="60" as="geometry"/>
</mxCell>
\`\`\`

### 连线（Edge）示例
\`\`\`xml
<mxCell id="3" value="连线标签" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" source="2" target="4" parent="1">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
\`\`\`

### 重要属性说明
- **id**: 唯一标识符，建议使用简洁的数字或字符串
- **value**: 显示的文本内容
- **style**: 样式字符串，包含外观属性
  - \`shape\`: 形状类型（rectangle, ellipse, rhombus, cylinder等）
  - \`rounded=1\`: 圆角矩形
  - \`whiteSpace=wrap\`: 文本自动换行
  - \`html=1\`: 支持 HTML 格式
  - \`fillColor\`: 填充颜色
  - \`strokeColor\`: 边框颜色
  - \`fontColor\`: 字体颜色
  - \`fontSize\`: 字体大小
- **geometry**: 位置和大小
  - \`x, y\`: 左上角坐标
  - \`width, height\`: 宽度和高度
- **source/target**: 连线的源节点和目标节点 ID

### 常用形状样式
- 矩形: \`shape=rectangle\`
- 椭圆: \`shape=ellipse\`
- 菱形（决策）: \`shape=rhombus\`
- 圆柱体（数据库）: \`shape=cylinder\`
- 文档: \`shape=document\`
- 开始/结束: \`shape=stroke;fillColor=#000000;strokeColor=#000000\`
- 过程: \`shape=rounded=1;whiteSpace=wrap;html=1\`

### 常用连线样式
- 直线: \`edgeStyle=none\`
- 正交: \`edgeStyle=orthogonalEdgeStyle\`
- 曲线: \`edgeStyle=orthogonalEdgeStyle;rounded=1\`
- 虚线: \`dashed=1\`

## 设计原则

1. **清晰性**: 节点间距合理，布局整齐
2. **一致性**: 相同类型元素使用相同样式
3. **可读性**: 字体大小适中，颜色对比明显
4. **专业性**: 遵循行业标准图表规范

## 输出格式要求

1. **必须输出完整的 XML**，从 \`<mxGraphModel>\` 开始到 \`</mxGraphModel>\` 结束
2. **使用简洁的 ID**，如 "2", "3", "4" 等
3. **所有节点必须设置 parent="1"**
4. **连线的 source 和 target 必须引用有效的节点 ID**
5. **geometry 的 as 属性必须设置为 "geometry"**
6. **输出时不要使用 Markdown 代码块标记**，直接输出 XML

## 工作流程

1. 分析用户需求，确定图表类型
2. 设计整体布局结构
3. 创建节点和连线
4. 应用适当的样式
5. 输出完整的 DrawIO XML

请始终保持输出格式正确，确保 XML 可以直接导入 DrawIO 编辑器使用。`;
}

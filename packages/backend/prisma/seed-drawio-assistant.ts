/**
 * 种子脚本: 添加 DrawIO 绘图助手
 *
 * 运行方式:
 * npx ts-node prisma/seed-drawio-assistant.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedDrawIOAssistant() {
  try {
    // 查找演示用户 (demo@ainote.com)
    const user = await prisma.user.findUnique({
      where: { email: "demo@ainote.com" },
    });

    if (!user) {
      console.error("未找到演示用户，请先创建演示账号");
      process.exit(1);
    }

    // 检查是否已存在 DrawIO 助手
    const existingAssistant = await prisma.aiAssistant.findFirst({
      where: {
        id: "drawio",
        userId: user.id,
      },
    });

    if (existingAssistant) {
      console.log("DrawIO 助手已存在，更新配置...");
      await prisma.aiAssistant.update({
        where: { id: "drawio" },
        data: {
          name: "DrawIO 绘图助手",
          description: "专业的 DrawIO 图表设计助手，支持流程图、架构图、UML 等多种图表类型",
          systemPrompt: getDrawIOSystemPrompt(),
          avatar: "📊",
          model: "", // 使用用户配置的默认模型
          temperature: 0.7,
          maxTokens: 4000,
          isBuiltIn: true,
          isActive: true,
          sortOrder: 11, // 在思维导图助手之后
        },
      });
      console.log("✓ DrawIO 助手已更新");
    } else {
      // 创建新的 DrawIO 助手
      await prisma.aiAssistant.create({
        data: {
          id: "drawio",
          name: "DrawIO 绘图助手",
          description: "专业的 DrawIO 图表设计助手，支持流程图、架构图、UML 等多种图表类型",
          systemPrompt: getDrawIOSystemPrompt(),
          avatar: "📊",
          model: "", // 使用用户配置的默认模型
          temperature: 0.7,
          maxTokens: 4000,
          isBuiltIn: true,
          isActive: true,
          sortOrder: 11, // 在思维导图助手之后
          userId: user.id,
        },
      });
      console.log("✓ DrawIO 助手已创建");
    }

    console.log("\n种子数据完成!");
  } catch (error) {
    console.error("种子数据失败:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function getDrawIOSystemPrompt(): string {
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

// 运行种子脚本
seedDrawIOAssistant();

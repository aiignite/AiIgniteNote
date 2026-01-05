/**
 * DrawIO 图表上下文构建器
 * 为 AI 助手提供 DrawIO 图表的完整上下文信息
 */

import { db } from "../../db";
import { DrawIOGraphModel } from "../prompts/drawio-prompts";

/**
 * 获取 DrawIO 图表数据
 */
export async function getDrawIOData(noteId: string): Promise<string | null> {
  try {
    const note = await db.notes.get(noteId);
    if (!note) {
      console.warn("[getDrawIOData] 笔记不存在:", noteId);
      return null;
    }

    // 优先从 metadata.drawioData 获取
    if (note.metadata?.drawioData) {
      console.log("[getDrawIOData] 从 metadata.drawioData 获取数据");
      return note.metadata.drawioData;
    }

    // 回退到从 content 获取
    if (note.content) {
      console.log("[getDrawIOData] 从 content 获取数据");
      return note.content;
    }

    console.warn("[getDrawIOData] 未找到 DrawIO 数据");
    return null;
  } catch (error) {
    console.error("[getDrawIOData] 获取失败:", error);
    return null;
  }
}

/**
 * 检查笔记是否为 DrawIO 图表
 */
export async function isDrawIONote(noteId?: string): Promise<boolean> {
  console.log("[isDrawIONote] 检测笔记类型, noteId:", noteId);

  if (!noteId) {
    console.log("[isDrawIONote] ❌ noteId 为空,返回 false");
    return false;
  }

  try {
    const note = await db.notes.get(noteId);
    console.log("[isDrawIONote] 获取到笔记:", note);
    console.log("[isDrawIONote] 笔记的 fileType:", note?.fileType);

    const isDrawIO = note?.fileType === "drawio";
    console.log("[isDrawIONote] 检测结果:", isDrawIO);

    return isDrawIO;
  } catch (error) {
    console.error("[isDrawIONote] 检测失败:", error);
    return false;
  }
}

/**
 * 构建 DrawIO 上下文，注入到系统提示词中
 */
export async function buildDrawIOContext(
  noteId: string,
): Promise<{ hasContext: boolean; contextPrompt?: string; data?: string }> {
  try {
    const xmlData = await getDrawIOData(noteId);

    if (!xmlData) {
      console.log("[buildDrawIOContext] 没有 DrawIO 数据");
      return { hasContext: false };
    }

    // 验证 XML 格式
    if (!xmlData.includes("<mxGraphModel")) {
      console.warn("[buildDrawIOContext] 数据不是有效的 DrawIO XML");
      return { hasContext: false };
    }

    // 统计信息
    const cellCount = (xmlData.match(/<mxCell/g) || []).length;
    const vertexCount = (xmlData.match(/vertex="1"/g) || []).length;
    const edgeCount = (xmlData.match(/edge="1"/g) || []).length;

    const contextPrompt = `
## 当前 DrawIO 图表数据

**统计信息**:
- 总元素数: ${cellCount}
- 节点数: ${vertexCount}
- 连线数: ${edgeCount}

**完整 XML 数据**:
\`\`\`xml
${xmlData}
\`\`\`

请基于以上图表数据来回答用户的问题。
`.trim();

    console.log("[buildDrawIOContext] 构建完成", {
      cellCount,
      vertexCount,
      edgeCount,
    });

    return {
      hasContext: true,
      contextPrompt,
      data: xmlData,
    };
  } catch (error) {
    console.error("[buildDrawIOContext] 构建失败:", error);
    return { hasContext: false };
  }
}

/**
 * 从 DrawIO XML 中提取节点信息
 */
export function extractDrawIONodes(xmlData: string): Array<{
  id: string;
  text: string;
  type: "vertex" | "edge";
  source?: string;
  target?: string;
}> {
  const nodes: Array<{
    id: string;
    text: string;
    type: "vertex" | "edge";
    source?: string;
    target?: string;
  }> = [];

  // 匹配所有 mxCell 标签
  const cellRegex = /<mxCell\s+([^>]*?)>/g;
  let match;

  while ((match = cellRegex.exec(xmlData)) !== null) {
    const attrs = match[1];

    // 提取 id
    const idMatch = attrs.match(/id="([^"]*)"/);
    const id = idMatch ? idMatch[1] : "";

    // 跳过根节点
    if (id === "0" || id === "1") continue;

    // 提取 value（文本）
    const valueMatch = attrs.match(/value="([^"]*)"/);
    const text = valueMatch ? valueMatch[1] : "";

    // 判断类型
    const isVertex = attrs.includes('vertex="1"');
    const isEdge = attrs.includes('edge="1"');

    if (isVertex) {
      nodes.push({ id, text, type: "vertex" });
    } else if (isEdge) {
      // 提取 source 和 target
      const sourceMatch = attrs.match(/source="([^"]*)"/);
      const targetMatch = attrs.match(/target="([^"]*)"/);
      nodes.push({
        id,
        text,
        type: "edge",
        source: sourceMatch ? sourceMatch[1] : undefined,
        target: targetMatch ? targetMatch[1] : undefined,
      });
    }
  }

  return nodes;
}

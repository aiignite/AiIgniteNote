/**
 * Monaco 代码编辑器上下文构建器
 * 为 AI 助手提供代码文件的完整上下文信息
 */

import { db } from "../../db";

/**
 * 检查笔记是否为 Monaco 代码笔记
 */
export async function isMonacoNote(noteId?: string): Promise<boolean> {
  console.log("[isMonacoNote] 检测笔记类型, noteId:", noteId);

  if (!noteId) {
    console.log("[isMonacoNote] ❌ noteId 为空,返回 false");
    return false;
  }

  try {
    const note = await db.notes.get(noteId);
    console.log("[isMonacoNote] 获取到笔记:", note);
    console.log("[isMonacoNote] 笔记的 fileType:", note?.fileType);

    const isMonaco = note?.fileType === "monaco";
    console.log("[isMonacoNote] 检测结果:", isMonaco);

    return isMonaco;
  } catch (error) {
    console.error("[isMonacoNote] 检测失败:", error);
    return false;
  }
}

/**
 * 获取 Monaco 代码数据
 */
export async function getMonacoData(noteId: string): Promise<string | null> {
  try {
    const note = await db.notes.get(noteId);
    if (!note) {
      console.warn("[getMonacoData] 笔记不存在:", noteId);
      return null;
    }

    // 从 content 获取代码
    if (note.content) {
      console.log("[getMonacoData] 从 content 获取代码");
      return note.content;
    }

    console.warn("[getMonacoData] 未找到代码数据");
    return null;
  } catch (error) {
    console.error("[getMonacoData] 获取失败:", error);
    return null;
  }
}

/**
 * 构建 Monaco 上下文，注入到系统提示词中
 */
export async function buildMonacoContext(
  noteId: string,
): Promise<{ hasContext: boolean; contextPrompt?: string; data?: string }> {
  try {
    const codeData = await getMonacoData(noteId);

    if (!codeData) {
      console.log("[buildMonacoContext] 没有 Monaco 代码数据");
      return { hasContext: false };
    }

    // 统计信息
    const lineCount = codeData.split("\n").length;
    const charCount = codeData.length;

    const contextPrompt = `
## 当前代码文件数据

**统计信息**:
- 总字符数: ${charCount}
- 总行数: ${lineCount}

**完整代码**:
\`\`\`javascript
${codeData}
\`\`\`

请基于以上代码数据来回答用户的问题。
`.trim();

    console.log("[buildMonacoContext] 构建完成", {
      lineCount,
      charCount,
    });

    return {
      hasContext: true,
      contextPrompt,
      data: codeData,
    };
  } catch (error) {
    console.error("[buildMonacoContext] 构建失败:", error);
    return { hasContext: false };
  }
}

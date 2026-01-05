/**
 * 通用文本编辑器上下文构建器
 * 为 AI 助手提供纯文本文件的完整上下文信息
 * 支持 Markdown、富文本等基于文本的文件类型
 */

import { db } from "../../db";
import { NoteFileType } from "../../types/local";

/**
 * 检查笔记是否为指定的文本类型
 * @param noteId 笔记 ID
 * @param fileTypes 要检查的文件类型数组，默认检查所有文本类型
 * @returns 是否为指定的文本类型
 */
export async function isTextNote(
  noteId?: string,
  fileTypes: NoteFileType[] = [NoteFileType.MARKDOWN, NoteFileType.RICH_TEXT],
): Promise<boolean> {
  console.log(
    "[isTextNote] 检测笔记类型, noteId:",
    noteId,
    "fileTypes:",
    fileTypes,
  );

  if (!noteId) {
    console.log("[isTextNote] ❌ noteId 为空,返回 false");
    return false;
  }

  try {
    const note = await db.notes.get(noteId);
    console.log("[isTextNote] 获取到笔记:", note);
    console.log("[isTextNote] 笔记的 fileType:", note?.fileType);

    const isText = note?.fileType && fileTypes.includes(note.fileType);
    console.log("[isTextNote] 检测结果:", isText);

    return isText || false;
  } catch (error) {
    console.error("[isTextNote] 检测失败:", error);
    return false;
  }
}

/**
 * 获取笔记的文本内容
 * @param noteId 笔记 ID
 * @returns 文本内容，如果不存在或获取失败则返回 null
 */
export async function getTextContent(noteId: string): Promise<string | null> {
  try {
    const note = await db.notes.get(noteId);
    if (!note) {
      console.warn("[getTextContent] 笔记不存在:", noteId);
      return null;
    }

    if (note.content) {
      console.log("[getTextContent] 从 content 获取文本内容");
      return note.content;
    }

    console.warn("[getTextContent] 未找到文本内容");
    return null;
  } catch (error) {
    console.error("[getTextContent] 获取失败:", error);
    return null;
  }
}

/**
 * 构建文本笔记的上下文
 * @param noteId 笔记 ID
 * @param fileType 文件类型
 * @returns 包含上下文信息的对象
 */
export async function buildTextContext(
  noteId: string,
  fileType: NoteFileType,
): Promise<{
  hasContext: boolean;
  contextPrompt?: string;
  data?: string;
}> {
  try {
    const textContent = await getTextContent(noteId);

    if (!textContent) {
      console.log("[buildTextContext] 没有文本内容");
      return { hasContext: false };
    }

    const lineCount = textContent.split("\n").length;
    const charCount = textContent.length;

    // 根据文件类型生成不同的标签和说明
    const fileTypeLabels: Record<NoteFileType, string> = {
      [NoteFileType.MARKDOWN]: "Markdown 文档",
      [NoteFileType.RICH_TEXT]: "富文本文档",
      [NoteFileType.MINDMAP]: "思维导图",
      [NoteFileType.DRAWIO]: "DrawIO 图表",
      [NoteFileType.MONACO]: "代码文件",
    };

    const fileTypeLabel = fileTypeLabels[fileType] || "文本文档";

    const contextPrompt = `
## 当前${fileTypeLabel}内容

**统计信息**:
- 文档类型: ${fileTypeLabel}
- 总字符数: ${charCount}
- 总行数: ${lineCount}

**完整内容**:
\`\`\`
${textContent}
\`\`\`

请基于以上${fileTypeLabel}内容来回答用户的问题。
`.trim();

    console.log("[buildTextContext] 构建完成", {
      fileType,
      fileTypeLabel,
      lineCount,
      charCount,
    });

    return {
      hasContext: true,
      contextPrompt,
      data: textContent,
    };
  } catch (error) {
    console.error("[buildTextContext] 构建失败:", error);
    return { hasContext: false };
  }
}

/**
 * 获取笔记的文件类型
 * @param noteId 笔记 ID
 * @returns 文件类型，如果笔记不存在则返回 null
 */
export async function getNoteFileType(
  noteId: string,
): Promise<NoteFileType | null> {
  try {
    const note = await db.notes.get(noteId);
    return note?.fileType || null;
  } catch (error) {
    console.error("[getNoteFileType] 获取失败:", error);
    return null;
  }
}

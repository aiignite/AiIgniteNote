/**
 * 思维导图AI助手上下文构建器
 *
 * 功能:
 * - 自动检测思维导图笔记
 * - 注入最新的思维导图JSON到AI请求
 * - 根据文件大小选择合适的消息策略
 * - 管理token使用,避免超限
 */

import { db } from "../../db";
import { AIConversation } from "../../types";
import { ChatMessage } from "./ai";
import { estimateTokens } from "./contextManager";

// ============================================
// 配置常量
// ============================================

const MINDMAP_CONTEXT_CONFIG = {
  // 小文件阈值 (tokens)
  SMALL_FILE_THRESHOLD: 1000,
  // 大文件阈值 (tokens)
  LARGE_FILE_THRESHOLD: 2000,
  // 系统提示词预留token
  SYSTEM_RESERVE: 500,
  // 用户消息预留token
  USER_RESERVE: 500,
  // buffer
  BUFFER: 200,
} as const;

// ============================================
// 工具函数
// ============================================

/**
 * 检测是否是思维导图笔记
 */
export async function isMindMapNote(noteId?: string): Promise<boolean> {
  console.log("[isMindMapNote] 检测笔记类型, noteId:", noteId);

  if (!noteId) {
    console.log("[isMindMapNote] ❌ noteId 为空,返回 false");
    return false;
  }

  try {
    const note = await db.notes.get(noteId);
    console.log("[isMindMapNote] 获取到笔记:", note);
    console.log("[isMindMapNote] 笔记的 fileType:", note?.fileType);

    const isMindMap = note?.fileType === "mindmap";
    console.log("[isMindMapNote] 检测结果:", isMindMap);

    return isMindMap;
  } catch (error) {
    console.error("[isMindMapNote] 检测失败:", error);
    return false;
  }
}

/**
 * 获取思维导图数据
 */
export async function getMindMapData(noteId: string): Promise<any | null> {
  try {
    const note = await db.notes.get(noteId);
    if (!note?.metadata?.mindmapData) {
      return null;
    }

    return JSON.parse(note.metadata.mindmapData);
  } catch (error) {
    console.error("[getMindMapData] 获取失败:", error);
    return null;
  }
}

/**
 * 计算数据哈希 (简单版本: 使用长度)
 */
export function calculateDataHash(data: any): string {
  try {
    const jsonStr = JSON.stringify(data);
    return `${jsonStr.length}_${Object.keys(data).length}`;
  } catch {
    return "unknown";
  }
}

/**
 * 统计节点数量
 */
export function countNodes(data: any): number {
  if (!data || !data.data) return 0;

  let count = 1; // 根节点

  const countChildren = (node: any) => {
    if (node.data && node.data.children && Array.isArray(node.data.children)) {
      for (const child of node.data.children) {
        count++;
        countChildren(child);
      }
    }
  };

  countChildren(data);
  return count;
}

/**
 * 获取最大深度
 */
export function getMaxDepth(data: any): number {
  if (!data || !data.data) return 0;

  const getDepth = (node: any, currentDepth: number = 0): number => {
    if (
      !node.data ||
      !node.data.children ||
      !Array.isArray(node.data.children) ||
      node.data.children.length === 0
    ) {
      return currentDepth;
    }

    return Math.max(
      ...node.data.children.map((child) => getDepth(child, currentDepth + 1)),
    );
  };

  return getDepth(data);
}

/**
 * 提取主要主题
 */
export function extractMainThemes(data: any, limit: number = 5): string[] {
  if (!data || !data.data || !data.data.children) return [];

  return data.data.children
    .slice(0, limit)
    .map((child: any) => child.data?.text || "")
    .filter(Boolean);
}

/**
 * 生成结构摘要 (用于大文件)
 */
export function generateStructureSummary(data: any): string {
  const nodeCount = countNodes(data);
  const depth = getMaxDepth(data);
  const themes = extractMainThemes(data, 3);
  const rootText = data.data?.text || "未命名";

  return `思维导图 "${rootText}" 包含 ${nodeCount} 个节点,最大深度 ${depth} 层。主要主题: ${themes.join(", ") || "无"}`;
}

// ============================================
// 上下文构建器
// ============================================

/**
 * 构建思维导图专用上下文
 */
export async function buildMindMapContext(
  noteId: string,
  conversation: AIConversation,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 4000,
): Promise<{
  messages: ChatMessage[];
  strategy: "small" | "large" | "summary";
  info: {
    nodeCount: number;
    depth: number;
    jsonTokens: number;
    dataHash: string;
  };
}> {
  console.log("[MindMapContext] 开始构建思维导图上下文, noteId:", noteId);

  // 1. 获取最新思维导图数据
  const mindmapData = await getMindMapData(noteId);

  if (!mindmapData) {
    console.warn("[MindMapContext] 未找到思维导图数据,使用普通模式");
    return buildFallbackContext(systemPrompt, userMessage, conversation);
  }

  // 2. 分析数据
  const nodeCount = countNodes(mindmapData);
  const depth = getMaxDepth(mindmapData);
  const dataHash = calculateDataHash(mindmapData);

  console.log("[MindMapContext] 数据分析:", { nodeCount, depth, dataHash });

  // 3. 格式化JSON
  const jsonStr = JSON.stringify(mindmapData, null, 2);
  const jsonTokens = estimateTokens(jsonStr);

  console.log("[MindMapContext] JSON大小:", jsonTokens, "tokens");

  // 4. 根据大小选择策略
  if (jsonTokens < MINDMAP_CONTEXT_CONFIG.SMALL_FILE_THRESHOLD) {
    console.log("[MindMapContext] 使用小文件策略");
    return buildSmallFileContext(mindmapData, jsonStr, jsonTokens, systemPrompt, userMessage, conversation, maxTokens, { nodeCount, depth, dataHash });
  } else if (jsonTokens < MINDMAP_CONTEXT_CONFIG.LARGE_FILE_THRESHOLD) {
    console.log("[MindMapContext] 使用大文件策略");
    return buildLargeFileContext(mindmapData, jsonStr, jsonTokens, systemPrompt, userMessage, maxTokens, { nodeCount, depth, dataHash });
  } else {
    console.log("[MindMapContext] 使用超大文件策略(摘要模式)");
    return buildSummaryContext(mindmapData, systemPrompt, userMessage, maxTokens, { nodeCount, depth, dataHash });
  }
}

/**
 * 小文件策略: JSON + 历史消息
 */
function buildSmallFileContext(
  mindmapData: any,
  jsonStr: string,
  jsonTokens: number,
  systemPrompt: string,
  userMessage: string,
  conversation: AIConversation,
  maxTokens: number,
  info: any,
) {
  // 构建包含JSON的系统提示词
  const enhancedPrompt = `${systemPrompt}

## 当前思维导图数据
以下是用户当前正在编辑的思维导图的完整JSON数据:

\`\`\`json
${jsonStr}
\`\`\`

请基于以上思维导图数据,理解用户的需求并生成修改后的完整JSON。记住只输出一个JSON代码块。`;

  const systemPromptTokens = estimateTokens(enhancedPrompt);
  const userMessageTokens = estimateTokens(userMessage);

  // 计算可用于历史消息的token
  const availableForHistory =
    maxTokens -
    systemPromptTokens -
    userMessageTokens -
    MINDMAP_CONTEXT_CONFIG.BUFFER;

  console.log("[MindMapContext] 可用于历史消息的token:", availableForHistory);

  const messages: ChatMessage[] = [{ role: "system", content: enhancedPrompt }];

  // 添加历史消息 (如果空间允许)
  let usedTokens = 0;
  for (const msg of conversation.messages) {
    const msgTokens = estimateTokens(msg.content);
    if (usedTokens + msgTokens > availableForHistory) {
      console.log(
        `[MindMapContext] 跳过历史消息,已使用 ${usedTokens}/${availableForHistory} tokens`,
      );
      break;
    }
    messages.push({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    });
    usedTokens += msgTokens;
  }

  // 添加当前用户消息
  messages.push({ role: "user", content: userMessage });

  return {
    messages,
    strategy: "small" as const,
    info: { ...info, jsonTokens },
  };
}

/**
 * 大文件策略: 只发送 JSON, 不发送历史
 */
function buildLargeFileContext(
  mindmapData: any,
  jsonStr: string,
  jsonTokens: number,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  info: any,
) {
  // 构建包含JSON的系统提示词
  const enhancedPrompt = `${systemPrompt}

## 当前思维导图数据
以下是用户当前正在编辑的思维导图的完整JSON数据:

\`\`\`json
${jsonStr}
\`\`\`

请基于以上思维导图数据,理解用户的需求并生成修改后的完整JSON。记住只输出一个JSON代码块。

注意: 由于思维导图较大,本次请求不包含历史对话消息。如果你的回复需要基于之前的对话,请明确说明。`;

  const messages: ChatMessage[] = [
    { role: "system", content: enhancedPrompt },
    { role: "user", content: userMessage },
  ];

  console.log("[MindMapContext] 大文件策略,不包含历史消息");

  return {
    messages,
    strategy: "large" as const,
    info: { ...info, jsonTokens },
  };
}

/**
 * 超大文件策略: 只发送结构摘要
 */
function buildSummaryContext(
  mindmapData: any,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  info: any,
) {
  const summary = generateStructureSummary(mindmapData);

  const enhancedPrompt = `${systemPrompt}

## 当前思维导图概述
${summary}

这是一个较大的思维导图,为了节省token,这里只显示结构概述。

如果你需要完整的JSON数据进行修改,请明确说明,我会提供完整数据。

当前用户需求: ${userMessage}

请基于思维导图的概述和用户需求进行回复。如果需要完整JSON才能完成修改,请说明理由。`;

  const messages: ChatMessage[] = [
    { role: "system", content: enhancedPrompt },
    { role: "user", content: userMessage },
  ];

  console.log("[MindMapContext] 超大文件策略,只发送摘要");

  return {
    messages,
    strategy: "summary" as const,
    info: { ...info, jsonTokens: 0 },
  };
}

/**
 * 降级方案: 没有思维导图数据
 */
function buildFallbackContext(
  systemPrompt: string,
  userMessage: string,
  conversation: AIConversation,
) {
  console.log("[MindMapContext] 使用降级方案");
  console.log("[MindMapContext] userMessage:", userMessage);
  console.log(
    "[MindMapContext] conversation.messages.length:",
    conversation.messages.length,
  );

  const messages: ChatMessage[] = [{ role: "system", content: systemPrompt }];

  // 添加历史消息
  for (const msg of conversation.messages) {
    messages.push({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    });
  }

  console.log("[MindMapContext] 历史消息数量:", messages.length - 1);

  // 添加当前用户消息
  messages.push({ role: "user", content: userMessage });

  console.log("[MindMapContext] 最终消息数量:", messages.length);
  console.log("[MindMapContext] 最后一条消息:", messages[messages.length - 1]);

  return {
    messages,
    strategy: "small" as const,
    info: { nodeCount: 0, depth: 0, jsonTokens: 0, dataHash: "fallback" },
  };
}

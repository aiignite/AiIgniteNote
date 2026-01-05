import { AIMessage, AIConversation } from "../../types";
import { aiApi, ChatMessage } from "./ai";
import { isMindMapNote, buildMindMapContext } from "./mindmapContextBuilder";
import { isDrawIONote, buildDrawIOContext } from "./drawioContextBuilder";

// ============================================
// 配置常量
// ============================================

/**
 * Token 估算配置
 */
const TOKEN_CONFIG = {
  // 中文：约 1.5 字符 = 1 token
  CHARS_PER_TOKEN_ZH: 1.5,
  // 英文：约 4 字符 = 1 token
  CHARS_PER_TOKEN_EN: 4,
  // 代码/混合内容：保守估计
  CHARS_PER_TOKEN_MIXED: 2.5,
  // 触发压缩的阈值（占最大 token 的比例）
  COMPRESS_THRESHOLD: 0.7,
  // 压缩后的最大占比
  COMPRESS_TARGET: 0.2,
  // 压缩后保留的最近消息数量
  KEEP_RECENT_MESSAGES: 6,
  // 默认模型最大 token 数（保守估计，大多数模型支持 4k-8k）
  DEFAULT_MAX_TOKENS: 4000,
  // 系统提示词预留 token
  SYSTEM_PROMPT_RESERVE: 500,
} as const;

// ============================================
// Token 估算工具
// ============================================

/**
 * 估算文本的 token 数量
 * 使用启发式方法：检测中英文比例
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;

  // 移除多余空白
  const cleaned = text.replace(/\s+/g, " ").trim();
  const charCount = cleaned.length;

  if (charCount === 0) return 0;

  // 统计中文字符数量（包括中文标点）
  const chineseChars = (
    cleaned.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g) || []
  ).length;
  const chineseRatio = chineseChars / charCount;

  // 根据中英文比例选择估算系数
  let charsPerToken: number;
  if (chineseRatio > 0.5) {
    // 中文为主
    charsPerToken = TOKEN_CONFIG.CHARS_PER_TOKEN_ZH;
  } else if (chineseRatio < 0.2) {
    // 英文为主
    charsPerToken = TOKEN_CONFIG.CHARS_PER_TOKEN_EN;
  } else {
    // 中英混合
    charsPerToken = TOKEN_CONFIG.CHARS_PER_TOKEN_MIXED;
  }

  return Math.ceil(charCount / charsPerToken);
}

/**
 * 估算消息列表的总 token 数量
 */
export function estimateMessagesTokens(messages: AIMessage[]): number {
  return messages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
}

/**
 * 估算包含 system prompt 后的总 token 数
 */
export function estimateTotalTokens(
  messages: AIMessage[],
  systemPrompt?: string,
): number {
  let total = estimateMessagesTokens(messages);
  if (systemPrompt) {
    total += estimateTokens(systemPrompt) + TOKEN_CONFIG.SYSTEM_PROMPT_RESERVE;
  }
  return total;
}

// ============================================
// 上下文压缩服务
// ============================================

/**
 * 压缩提示词模板
 */
const COMPRESS_PROMPT = `请将以下对话历史压缩成简洁的摘要，保留关键信息和上下文。

要求：
1. 提取用户的主要问题和需求
2. 总结助手提供的核心回答和建议
3. 保留重要的数据、参数、结论
4. 省略寒暄和冗余内容
5. 使用清晰的结构（如要点列表）
6. 控制在原文长度的 20% 以内

对话历史：
{conversation_history}

请输出摘要：`;

/**
 * 压缩对话历史
 * @param conversation 要压缩的对话
 * @param signal 可选的 AbortSignal 用于取消请求
 * @returns 压缩后的摘要文本
 */
export async function compressConversationContext(
  conversation: AIConversation,
  signal?: AbortSignal,
): Promise<string> {
  const { messages } = conversation;

  if (messages.length === 0) {
    return "";
  }

  // 构建要压缩的对话文本
  const conversationText = messages
    .map((msg) => {
      const role = msg.role === "user" ? "用户" : "助手";
      return `${role}：${msg.content}`;
    })
    .join("\n\n");

  // 构建压缩请求的 prompt
  const compressPrompt = COMPRESS_PROMPT.replace(
    "{conversation_history}",
    conversationText,
  );

  // 调用 AI 进行压缩
  try {
    let summary = "";
    await aiApi.chatStream(
      {
        messages: [
          {
            role: "user",
            content: compressPrompt,
          },
        ],
      },
      (chunk: string) => {
        summary += chunk;
      },
      (error: string) => {
        throw new Error(error);
      },
      signal,
    );

    return summary.trim();
  } catch (error) {
    console.error("压缩对话上下文失败:", error);
    // 压缩失败时返回简单摘要
    return generateSimpleSummary(messages);
  }
}

/**
 * 生成简单的对话摘要（作为压缩失败的降级方案）
 */
function generateSimpleSummary(messages: AIMessage[]): string {
  if (messages.length === 0) return "";

  const summaries: string[] = [];

  for (const msg of messages) {
    if (msg.role === "user") {
      // 提取用户问题（截取前 50 字）
      const content = msg.content.slice(0, 50);
      summaries.push(
        `用户询问：${content}${msg.content.length > 50 ? "..." : ""}`,
      );
    }
  }

  return summaries.join("\n") || "对话历史记录";
}

// ============================================
// 上下文管理策略
// ============================================

/**
 * 上下文管理配置
 */
export interface ContextManagerConfig {
  maxTokens?: number; // 最大 token 数量
  compressThreshold?: number; // 触发压缩的阈值（0-1）
  compressTarget?: number; // 压缩后目标占比（0-1）
  keepRecentMessages?: number; // 压缩后保留的最近消息数
  currentUserMessage?: string; // 当前正在发送的用户消息（用于思维导图上下文）
}

/**
 * 构建发送给 AI 的消息列表
 * 自动处理上下文压缩
 *
 * @param conversation 对话对象
 * @param systemPrompt 系统提示词
 * @param config 配置选项
 * @param signal 可选的 AbortSignal
 * @returns 处理后的消息列表
 */
export async function buildMessagesForAI(
  conversation: AIConversation,
  systemPrompt: string,
  config: ContextManagerConfig = {},
  signal?: AbortSignal,
): Promise<ChatMessage[]> {
  // 检查是否是思维导图笔记,使用专用上下文构建器
  console.log("[ContextManager] buildMessagesForAI 被调用");
  console.log("[ContextManager] conversation.noteId:", conversation.noteId);

  const isMindMap = await isMindMapNote(conversation.noteId);
  const isDrawIO = await isDrawIONote(conversation.noteId);

  console.log("[ContextManager] isMindMap 检测结果:", isMindMap);
  console.log("[ContextManager] isDrawIO 检测结果:", isDrawIO);

  if (isMindMap && conversation.noteId) {
    console.log("[ContextManager] ✅ 检测到思维导图笔记,使用专用上下文构建");

    // 使用传入的当前用户消息，或从对话历史中获取
    const userMessage =
      config.currentUserMessage ||
      (() => {
        const lastMessage =
          conversation.messages[conversation.messages.length - 1];
        return lastMessage?.role === "user" ? lastMessage.content : "";
      })();

    console.log("[ContextManager] 使用的用户消息:", userMessage);

    const result = await buildMindMapContext(
      conversation.noteId,
      conversation,
      systemPrompt,
      userMessage,
      config.maxTokens || TOKEN_CONFIG.DEFAULT_MAX_TOKENS,
    );

    console.log("[ContextManager] 思维导图上下文构建完成:", {
      strategy: result.strategy,
      nodeCount: result.info.nodeCount,
      jsonTokens: result.info.jsonTokens,
      messagesCount: result.messages.length,
    });

    return result.messages;
  }

  if (isDrawIO && conversation.noteId) {
    console.log("[ContextManager] ✅ 检测到 DrawIO 笔记,使用专用上下文构建");

    // 使用传入的当前用户消息，或从对话历史中获取
    const userMessage =
      config.currentUserMessage ||
      (() => {
        const lastMessage =
          conversation.messages[conversation.messages.length - 1];
        return lastMessage?.role === "user" ? lastMessage.content : "";
      })();

    console.log("[ContextManager] 使用的用户消息:", userMessage);

    const result = await buildDrawIOContext(conversation.noteId);

    if (result.hasContext && result.contextPrompt) {
      // 构建包含 DrawIO 上下文的消息
      const messages: ChatMessage[] = [
        {
          role: "system",
          content: `${systemPrompt}\n\n${result.contextPrompt}`,
        },
        ...conversation.messages.slice(-6), // 只保留最近6条历史消息
        {
          role: "user",
          content: userMessage,
        },
      ];

      console.log("[ContextManager] DrawIO 上下文构建完成:", {
        hasContext: true,
        messagesCount: messages.length,
      });

      return messages;
    }
  }

  // 原有的普通对话逻辑
  const {
    maxTokens = TOKEN_CONFIG.DEFAULT_MAX_TOKENS,
    compressThreshold = TOKEN_CONFIG.COMPRESS_THRESHOLD,
    compressTarget = TOKEN_CONFIG.COMPRESS_TARGET,
    keepRecentMessages = TOKEN_CONFIG.KEEP_RECENT_MESSAGES,
  } = config;

  const { messages, contextSummary } = conversation;

  // 估算当前消息列表的 token 数（不含 system prompt）
  const messagesTokens = estimateMessagesTokens(messages);
  const totalTokens =
    messagesTokens +
    estimateTokens(systemPrompt) +
    TOKEN_CONFIG.SYSTEM_PROMPT_RESERVE;

  // 如果未超过阈值，直接返回
  if (totalTokens <= maxTokens * compressThreshold) {
    return buildFinalMessages(messages, systemPrompt, contextSummary);
  }

  console.log(
    `[上下文管理] Token 数量 ${totalTokens} 超过阈值 ${maxTokens * compressThreshold}，需要压缩`,
  );

  // 需要压缩：检查是否有现有摘要
  let newSummary = contextSummary || "";

  // 计算需要压缩的消息数量
  const messagesToCompressCount = Math.max(
    0,
    messages.length - keepRecentMessages,
  );

  if (messagesToCompressCount > 0) {
    const messagesToCompress = messages.slice(0, messagesToCompressCount);

    // 如果有现有摘要，需要合并压缩
    if (newSummary) {
      const mergeText = `【之前的对话摘要】\n${newSummary}\n\n【新增的对话】\n${messagesToCompress
        .map((m) => `${m.role === "user" ? "用户" : "助手"}：${m.content}`)
        .join("\n\n")}`;

      // 估算合并后的 token
      const mergeTokens = estimateTokens(mergeText);

      // 如果合并后仍然太大，递归压缩
      if (mergeTokens > maxTokens * compressTarget) {
        try {
          newSummary = await compressConversationContext(
            {
              ...conversation,
              messages: messagesToCompress,
            },
            signal,
          );
        } catch {
          // 压缩失败，使用简单摘要
          newSummary = generateSimpleSummary(messagesToCompress);
        }
      } else {
        newSummary = mergeText;
      }
    } else {
      // 首次压缩
      try {
        newSummary = await compressConversationContext(
          {
            ...conversation,
            messages: messagesToCompress,
          },
          signal,
        );
      } catch {
        // 压缩失败，使用简单摘要
        newSummary = generateSimpleSummary(messagesToCompress);
      }
    }
  }

  // 构建最终消息：摘要（作为 system）+ 最近的消息
  const recentMessages = messages.slice(-keepRecentMessages);
  return buildFinalMessages(recentMessages, systemPrompt, newSummary);
}

/**
 * 构建最终的消息列表
 */
function buildFinalMessages(
  messages: AIMessage[],
  systemPrompt: string,
  contextSummary?: string,
): ChatMessage[] {
  const result: ChatMessage[] = [];

  // 添加 system prompt
  let finalSystemPrompt = systemPrompt;

  // 如果有上下文摘要，附加到 system prompt 前面
  if (contextSummary) {
    finalSystemPrompt = `【之前的对话上下文摘要】\n${contextSummary}\n\n${systemPrompt}`;
  }

  result.push({
    role: "system",
    content: finalSystemPrompt,
  });

  // 添加消息历史
  for (const msg of messages) {
    result.push({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    });
  }

  return result;
}

/**
 * 获取对话的 token 使用情况
 */
export function getTokenUsage(
  conversation: AIConversation,
  systemPrompt: string,
): {
  messagesTokens: number;
  systemPromptTokens: number;
  totalTokens: number;
  percentageOfMax: number;
  needsCompression: boolean;
} {
  const maxTokens = TOKEN_CONFIG.DEFAULT_MAX_TOKENS;
  const messagesTokens = estimateMessagesTokens(conversation.messages);
  const systemPromptTokens =
    estimateTokens(systemPrompt) + TOKEN_CONFIG.SYSTEM_PROMPT_RESERVE;
  const totalTokens = messagesTokens + systemPromptTokens;

  return {
    messagesTokens,
    systemPromptTokens,
    totalTokens,
    percentageOfMax: totalTokens / maxTokens,
    needsCompression: totalTokens > maxTokens * TOKEN_CONFIG.COMPRESS_THRESHOLD,
  };
}

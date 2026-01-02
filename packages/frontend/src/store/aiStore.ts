import { create } from "zustand";
import { AIConversation, AIMessage, AIActionType } from "../types";
import { db } from "../db";
import { aiApi, ChatMessage } from "../lib/api/ai";

interface AIStore {
  conversations: AIConversation[];
  currentConversation: AIConversation | null;
  isLoading: boolean;
  isStreaming: boolean;
  currentResponse: string;
  selectedText: string; // 添加选中文本状态

  // Actions
  loadConversations: (noteId?: string) => Promise<void>;
  createConversation: (noteId?: string) => Promise<AIConversation>;
  setCurrentConversation: (conversation: AIConversation | null) => void;
  setSelectedText: (text: string) => void; // 添加设置选中文本的方法
  addMessage: (
    conversationId: string,
    message: Omit<AIMessage, "id" | "timestamp">,
  ) => Promise<void>;
  updateStreamingResponse: (text: string) => void;
  clearStreamingResponse: () => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  sendMessage: (
    conversationId: string,
    content: string,
    actionType?: AIActionType,
    signal?: AbortSignal,
  ) => Promise<void>;
}

export const useAIStore = create<AIStore>((set, get) => ({
  conversations: [],
  currentConversation: null,
  isLoading: false,
  isStreaming: false,
  currentResponse: "",
  selectedText: "", // 初始化选中文本状态

  loadConversations: async (noteId) => {
    set({ isLoading: true });
    try {
      const conversations = await db.getConversations(noteId);
      set({ conversations, isLoading: false });
    } catch (error) {
      console.error("Failed to load conversations:", error);
      set({ isLoading: false });
    }
  },

  createConversation: async (noteId) => {
    try {
      const conversation = await db.createConversation({
        noteId,
        messages: [],
      });
      set((state) => ({
        conversations: [conversation, ...state.conversations],
        currentConversation: conversation, // 设置为当前对话
      }));
      return conversation;
    } catch (error) {
      console.error("Failed to create conversation:", error);
      throw error;
    }
  },

  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation });
  },

  setSelectedText: (text) => {
    set({ selectedText: text });
  },

  addMessage: async (conversationId, message) => {
    try {
      await db.addMessage(conversationId, message);
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: [
                  ...conv.messages,
                  {
                    ...message,
                    id: `msg_${Date.now()}`,
                    timestamp: Date.now(),
                  },
                ],
                updatedAt: Date.now(),
              }
            : conv,
        ),
        currentConversation:
          state.currentConversation?.id === conversationId
            ? {
                ...state.currentConversation,
                messages: [
                  ...state.currentConversation.messages,
                  {
                    ...message,
                    id: `msg_${Date.now()}`,
                    timestamp: Date.now(),
                  },
                ],
                updatedAt: Date.now(),
              }
            : state.currentConversation,
      }));
    } catch (error) {
      console.error("Failed to add message:", error);
      throw error;
    }
  },

  updateStreamingResponse: (text) => {
    set({ currentResponse: text, isStreaming: true });
  },

  clearStreamingResponse: () => {
    set({ currentResponse: "", isStreaming: false });
  },

  deleteConversation: async (conversationId) => {
    try {
      await db.conversations.delete(conversationId);
      set((state) => ({
        conversations: state.conversations.filter(
          (conv) => conv.id !== conversationId,
        ),
        currentConversation:
          state.currentConversation?.id === conversationId
            ? null
            : state.currentConversation,
      }));
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      throw error;
    }
  },

  sendMessage: async (
    conversationId,
    content,
    _actionType = "custom",
    signal,
  ) => {
    set({ isLoading: true, isStreaming: true, currentResponse: "" });

    // 添加用户消息
    await get().addMessage(conversationId, {
      role: "user",
      content,
    });

    // 获取对话历史
    const conversation = get().conversations.find(
      (c) => c.id === conversationId,
    );
    if (!conversation) {
      throw new Error("对话不存在");
    }

    // 构建消息历史
    const messages: ChatMessage[] = conversation.messages.map((msg) => ({
      role: msg.role as "system" | "user" | "assistant",
      content: msg.content,
    }));

    // 检查是否已取消
    if (signal?.aborted) {
      set({ isLoading: false, isStreaming: false });
      return; // 正常返回，不抛出错误
    }

    // 调用后端AI API，使用流式响应
    let fullResponse = "";
    let streamError: string | null = null;
    let isAborted = false;

    try {
      await aiApi.chatStream(
        { messages },
        (chunk: string) => {
          fullResponse += chunk;
          set({ currentResponse: fullResponse });
        },
        (error: string) => {
          // 保存错误信息，稍后抛出
          streamError = error;
        },
        signal,
      );

      // 如果流式响应中有错误，抛出错误
      if (streamError) {
        throw new Error(streamError);
      }

      set({ isStreaming: false });

      // 添加AI助手消息，包含 actionType
      await get().addMessage(conversationId, {
        role: "assistant",
        content: fullResponse,
        actionType: _actionType !== "custom" ? _actionType : undefined,
      });

      set({ isLoading: false, currentResponse: "" });
    } catch (error: any) {
      // 检查是否是用户主动停止
      if (error.name === "AbortError" || signal?.aborted) {
        isAborted = true;
      }

      if (isAborted) {
        // 用户主动停止：保存已生成的部分响应
        if (fullResponse) {
          await get().addMessage(conversationId, {
            role: "assistant",
            content: fullResponse,
            actionType: _actionType !== "custom" ? _actionType : undefined,
          });
        }
        set({ isLoading: false, isStreaming: false, currentResponse: "" });
      } else {
        // 其他错误：清空状态并抛出错误
        console.error("Failed to send message:", error);
        set({ isLoading: false, isStreaming: false, currentResponse: "" });
        throw error;
      }
    }
  },
}));

import { create } from "zustand";
import { AIConversation, AIMessage, AIActionType } from "../types";
import { db } from "../db";
import { createAIService } from "../services/aiService";

interface AIStore {
  conversations: AIConversation[];
  currentConversation: AIConversation | null;
  isLoading: boolean;
  isStreaming: boolean;
  currentResponse: string;

  // Actions
  loadConversations: (noteId?: string) => Promise<void>;
  createConversation: (noteId?: string) => Promise<AIConversation>;
  setCurrentConversation: (conversation: AIConversation | null) => void;
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

    try {
      // 添加用户消息
      await get().addMessage(conversationId, {
        role: "user",
        content,
      });

      // 获取当前启用的模型配置
      const modelConfig = await db.getEnabledModelConfig();

      if (!modelConfig || !modelConfig.apiKey) {
        throw new Error("请先配置API密钥");
      }

      // 创建AI服务实例
      const aiService = createAIService(modelConfig);

      // 获取对话历史
      const conversation = get().conversations.find(
        (c) => c.id === conversationId,
      );
      if (!conversation) {
        throw new Error("对话不存在");
      }

      // 构建消息历史
      const messages = conversation.messages.map((msg) => ({
        role: msg.role as "system" | "user" | "assistant",
        content: msg.content,
      }));

      // 检查是否已取消
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      // 调用AI服务，使用流式响应
      let fullResponse = "";
      await aiService.chat(messages, (chunk) => {
        // 检查是否在流式传输中被取消
        if (signal?.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }
        fullResponse += chunk;
        set({ currentResponse: fullResponse });
      });

      set({ isStreaming: false });

      // 添加AI助手消息
      await get().addMessage(conversationId, {
        role: "assistant",
        content: fullResponse,
      });

      set({ isLoading: false, currentResponse: "" });
    } catch (error) {
      console.error("Failed to send message:", error);
      set({ isLoading: false, isStreaming: false, currentResponse: "" });
      throw error;
    }
  },
}));

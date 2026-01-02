import { create } from "zustand";
import { AIConversation, AIMessage } from "../types";
import { db } from "../db";
import { aiApi, ChatMessage } from "../lib/api/ai";
import { buildMessagesForAI, getTokenUsage } from "../lib/api/contextManager";
import { useModelStore } from "./modelStore";

// ============================================
// AI 助手类型定义
// ============================================

export interface AIAssistant {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  avatar?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  isBuiltIn?: boolean;
  isActive?: boolean;
}

// 内置助手定义
// 注意：model 字段为空字符串表示使用用户配置的默认模型
export const BUILT_IN_ASSISTANTS: AIAssistant[] = [
  {
    id: "general",
    name: "通用助手",
    description: "处理各种通用问答和任务",
    avatar: "🤖",
    model: "", // 使用用户配置的默认模型
    isBuiltIn: true,
    isActive: true,
    systemPrompt:
      "你是一个有用的AI助手，可以帮助用户完成各种任务。请用简洁、准确的方式回答问题。",
  },
  {
    id: "translator",
    name: "翻译专家",
    description: "专业的多语言翻译助手",
    avatar: "🌐",
    model: "", // 使用用户配置的默认模型
    isBuiltIn: true,
    isActive: true,
    systemPrompt:
      "你是一个专业的翻译助手。当用户提供文本时，请将其翻译成目标语言。如果用户没有指定目标语言，默认翻译成中文。请保持原文的语气和格式。",
  },
  {
    id: "writer",
    name: "写作助手",
    description: "帮助润色和改进文章",
    avatar: "✍️",
    model: "", // 使用用户配置的默认模型
    isBuiltIn: true,
    isActive: true,
    systemPrompt:
      "你是一个专业的写作助手。你可以帮助用户润色文章、改进表达、调整语气。请保持原文的核心意思，同时让表达更加流畅和准确。",
  },
  {
    id: "coder",
    name: "编程助手",
    description: "帮助编写和调试代码",
    avatar: "💻",
    model: "", // 使用用户配置的默认模型
    isBuiltIn: true,
    isActive: true,
    systemPrompt:
      "你是一个专业的编程助手。你可以帮助用户编写代码、调试程序、解释技术概念。请提供清晰、可运行的代码示例，并附带必要的注释。",
  },
  {
    id: "summarizer",
    name: "摘要助手",
    description: "快速总结文档内容",
    avatar: "📝",
    model: "", // 使用用户配置的默认模型
    isBuiltIn: true,
    isActive: true,
    systemPrompt:
      "你是一个专业的摘要助手。请将用户提供的长文本总结成简洁的要点，保留关键信息和核心观点。",
  },
];

interface AIStore {
  conversations: AIConversation[];
  currentConversation: AIConversation | null;
  isLoading: boolean;
  isStreaming: boolean;
  currentResponse: string;
  selectedText: string;
  currentAssistant: AIAssistant;
  customAssistants: AIAssistant[];

  // Actions
  loadConversations: (noteId?: string) => Promise<void>;
  createConversation: (noteId?: string) => Promise<AIConversation>;
  setCurrentConversation: (conversation: AIConversation | null) => void;
  setSelectedText: (text: string) => void;
  addMessage: (
    conversationId: string,
    message: Omit<AIMessage, "id" | "timestamp">,
  ) => Promise<void>;
  updateStreamingResponse: (text: string) => void;
  clearStreamingResponse: () => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  clearConversations: () => Promise<void>;
  sendMessage: (
    conversationId: string,
    content: string,
    signal?: AbortSignal,
  ) => Promise<void>;
  setCurrentAssistant: (assistant: AIAssistant) => void;
  loadAssistants: () => Promise<void>;
  createAssistant: (assistant: Omit<AIAssistant, "id">) => Promise<AIAssistant>;
  updateAssistant: (id: string, updates: Partial<AIAssistant>) => Promise<void>;
  deleteAssistant: (id: string) => Promise<void>;
  getAllAssistants: () => AIAssistant[];
  assistants: AIAssistant[];
}

export const useAIStore = create<AIStore>((set, get) => ({
  conversations: [],
  currentConversation: null,
  isLoading: false,
  isStreaming: false,
  currentResponse: "",
  selectedText: "",
  currentAssistant: BUILT_IN_ASSISTANTS[0], // 默认使用通用助手
  assistants: [],

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

  loadAssistants: async () => {
    try {
      // 先从后端 API 获取最新的助手配置
      const response = await aiApi.getAssistants();
      const remoteAssistants = response.data || [];

      // 同步到 IndexedDB
      for (const assistant of remoteAssistants) {
        const existing = await db.aiAssistants.get(assistant.id);
        if (!existing) {
          // 创建新助手到本地
          await db.aiAssistants.add({
            id: assistant.id,
            name: assistant.name,
            description: assistant.description || "",
            systemPrompt: assistant.systemPrompt,
            avatar: assistant.avatar,
            model: assistant.model,
            temperature: assistant.temperature,
            maxTokens: assistant.maxTokens,
            isActive: assistant.isActive ?? true,
            isBuiltIn: assistant.isBuiltIn ?? false,
            sortOrder: assistant.sortOrder,
            createdAt: assistant.createdAt
              ? new Date(assistant.createdAt).getTime()
              : Date.now(),
            updatedAt: assistant.updatedAt
              ? new Date(assistant.updatedAt).getTime()
              : Date.now(),
          });
        } else {
          // 更新现有助手（保留本地可能的修改）
          await db.aiAssistants.update(assistant.id, {
            name: assistant.name,
            description: assistant.description,
            systemPrompt: assistant.systemPrompt,
            avatar: assistant.avatar,
            model: assistant.model,
            isActive: assistant.isActive,
            updatedAt: Date.now(),
          });
        }
      }

      // 从 IndexedDB 加载助手
      const dbAssistants = await db.getAssistants();
      const assistants: AIAssistant[] = dbAssistants.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        systemPrompt: a.systemPrompt,
        avatar: a.avatar,
        model: a.model,
        temperature: a.temperature,
        maxTokens: a.maxTokens,
        isBuiltIn: a.isBuiltIn,
        isActive: a.isActive,
      }));
      set({ assistants });
    } catch (error) {
      console.error("Failed to load assistants:", error);
      // 如果 API 调用失败，回退到只从 IndexedDB 加载
      try {
        const dbAssistants = await db.getAssistants();
        const assistants: AIAssistant[] = dbAssistants.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          systemPrompt: a.systemPrompt,
          avatar: a.avatar,
          model: a.model,
          temperature: a.temperature,
          maxTokens: a.maxTokens,
          isBuiltIn: a.isBuiltIn,
          isActive: a.isActive,
        }));
        set({ assistants });
      } catch (dbError) {
        console.error("Failed to load from IndexedDB:", dbError);
      }
    }
  },

  createAssistant: async (assistant) => {
    try {
      // 优先调用后端 API 创建
      const response = await aiApi.createAssistant({
        name: assistant.name,
        description: assistant.description,
        systemPrompt: assistant.systemPrompt,
        avatar: assistant.avatar,
        model: assistant.model || "",
        temperature: assistant.temperature,
        maxTokens: assistant.maxTokens,
      });
      const newAssistant = response.data;

      // 同步到 IndexedDB
      await db.aiAssistants.add({
        id: newAssistant.id,
        name: newAssistant.name,
        description: newAssistant.description || "",
        systemPrompt: newAssistant.systemPrompt,
        avatar: newAssistant.avatar,
        model: newAssistant.model,
        temperature: newAssistant.temperature,
        maxTokens: newAssistant.maxTokens,
        isActive: newAssistant.isActive ?? true,
        isBuiltIn: false,
        sortOrder: newAssistant.sortOrder,
        createdAt: newAssistant.createdAt
          ? new Date(newAssistant.createdAt).getTime()
          : Date.now(),
        updatedAt: Date.now(),
      });

      // 更新状态
      set((state) => ({
        assistants: [...state.assistants, newAssistant],
      }));
      return newAssistant;
    } catch (error) {
      console.error("Failed to create assistant:", error);

      // 如果后端调用失败，只保存到本地 IndexedDB
      try {
        const localId = `custom_${Date.now()}`;
        const localAssistant = {
          ...assistant,
          id: localId,
          isBuiltIn: false,
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await db.aiAssistants.add(localAssistant);

        // 标记为待同步
        await db.aiAssistants.update(localId, { _pendingSync: true });

        set((state) => ({
          assistants: [...state.assistants, localAssistant],
        }));
        console.warn("Assistant saved locally (pending sync when online)");
        return localAssistant;
      } catch (dbError) {
        console.error("Failed to save to IndexedDB:", dbError);
        throw error;
      }
    }
  },

  updateAssistant: async (id, updates) => {
    try {
      // 内置助手不允许修改某些字段
      const existing = get().assistants.find((a) => a.id === id);
      if (existing?.isBuiltIn) {
        // 内置助手只更新本地
        await db.updateAssistant(id, updates);
        set((state) => ({
          assistants: state.assistants.map((a) =>
            a.id === id ? { ...a, ...updates } : a,
          ),
          currentAssistant:
            state.currentAssistant?.id === id
              ? { ...state.currentAssistant, ...updates }
              : state.currentAssistant,
        }));
        return;
      }

      // 自定义助手：优先调用后端 API 更新
      await aiApi.updateAssistant(id, updates);

      // 同步到 IndexedDB
      await db.updateAssistant(id, updates);

      // 更新状态
      set((state) => ({
        assistants: state.assistants.map((a) =>
          a.id === id ? { ...a, ...updates } : a,
        ),
        currentAssistant:
          state.currentAssistant?.id === id
            ? { ...state.currentAssistant, ...updates }
            : state.currentAssistant,
      }));
    } catch (error) {
      console.error("Failed to update assistant:", error);

      // 如果后端调用失败，只更新 IndexedDB 并标记待同步
      try {
        const existing = get().assistants.find((a) => a.id === id);
        if (existing && !existing.isBuiltIn) {
          await db.updateAssistant(id, { ...updates, _pendingSync: true });
          set((state) => ({
            assistants: state.assistants.map((a) =>
              a.id === id ? { ...a, ...updates } : a,
            ),
            currentAssistant:
              state.currentAssistant?.id === id
                ? { ...state.currentAssistant, ...updates }
                : state.currentAssistant,
          }));
          console.warn("Assistant updated locally (pending sync when online)");
        }
      } catch (dbError) {
        console.error("Failed to update IndexedDB:", dbError);
        throw error;
      }
    }
  },

  deleteAssistant: async (id) => {
    try {
      const existing = get().assistants.find((a) => a.id === id);
      if (existing?.isBuiltIn) {
        throw new Error("Cannot delete built-in assistant");
      }

      // 优先调用后端 API 删除
      await aiApi.deleteAssistant(id);

      // 从 IndexedDB 删除
      await db.aiAssistants.delete(id);

      // 更新状态
      set((state) => ({
        assistants: state.assistants.filter((a) => a.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete assistant:", error);

      // 如果后端调用失败，只从 IndexedDB 删除并标记
      try {
        const existing = await db.aiAssistants.get(id);
        if (existing && !existing.isBuiltIn) {
          await db.aiAssistants.delete(id);
          // 保留记录但标记为已删除
          await db.aiAssistants.add({
            ...existing,
            _deleted: true,
            _pendingSync: true,
          } as any);
        }
        set((state) => ({
          assistants: state.assistants.filter((a) => a.id !== id),
        }));
        console.warn("Assistant deleted locally (pending sync when online)");
      } catch (dbError) {
        console.error("Failed to delete from IndexedDB:", dbError);
        throw error;
      }
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
        currentConversation: conversation,
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

  clearConversations: async () => {
    try {
      await db.conversations.clear();
      set({
        conversations: [],
        currentConversation: null,
      });
    } catch (error) {
      console.error("Failed to clear conversations:", error);
      throw error;
    }
  },

  sendMessage: async (conversationId, content, signal) => {
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

    // 获取当前助手的系统提示词
    const currentAssistant = get().currentAssistant;

    // 获取更新后的对话（包含刚添加的用户消息）
    const updatedConversation = get().conversations.find(
      (c) => c.id === conversationId,
    )!;

    // 打印 token 使用情况（开发调试）
    const tokenUsage = getTokenUsage(
      updatedConversation,
      currentAssistant.systemPrompt,
    );
    console.log(
      `[上下文管理] Token 使用: ${tokenUsage.totalTokens} / ${tokenUsage.percentageOfMax.toFixed(1)}%`,
      `需要压缩: ${tokenUsage.needsCompression}`,
    );

    // 确定要使用的模型 ID
    let modelId: string | undefined;
    const { configs } = useModelStore.getState();

    console.log(
      `[模型选择] 当前可用模型配置数量: ${configs.length}`,
      configs.map((c) => ({
        id: c.id,
        name: c.name,
        enabled: c.enabled,
        isDefault: c.isDefault,
      })),
    );

    if (
      currentAssistant.model &&
      currentAssistant.model !== "default" &&
      currentAssistant.model !== ""
    ) {
      // 助手配置了具体模型，检查该模型是否存在
      const config = configs.find((c) => c.id === currentAssistant.model);
      if (config && config.enabled) {
        modelId = config.id;
        console.log(`[模型选择] 使用助手配置的模型: ${config.name}`);
      }
    }

    // 如果没有指定模型或指定模型不可用，使用默认模型
    if (!modelId) {
      const defaultModel = configs.find((c) => c.isDefault && c.enabled);
      if (defaultModel) {
        modelId = defaultModel.id;
        console.log(`[模型选择] 使用默认模型: ${defaultModel.name}`);
      } else {
        // 使用第一个启用的模型
        const firstEnabled = configs.find((c) => c.enabled);
        if (firstEnabled) {
          modelId = firstEnabled.id;
          console.log(`[模型选择] 使用第一个启用的模型: ${firstEnabled.name}`);
        }
      }
    }

    console.log(
      `[模型选择] 最终确定的 modelId: ${modelId || "undefined (将使用后端默认)"}`,
    );

    // 如果 modelId 是 "default"，改为 undefined，让后端使用默认模型
    // 因为前端的 "default" ID 只存在于 IndexedDB，后端数据库中没有对应记录
    const finalModelId = modelId === "default" ? undefined : modelId;

    if (finalModelId !== modelId) {
      console.log(
        `[模型选择] 将 modelId "default" 转换为 undefined，使用后端默认模型`,
      );
    }

    // 使用上下文管理服务构建消息（自动处理压缩）
    const messages = await buildMessagesForAI(
      updatedConversation,
      currentAssistant.systemPrompt,
      {},
      signal,
    );

    console.log(
      `[上下文管理] 发送消息数: ${messages.length - 1} (不含 system)`,
      `助手配置模型: ${currentAssistant.model}`,
      `实际使用模型: ${finalModelId || "使用后端默认模型"}`,
    );

    // 检查是否已取消
    if (signal?.aborted) {
      set({ isLoading: false, isStreaming: false });
      return;
    }

    // 调用后端AI API，使用流式响应
    let fullResponse = "";
    let streamError: string | null = null;
    let isAborted = false;

    try {
      await aiApi.chatStream(
        {
          messages,
          modelId: finalModelId,
        },
        (chunk: string) => {
          fullResponse += chunk;
          set({ currentResponse: fullResponse });
        },
        (error: string) => {
          streamError = error;
        },
        signal,
      );

      if (streamError) {
        throw new Error(streamError);
      }

      set({ isStreaming: false });

      await get().addMessage(conversationId, {
        role: "assistant",
        content: fullResponse,
      });

      set({ isLoading: false, currentResponse: "" });
    } catch (error: any) {
      if (error.name === "AbortError" || signal?.aborted) {
        isAborted = true;
      }

      if (isAborted) {
        if (fullResponse) {
          await get().addMessage(conversationId, {
            role: "assistant",
            content: fullResponse,
          });
        }
        set({ isLoading: false, isStreaming: false, currentResponse: "" });
      } else {
        console.error("Failed to send message:", error);
        set({ isLoading: false, isStreaming: false, currentResponse: "" });
        throw error;
      }
    }
  },

  setCurrentAssistant: (assistant) => {
    set({ currentAssistant: assistant });
    // 保存到 localStorage
    localStorage.setItem("selectedAssistant", assistant.id);
  },

  getAllAssistants: () => {
    const { assistants } = get();
    return assistants;
  },
}));

// 初始化：从数据库加载助手并恢复选择的助手
if (typeof window !== "undefined") {
  // 加载助手配置
  useAIStore.getState().loadAssistants();

  const savedAssistantId = localStorage.getItem("selectedAssistant");
  if (savedAssistantId) {
    // 从数据库中查找保存的助手
    setTimeout(async () => {
      const saved = await db.getAssistant(savedAssistantId);
      if (saved) {
        useAIStore.getState().setCurrentAssistant({
          id: saved.id,
          name: saved.name,
          description: saved.description,
          systemPrompt: saved.systemPrompt,
          avatar: saved.avatar,
          model: saved.model,
          temperature: saved.temperature,
          maxTokens: saved.maxTokens,
          isBuiltIn: saved.isBuiltIn,
          isActive: saved.isActive,
        });
      }
    }, 0);
  }
}

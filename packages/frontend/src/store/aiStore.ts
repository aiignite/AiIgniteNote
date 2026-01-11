import { create } from "zustand";
import { AIConversation, AIMessage, LocalAIAssistant } from "../types";
import { db } from "../db";
import { aiApi } from "../lib/api/ai";
import { buildMessagesForAI, getTokenUsage } from "../lib/api/contextManager";
import { useModelStore } from "./modelStore";
import { useAuthStore } from "./authStore";
import {
  SelectedContent,
  SelectionHelper,
  EMPTY_SELECTION,
} from "../types/selection";
import {
  MINDMAP_ASSISTANT_CONFIG,
  extractMindMapData,
  formatMindMapForAI,
  extractMindMapJSONFromResponse,
  validateMindMapJSON,
  type MindMapClipboardData,
} from "../prompts/mindmap-prompts";
import {
  DRAWIO_ASSISTANT_CONFIG,
  extractDrawIOXMLFromResponse,
  validateDrawIOXML,
  formatDrawIOForAI,
  type DrawIOClipboardData,
} from "../prompts/drawio-prompts";
import {
  isDrawIONote,
  buildDrawIOContext,
  extractDrawIONodes,
} from "../lib/api/drawioContextBuilder";
import {
  isMindMapNote,
  buildMindMapContext,
} from "../lib/api/mindmapContextBuilder";

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
  isPublic?: boolean;
  isActive?: boolean;
  userId?: string;
}

interface AIStore {
  conversations: AIConversation[];
  currentConversation: AIConversation | null;
  currentNoteId: string | null; // 当前正在编辑的笔记 ID
  isLoading: boolean;
  isStreaming: boolean;
  currentResponse: string;
  selectedText: string;
  selectedContent: SelectedContent;
  currentAssistant: AIAssistant;
  assistants: AIAssistant[];
  // 思维导图剪贴板
  mindmapClipboard: MindMapClipboardData | null;
  loadConversations: (noteId?: string) => Promise<void>;
  createConversation: (noteId?: string) => Promise<AIConversation>;
  setCurrentConversation: (conversation: AIConversation | null) => void;
  setSelectedText: (text: string) => void;
  setSelectedContent: (content: SelectedContent) => void;
  clearSelectedContent: () => void;
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
  setCurrentNoteId: (noteId: string | null) => void; // 设置当前编辑的笔记 ID
  loadAssistants: () => Promise<void>;
  createAssistant: (assistant: Omit<AIAssistant, "id">) => Promise<AIAssistant>;
  updateAssistant: (id: string, updates: Partial<AIAssistant>) => Promise<void>;
  deleteAssistant: (id: string) => Promise<void>;
  getAllAssistants: () => AIAssistant[];
  // 思维导图剪贴板操作
  setMindmapClipboard: (data: MindMapClipboardData) => void;
  clearMindmapClipboard: () => void;
  getMindmapClipboard: () => MindMapClipboardData | null;
  sendMindmapToAI: (
    fullData: any,
    selectedNodes?: any[],
    selectedPath?: number[],
  ) => Promise<void>;
  importMindmapFromClipboard: () => {
    success: boolean;
    data?: any;
    error?: string;
  };
  // DrawIO 剪贴板操作
  drawioClipboard: DrawIOClipboardData | null;
  setDrawioClipboard: (data: DrawIOClipboardData) => void;
  clearDrawioClipboard: () => void;
  getDrawioClipboard: () => DrawIOClipboardData | null;
  sendDrawioToAI: (fullXML: string, selectedElements?: any[]) => Promise<void>;
  importDrawioFromClipboard: () => {
    success: boolean;
    data?: string;
    error?: string;
  };
}

export const useAIStore = create<AIStore>((set, get) => ({
  conversations: [],
  currentConversation: null,
  currentNoteId: null, // 初始化为 null
  isLoading: false,
  isStreaming: false,
  currentResponse: "",
  selectedText: "",
  selectedContent: EMPTY_SELECTION,
  currentAssistant: {
    id: "",
    name: "",
    description: "",
    systemPrompt: "",
    model: "",
    isActive: true,
  }, // 初始为空，等待从数据库加载
  assistants: [],
  mindmapClipboard: null,
  drawioClipboard: null,

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
      // 从 PostgreSQL 获取所有助手（用户自己的 + 公有的）
      const response = await aiApi.getAssistants();
      const remoteAssistants = response.data || [];

      console.log(`[AIStore] 从服务器加载了 ${remoteAssistants.length} 个助手`);

      // 同步到 IndexedDB（作为本地缓存）
      for (const assistant of remoteAssistants) {
        const existing = await db.aiAssistants.get(assistant.id);

        if (!existing) {
          // 新助手，添加到 IndexedDB
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
            isPublic: assistant.isPublic ?? false,
            sortOrder: assistant.sortOrder,
            userId: assistant.userId,
            createdAt: assistant.createdAt
              ? new Date(assistant.createdAt).getTime()
              : Date.now(),
            updatedAt: assistant.updatedAt
              ? new Date(assistant.updatedAt).getTime()
              : Date.now(),
          });
        } else {
          // 已存在，更新数据（如果服务器数据更新）
          const remoteUpdatedAt = assistant.updatedAt
            ? new Date(assistant.updatedAt).getTime()
            : 0;

          if (remoteUpdatedAt > existing.updatedAt) {
            await db.aiAssistants.update(assistant.id, {
              name: assistant.name,
              description: assistant.description,
              systemPrompt: assistant.systemPrompt,
              avatar: assistant.avatar,
              model: assistant.model,
              isActive: assistant.isActive,
              isPublic: assistant.isPublic,
              updatedAt: remoteUpdatedAt,
            });
          }
        }
      }

      // 清理 IndexedDB 中服务器已删除的助手
      const allLocalAssistants = await db.aiAssistants.toArray();
      const remoteIds = new Set(remoteAssistants.map((a) => a.id));

      for (const localAssistant of allLocalAssistants) {
        if (!remoteIds.has(localAssistant.id) && !localAssistant._pendingSync) {
          // 本地有但服务器没有，且不是待同步的新数据，删除
          await db.aiAssistants.delete(localAssistant.id);
          console.log(`[AIStore] 清理已删除的助手: ${localAssistant.name}`);
        }
      }

      // 转换为前端格式
      const assistants: AIAssistant[] = remoteAssistants.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description || "",
        systemPrompt: a.systemPrompt,
        avatar: a.avatar,
        model: a.model,
        temperature: a.temperature,
        maxTokens: a.maxTokens,
        isPublic: a.isPublic,
        isActive: a.isActive ?? true,
        userId: a.userId,
      }));

      set({ assistants });
      console.log(`[AIStore] 已加载 ${assistants.length} 个助手`);
    } catch (error) {
      console.error("Failed to load assistants:", error);

      // API 调用失败，尝试从 IndexedDB 加载缓存
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
          isPublic: a.isPublic,
          isActive: a.isActive,
          userId: a.userId,
        }));
        set({ assistants });
        console.log(`[AIStore] 从缓存加载了 ${assistants.length} 个助手`);
      } catch (dbError) {
        console.error("Failed to load from IndexedDB:", dbError);
        // 完全失败，设置为空数组
        set({ assistants: [] });
      }
    }
  },

  createAssistant: async (assistant) => {
    // 离线优先：先保存到 IndexedDB
    const now = Date.now();
    const tempId = `assistant_${now}_${Math.random().toString(36).substring(2, 9)}`;

    const localAssistant: LocalAIAssistant = {
      id: tempId,
      name: assistant.name,
      description: assistant.description,
      systemPrompt: assistant.systemPrompt,
      avatar: assistant.avatar,
      model: assistant.model || "",
      temperature: assistant.temperature,
      maxTokens: assistant.maxTokens,
      isActive: assistant.isActive ?? true,
      isPublic: assistant.isPublic ?? false,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
      _pendingSync: true, // 标记为待同步
    };

    // 1. 先保存到 IndexedDB（立即响应用户）
    await db.aiAssistants.add(localAssistant);

    // 2. 更新状态
    set((state) => ({
      assistants: [...state.assistants, localAssistant],
    }));

    console.log(`[AIStore] 已创建助手（本地）: ${tempId}`);

    // 3. 后台尝试同步到 PostgreSQL
    try {
      const response = await aiApi.createAssistant({
        name: localAssistant.name,
        description: localAssistant.description,
        systemPrompt: localAssistant.systemPrompt,
        avatar: localAssistant.avatar,
        model: localAssistant.model,
        temperature: localAssistant.temperature,
        maxTokens: localAssistant.maxTokens,
        isActive: localAssistant.isActive,
        isPublic: localAssistant.isPublic,
      });

      const remoteAssistant = response.data;

      // 4. 同步成功，更新本地 ID 和清除标记
      const syncedAssistant: LocalAIAssistant = {
        ...localAssistant,
        id: remoteAssistant.id,
        userId: remoteAssistant.userId,
        sortOrder: remoteAssistant.sortOrder,
        createdAt: remoteAssistant.createdAt
          ? new Date(remoteAssistant.createdAt).getTime()
          : localAssistant.createdAt,
        updatedAt: remoteAssistant.updatedAt
          ? new Date(remoteAssistant.updatedAt).getTime()
          : Date.now(),
        _pendingSync: undefined, // 清除待同步标记
      };

      await db.aiAssistants.put(syncedAssistant);

      // 5. 更新状态（使用服务器 ID）
      set((state) => ({
        assistants: state.assistants.map((a) =>
          a.id === tempId ? syncedAssistant : a,
        ),
      }));

      console.log(
        `[AIStore] 已同步到服务器: ${tempId} -> ${syncedAssistant.id}`,
      );

      return syncedAssistant;
    } catch (error) {
      console.error(`[AIStore] 同步失败，保留待同步标记: ${tempId}`, error);
      // 同步失败，保留 _pendingSync 标记，下次再试
      return localAssistant;
    }
  },

  updateAssistant: async (id, updates) => {
    const existing = get().assistants.find((a) => a.id === id);
    if (!existing) {
      throw new Error("Assistant not found");
    }

    // 离线优先：所有助手统一处理
    const now = Date.now();

    // 1. 先更新 IndexedDB（立即响应用户）
    await db.aiAssistants.update(id, {
      ...updates,
      updatedAt: now,
      _pendingSync: true, // 标记为待同步
    });

    // 2. 更新状态
    set((state) => ({
      assistants: state.assistants.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: now } : a,
      ),
      currentAssistant:
        state.currentAssistant?.id === id
          ? { ...state.currentAssistant, ...updates, updatedAt: now }
          : state.currentAssistant,
    }));

    console.log(`[AIStore] 已更新助手（本地）: ${id}`);

    // 3. 后台尝试同步到 PostgreSQL（仅限自己创建的助手）
    // 只有当助手是自己创建的（userId 匹配或没有 userId 表示本地创建）时才同步
    const { user } = useAuthStore.getState();
    const isOwnAssistant = !existing.userId || existing.userId === user?.id;

    if (isOwnAssistant) {
      try {
        await aiApi.updateAssistant(id, updates);

        // 4. 同步成功，清除标记
        await db.aiAssistants.update(id, {
          _pendingSync: undefined,
        });

        console.log(`[AIStore] 已同步更新到服务器: ${id}`);
      } catch (error) {
        console.error(`[AIStore] 更新同步失败，保留待同步标记: ${id}`, error);
        // 同步失败，保留 _pendingSync 标记，下次再试
      }
    } else {
      console.log(`[AIStore] 跳过同步其他用户的公共助手: ${id}`);
    }
  },

  deleteAssistant: async (id) => {
    const existing = get().assistants.find((a) => a.id === id);
    if (!existing) {
      throw new Error("Assistant not found");
    }

    // 离线优先：先从 IndexedDB 删除
    await db.aiAssistants.delete(id);

    // 更新状态（立即从 UI 移除）
    set((state) => ({
      assistants: state.assistants.filter((a) => a.id !== id),
    }));

    console.log(`[AIStore] 已删除助手（本地）: ${id}`);

    // 后台尝试同步到 PostgreSQL
    try {
      await aiApi.deleteAssistant(id);
      console.log(`[AIStore] 已同步删除到服务器: ${id}`);
    } catch (error) {
      console.error(`[AIStore] 删除同步失败: ${id}`, error);
      // 删除失败，用户界面已经移除了，但服务器可能还存在
      // 下次加载会重新出现，用户可以再次删除
    }
  },

  createConversation: async (noteId) => {
    try {
      // 获取当前用户和当前助手
      const { user } = useAuthStore.getState();
      const { currentAssistant } = get();

      const conversation = await db.createConversation({
        noteId,
        userId: user?.id,
        assistantId: currentAssistant?.id,
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

  setSelectedContent: (content) => {
    // 验证选择内容
    if (SelectionHelper.isValidSelection(content)) {
      set({ selectedContent: content });
      // 同时更新 selectedText 以保持兼容性
      set({ selectedText: content.text });
    } else {
      console.warn("[AIStore] 无效的选择内容，已忽略");
    }
  },

  clearSelectedContent: () => {
    set({
      selectedContent: EMPTY_SELECTION,
      selectedText: "",
    });
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

    // 获取对话历史(添加用户消息之前)
    const conversation = get().conversations.find(
      (c) => c.id === conversationId,
    );
    if (!conversation) {
      throw new Error("对话不存在");
    }

    // 🔥 优先级：currentNoteId > URL > conversation.noteId
    const { currentNoteId } = get();

    // 从 URL 获取 noteId
    const currentPath = window.location.pathname;
    const noteIdFromUrl = currentPath.startsWith("/notes/")
      ? currentPath.split("/")[2]
      : undefined;

    // 使用第一个可用的 noteId
    const effectiveNoteId =
      currentNoteId || noteIdFromUrl || conversation.noteId;

    console.log("[AIStore] 📍 当前路径:", currentPath);
    console.log("[AIStore] 📍 Store中的 currentNoteId:", currentNoteId);
    console.log("[AIStore] 📍 从 URL 提取的 noteId:", noteIdFromUrl);
    console.log("[AIStore] 📍 对话关联的 noteId:", conversation.noteId);
    console.log("[AIStore] ✅ 最终使用的 noteId:", effectiveNoteId);

    if (!effectiveNoteId) {
      console.warn("[AIStore] ⚠️ 无法获取 noteId，将不注入文件内容");
    }

    // 检查是否是思维导图笔记
    const isMindMap =
      effectiveNoteId &&
      (await db.notes
        .get(effectiveNoteId)
        .then((note) => {
          console.log("[AIStore] 📝 检测笔记类型:", note?.fileType);
          return note?.fileType === "mindmap";
        })
        .catch(() => false));

    // 检查是否是 DrawIO 笔记
    const isDrawIO =
      effectiveNoteId &&
      (await db.notes
        .get(effectiveNoteId)
        .then((note) => note?.fileType === "drawio")
        .catch(() => false));

    console.log(
      "[AIStore] 🔍 检测结果 - isMindMap:",
      isMindMap,
      "isDrawIO:",
      isDrawIO,
    );

    // 获取当前助手的系统提示词
    const currentAssistant = get().currentAssistant;

    // 使用上下文管理服务构建消息
    // 对于思维导图或 DrawIO 笔记，传入当前用户消息以注入图表上下文
    // 🔥 传入 effectiveNoteId 以确保文件内容被正确注入
    const messages = await buildMessagesForAI(
      conversation,
      currentAssistant.systemPrompt,
      {
        currentUserMessage: content,
        noteId: effectiveNoteId, // 🔥 传递笔记 ID
      },
      signal,
    );

    // 检查是否是思维导图模式（通过检测系统消息中是否包含思维导图数据）
    const isMindMapMode = messages.some(
      (m) => m.role === "system" && m.content.includes("当前思维导图数据"),
    );

    // 添加用户消息到对话历史
    // 注意：buildMessagesForAI 返回的 messages 已经包含了正确的消息列表
    // 这里只是将用户消息保存到对话历史中
    await get().addMessage(conversationId, {
      role: "user",
      content,
    });

    // 如果是非思维导图模式，需要手动将用户消息添加到发送列表中
    if (!isMindMapMode) {
      messages.push({ role: "user", content });
    }

    // 打印 token 使用情况（开发调试）
    // 获取最新的对话(包含刚添加的用户消息)
    const updatedConversation = get().conversations.find(
      (c) => c.id === conversationId,
    )!;

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
      } else {
        // 助手配置的模型不可用（可能是公开助手使用了创建者的私有模型）
        console.log(
          `[模型选择] ⚠️ 助手配置的模型 ${currentAssistant.model} 不可用或不存在`,
        );
        if (config && !config.enabled) {
          console.log(`[模型选择] 原因: 模型 ${config.name} 已被禁用`);
        } else if (!config) {
          console.log(
            `[模型选择] 原因: 模型配置不存在（可能是公开助手使用了其他用户的私有模型）`,
          );
        }
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

  setCurrentNoteId: (noteId) => {
    console.log("[AIStore] 🔧 设置当前笔记 ID:", noteId);
    set({ currentNoteId: noteId });
  },

  getAllAssistants: () => {
    const { assistants } = get();
    return assistants;
  },

  // 思维导图剪贴板操作
  setMindmapClipboard: (data) => {
    set({ mindmapClipboard: data });
    console.log("[AIStore] 思维导图数据已保存到剪贴板");
  },

  clearMindmapClipboard: () => {
    set({ mindmapClipboard: null });
    console.log("[AIStore] 思维导图剪贴板已清空");
  },

  getMindmapClipboard: () => {
    return get().mindmapClipboard;
  },

  sendMindmapToAI: async (fullData, selectedNodes, selectedPath) => {
    // 构建剪贴板数据
    const clipboardData = extractMindMapData(
      fullData,
      selectedNodes,
      selectedPath,
    );
    set({ mindmapClipboard: clipboardData });

    // 格式化为AI可理解的文本
    const formattedText = formatMindMapForAI(clipboardData);

    // 设置为选中的内容
    const selectedContent: SelectedContent = {
      type: "mindmap_nodes",
      source: "mindmap",
      text: formattedText,
      raw: clipboardData,
      metadata: {
        count: selectedNodes?.length || 0,
        maxLevel: selectedPath?.length || 0,
        hasStructure: true,
        timestamp: Date.now(),
      },
    };

    get().setSelectedContent(selectedContent);
    console.log(
      `[AIStore] 已发送思维导图数据到AI助手 (${selectedNodes?.length || 0} 个节点)`,
    );
  },

  // ============================================
  // DrawIO 剪贴板操作
  // ============================================
  setDrawioClipboard: (data: DrawIOClipboardData) => {
    set({ drawioClipboard: data });
    console.log("[AIStore] DrawIO 剪贴板已更新");
  },

  clearDrawioClipboard: () => {
    set({ drawioClipboard: null });
    console.log("[AIStore] DrawIO 剪贴板已清空");
  },

  getDrawioClipboard: () => {
    return get().drawioClipboard;
  },

  sendDrawioToAI: async (fullXML: string, selectedElements?: any[]) => {
    // 准备剪贴板数据
    const clipboardData: DrawIOClipboardData = {
      fullData: fullXML as any, // XML string will be parsed to DrawIOGraphModel
      selectedData: selectedElements || [],
    };

    // 保存到剪贴板
    get().setDrawioClipboard(clipboardData);

    // 格式化为用户提示
    const userPrompt = formatDrawIOForAI(clipboardData);

    // 设置选中的内容
    const selectedContent: SelectedContent = {
      type: "drawio_elements",
      source: "drawio",
      text: userPrompt,
      raw: clipboardData,
      metadata: {
        count: selectedElements?.length || 0,
        hasStructure: true,
        timestamp: Date.now(),
      },
    };

    get().setSelectedContent(selectedContent);
    console.log(
      `[AIStore] 已发送DrawIO数据到AI助手 (${selectedElements?.length || 0} 个元素)`,
    );
  },

  importDrawioFromClipboard: () => {
    const { currentResponse, currentConversation } = get();

    console.log("[AIStore] importDrawioFromClipboard 被调用");
    console.log(
      "[AIStore] currentResponse 长度:",
      currentResponse?.length || 0,
    );
    console.log("[AIStore] currentConversation 存在:", !!currentConversation);

    // 优先使用 currentResponse(流式响应中的)
    let responseText = currentResponse;

    // 如果 currentResponse 为空,尝试从对话历史中获取最后一条AI消息
    if (!responseText && currentConversation) {
      const messages = currentConversation.messages;
      if (messages && messages.length > 0) {
        // 从后往前找最后一条assistant消息
        for (let i = messages.length - 1; i >= 0; i--) {
          const msg = messages[i];
          if (msg.role === "assistant") {
            responseText = msg.content;
            console.log("[AIStore] 从对话历史获取AI响应, 消息索引:", i);
            break;
          }
        }
      }
    }

    if (!responseText) {
      console.error("[AIStore] 未找到AI响应内容");
      return {
        success: false,
        error: "AI助手没有生成任何内容,请先与AI对话生成DrawIO图表",
      };
    }

    console.log("[AIStore] 准备提取XML, 响应长度:", responseText.length);

    // 从AI响应中提取XML
    const result = extractDrawIOXMLFromResponse(responseText);

    if (result.success && result.data) {
      console.log("[AIStore] 成功从AI响应中提取DrawIO XML");
      return {
        success: true,
        data: result.data,
      };
    } else {
      console.error("[AIStore] 提取DrawIO XML失败:", result.error);
      return {
        success: false,
        error: result.error || '无法提取有效的DrawIO数据,请使用"粘贴导入"功能',
      };
    }
  },

  importMindmapFromClipboard: () => {
    const { currentResponse, currentConversation } = get();

    console.log("[AIStore] importMindmapFromClipboard 被调用");
    console.log(
      "[AIStore] currentResponse 长度:",
      currentResponse?.length || 0,
    );
    console.log("[AIStore] currentConversation 存在:", !!currentConversation);

    // 优先使用 currentResponse(流式响应中的)
    let responseText = currentResponse;

    // 如果 currentResponse 为空,尝试从对话历史中获取最后一条AI消息
    if (!responseText && currentConversation) {
      const messages = currentConversation.messages;
      if (messages && messages.length > 0) {
        // 从后往前找最后一条assistant消息
        for (let i = messages.length - 1; i >= 0; i--) {
          const msg = messages[i];
          if (msg.role === "assistant") {
            responseText = msg.content;
            console.log("[AIStore] 从对话历史获取AI响应, 消息索引:", i);
            break;
          }
        }
      }
    }

    if (!responseText) {
      console.error("[AIStore] 未找到AI响应内容");
      return {
        success: false,
        error: "AI助手没有生成任何内容,请先与AI对话生成思维导图",
      };
    }

    console.log("[AIStore] 准备提取JSON, 响应长度:", responseText.length);

    // 从AI响应中提取JSON
    const result = extractMindMapJSONFromResponse(responseText);

    if (result.success && result.data) {
      console.log("[AIStore] 成功从AI响应中提取思维导图JSON");
      return {
        success: true,
        data: result.data,
      };
    } else {
      console.error("[AIStore] 提取思维导图JSON失败:", result.error);
      return {
        success: false,
        error:
          result.error || '无法提取有效的思维导图数据,请使用"粘贴导入"功能',
      };
    }
  },
}));

// 初始化：从数据库加载助手并恢复选择的助手
// 注意：不再在模块加载时自动加载，而是在用户登录后通过 MainLayout 加载
if (typeof window !== "undefined") {
  const savedAssistantId = localStorage.getItem("selectedAssistant");
  if (savedAssistantId) {
    // 从数据库中查找保存的助手（从 IndexedDB 缓存）
    setTimeout(async () => {
      try {
        const saved = await db.aiAssistants.get(savedAssistantId);
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
            isPublic: saved.isPublic,
            isActive: saved.isActive,
          });
          console.log("[AIStore] 从缓存恢复选择的助手:", saved.name);
        }
      } catch (error) {
        console.warn("[AIStore] 从缓存恢复助手失败:", error);
      }
    }, 0);
  }
}

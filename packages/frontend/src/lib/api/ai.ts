import { apiClient } from "./client";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  modelId?: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

// AI 助手相关类型
export interface AIAssistant {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  avatar?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  isActive?: boolean;
  sortOrder?: number;
  isPublic?: boolean;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const aiApi = {
  // ========== 聊天相关 ==========

  // 获取默认模型配置
  getDefaultModel: () => apiClient.get("/ai/models/default"),

  // 发送聊天消息（非流式）
  chat: (data: ChatRequest) => apiClient.post("/ai/chat", data),

  // 发送聊天消息（流式）
  chatStream: async (
    data: ChatRequest,
    onChunk: (chunk: string) => void,
    onError?: (error: string) => void,
    signal?: AbortSignal,
  ) => {
    const token = localStorage.getItem("accessToken");

    // 使用与 apiClient 相同的 URL 逻辑
    function getApiBaseUrl(): string {
      const envUrl = import.meta.env.VITE_API_BASE_URL;

      // 如果环境变量设置为 'auto' 或未设置,则自动检测
      if (!envUrl || envUrl === 'auto') {
        // 获取当前页面的 host 和 port
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;

        // 如果是 localhost 或 127.0.0.1,使用默认的 3001 端口
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'http://localhost:3001';
        }

        // 否则使用当前页面的 hostname,但端口改为 3001
        return `${protocol}//${hostname}:3001`;
      }

      // 否则使用环境变量中配置的地址
      return envUrl;
    }

    const API_BASE_URL = getApiBaseUrl();

    // 调试日志
    console.log('[AI API] Stream URL:', `${API_BASE_URL}/api/v1/ai/chat/stream`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ai/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        // 检查是否已取消
        if (signal?.aborted) {
          reader.cancel();
          throw new DOMException("Aborted", "AbortError");
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                onError?.(parsed.error);
                return;
              }
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch (e) {
              console.warn("Failed to parse SSE data:", data);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw error;
      }
      onError?.(error.message);
      throw error;
    }
  },

  // ========== AI 助手相关 ==========

  // 获取所有 AI 助手
  getAssistants: () => apiClient.get("/ai/assistants"),

  // 创建自定义助手
  createAssistant: (data: {
    name: string;
    description?: string;
    systemPrompt: string;
    avatar?: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    isActive?: boolean;
    isPublic?: boolean;
  }) => apiClient.post("/ai/assistants", data),

  // 更新助手
  updateAssistant: (
    id: string,
    data: {
      name?: string;
      description?: string;
      systemPrompt?: string;
      avatar?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      isActive?: boolean;
      isPublic?: boolean;
    },
  ) => apiClient.put(`/ai/assistants/${id}`, data),

  // 删除助手
  deleteAssistant: (id: string) => apiClient.delete(`/ai/assistants/${id}`),
};

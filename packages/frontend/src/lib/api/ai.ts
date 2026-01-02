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

export const aiApi = {
  // 获取默认模型配置
  getDefaultModel: () => apiClient.get("/ai/models/default"),

  // 发送聊天消息（非流式）
  chat: (data: ChatRequest) => apiClient.post<ChatResponse>("/ai/chat", data),

  // 发送聊天消息（流式）
  chatStream: async (
    data: ChatRequest,
    onChunk: (chunk: string) => void,
    onError?: (error: string) => void,
    signal?: AbortSignal,
  ) => {
    const token = localStorage.getItem("accessToken");
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

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
};

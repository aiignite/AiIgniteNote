import { prisma } from "../utils/prisma.js";
import { decrypt } from "../utils/encryption.js";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  modelId?: string;
}

interface ChatResponse {
  content: string;
  model: string;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

type APIType = "openai" | "anthropic" | "ollama" | "lmstudio";

export class AIService {
  /**
   * 获取用户的默认模型配置
   */
  async getDefaultModel(userId: string) {
    const model = await prisma.modelConfig.findFirst({
      where: {
        userId,
        isDefault: true,
        enabled: true,
      },
    });

    console.log(
      "[AIService] getDefaultModel for user",
      userId,
      ":",
      model
        ? {
            id: model.id,
            name: model.name,
            apiType: model.apiType,
            model: model.model,
          }
        : "No default model found",
    );

    if (!model) {
      const firstEnabled = await prisma.modelConfig.findFirst({
        where: {
          userId,
          enabled: true,
        },
        orderBy: { createdAt: "asc" },
      });
      console.log(
        "[AIService] First enabled model:",
        firstEnabled
          ? {
              id: firstEnabled.id,
              name: firstEnabled.name,
              apiType: firstEnabled.apiType,
              model: firstEnabled.model,
            }
          : "No enabled models",
      );
      return firstEnabled;
    }

    return model;
  }

  /**
   * 获取模型配置（通过ID）
   * 可以获取用户自己的模型，或者公开的模型
   */
  async getModelById(modelId: string, userId: string) {
    return await prisma.modelConfig.findFirst({
      where: {
        id: modelId,
        OR: [
          { userId }, // 用户自己的模型
          { isPublic: true }, // 公开的模型
        ],
      },
    });
  }

  /**
   * 转换消息为Anthropic格式
   */
  private convertToAnthropicMessages(messages: ChatMessage[]): Array<{
    role: "user" | "assistant";
    content: string;
  }> {
    const result: Array<{ role: "user" | "assistant"; content: string }> = [];

    for (const msg of messages) {
      if (msg.role === "system") continue;
      if (msg.content) {
        result.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    return result;
  }

  /**
   * 发送聊天请求到AI
   */
  async chat(userId: string, request: ChatRequest): Promise<ChatResponse> {
    let modelConfig;

    if (request.modelId) {
      modelConfig = await this.getModelById(request.modelId, userId);
    } else {
      modelConfig = await this.getDefaultModel(userId);
    }

    if (!modelConfig) {
      throw new Error(
        "No available model configuration found. Please configure a model in Settings > AI Management > Models.",
      );
    }

    if (!modelConfig.enabled) {
      throw new Error("The selected model is not enabled.");
    }

    const apiType: APIType = (modelConfig.apiType as APIType) || "openai";

    // 解密API Key（Ollama和LM Studio本地部署不需要）
    let decryptedApiKey = "";
    if (apiType !== "ollama" && apiType !== "lmstudio") {
      try {
        decryptedApiKey = decrypt(modelConfig.apiKey);
      } catch (error) {
        throw new Error(
          "Failed to decrypt API key. Please reconfigure your model settings.",
        );
      }
    }

    try {
      switch (apiType) {
        case "anthropic":
          return await this.chatAnthropic(
            modelConfig,
            decryptedApiKey,
            request.messages,
          );
        case "ollama":
          return await this.chatOllama(modelConfig, request.messages);
        case "lmstudio":
          return await this.chatLMStudio(modelConfig, request.messages);
        case "openai":
        default:
          return await this.chatOpenAI(
            modelConfig,
            decryptedApiKey,
            request.messages,
          );
      }
    } catch (error: any) {
      // 记录错误日志
      try {
        await prisma.modelUsageLog.create({
          data: {
            modelId: modelConfig.id,
            action: "chat",
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            success: false,
            errorMessage: error.message,
            metadata: JSON.stringify({
              model: modelConfig.model,
              apiType,
              error: error.message,
            }),
          },
        });
      } catch (logError) {
        console.error("Failed to log error:", logError);
      }
      throw error;
    }
  }

  /**
   * OpenAI格式聊天
   */
  private async chatOpenAI(
    modelConfig: any,
    apiKey: string,
    messages: ChatMessage[],
  ): Promise<ChatResponse> {
    const response = await fetch(modelConfig.apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelConfig.model,
        messages: messages,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens,
        top_p: modelConfig.topP,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data: any = await response.json();
    const promptTokens = data.usage?.prompt_tokens || 0;
    const completionTokens = data.usage?.completion_tokens || 0;
    const totalTokens =
      data.usage?.total_tokens || promptTokens + completionTokens;

    // 记录使用日志
    await prisma.modelUsageLog.create({
      data: {
        modelId: modelConfig.id,
        action: "chat",
        inputTokens: promptTokens,
        outputTokens: completionTokens,
        totalTokens,
        success: true,
        metadata: JSON.stringify({
          model: modelConfig.model,
          apiType: "openai",
        }),
      },
    });

    return {
      content: data.choices[0].message.content,
      model: modelConfig.model,
      tokensUsed: {
        prompt: promptTokens,
        completion: completionTokens,
        total: totalTokens,
      },
    };
  }

  /**
   * Anthropic格式聊天
   */
  private async chatAnthropic(
    modelConfig: any,
    apiKey: string,
    messages: ChatMessage[],
  ): Promise<ChatResponse> {
    const anthropicMessages = this.convertToAnthropicMessages(messages);
    const systemMessage = messages.find((m) => m.role === "system")?.content;

    const response = await fetch(modelConfig.apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelConfig.model,
        messages: anthropicMessages,
        system: systemMessage || undefined,
        max_tokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature,
        top_p: modelConfig.topP,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data: any = await response.json();

    // 记录使用日志
    await prisma.modelUsageLog.create({
      data: {
        modelId: modelConfig.id,
        action: "chat",
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
        totalTokens:
          (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        success: true,
        metadata: JSON.stringify({
          model: modelConfig.model,
          apiType: "anthropic",
        }),
      },
    });

    return {
      content: data.content[0].text,
      model: modelConfig.model,
      tokensUsed: {
        prompt: data.usage?.input_tokens || 0,
        completion: data.usage?.output_tokens || 0,
        total:
          (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
    };
  }

  /**
   * Ollama格式聊天
   */
  private async chatOllama(
    modelConfig: any,
    messages: ChatMessage[],
  ): Promise<ChatResponse> {
    const response = await fetch(modelConfig.apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelConfig.model,
        messages: messages,
        stream: false,
        options: {
          temperature: modelConfig.temperature,
          num_predict: modelConfig.maxTokens,
          top_p: modelConfig.topP,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const data: any = await response.json();
    const promptTokens = data.prompt_eval_count || 0;
    const evalCount = data.eval_count || 0;

    // 记录使用日志
    await prisma.modelUsageLog.create({
      data: {
        modelId: modelConfig.id,
        action: "chat",
        inputTokens: promptTokens,
        outputTokens: evalCount,
        totalTokens: promptTokens + evalCount,
        success: true,
        metadata: JSON.stringify({
          model: modelConfig.model,
          apiType: "ollama",
        }),
      },
    });

    return {
      content: data.message?.content || data.response || "",
      model: modelConfig.model,
      tokensUsed: {
        prompt: promptTokens,
        completion: evalCount,
        total: promptTokens + evalCount,
      },
    };
  }

  /**
   * LM Studio格式聊天（兼容OpenAI）
   */
  private async chatLMStudio(
    modelConfig: any,
    messages: ChatMessage[],
  ): Promise<ChatResponse> {
    // LM Studio兼容OpenAI格式
    return await this.chatOpenAI(modelConfig, "", messages);
  }

  /**
   * 流式聊天请求
   */
  async *chatStream(
    userId: string,
    request: ChatRequest,
  ): AsyncGenerator<string, void, unknown> {
    let modelConfig;

    if (request.modelId) {
      modelConfig = await this.getModelById(request.modelId, userId);
    } else {
      modelConfig = await this.getDefaultModel(userId);
    }

    console.log("[AIService] chatStream - Raw modelConfig from DB:", {
      id: modelConfig?.id,
      name: modelConfig?.name,
      apiType: modelConfig?.apiType,
      apiEndpoint: modelConfig?.apiEndpoint,
      model: modelConfig?.model,
    });

    if (!modelConfig) {
      throw new Error(
        "No available model configuration found. Please configure a model in Settings > AI Management > Models.",
      );
    }

    if (!modelConfig.enabled) {
      throw new Error("The selected model is not enabled.");
    }

    const apiType: APIType = (modelConfig.apiType as APIType) || "openai";

    console.log(
      "[AIService] chatStream - API Type:",
      apiType,
      "Model:",
      modelConfig.model,
    );

    // 解密API Key
    let decryptedApiKey = "";
    if (apiType !== "ollama" && apiType !== "lmstudio") {
      try {
        decryptedApiKey = decrypt(modelConfig.apiKey);
      } catch (error) {
        throw new Error("Failed to decrypt API key.");
      }
    }

    try {
      switch (apiType) {
        case "anthropic":
          yield* this.chatStreamAnthropic(
            modelConfig,
            decryptedApiKey,
            request.messages,
          );
          break;
        case "ollama":
          yield* this.chatStreamOllama(modelConfig, request.messages);
          break;
        case "lmstudio":
          yield* this.chatStreamLMStudio(modelConfig, request.messages);
          break;
        case "openai":
        default:
          yield* this.chatStreamOpenAI(
            modelConfig,
            decryptedApiKey,
            request.messages,
          );
          break;
      }
    } catch (error: any) {
      console.error("[AIService] chatStream error:", error.message);

      // 记录错误日志
      try {
        await prisma.modelUsageLog.create({
          data: {
            modelId: modelConfig.id,
            action: "chat",
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            success: false,
            errorMessage: error.message,
            metadata: JSON.stringify({
              model: modelConfig.model,
              apiType,
              error: error.message,
            }),
          },
        });
      } catch (logError) {
        console.error("Failed to log error:", logError);
      }
      throw error;
    }
  }

  /**
   * OpenAI格式流式聊天
   */
  private async *chatStreamOpenAI(
    modelConfig: any,
    apiKey: string,
    messages: ChatMessage[],
  ): AsyncGenerator<string> {
    const response = await fetch(modelConfig.apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelConfig.model,
        messages: messages,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens,
        top_p: modelConfig.topP,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Response body is not readable");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
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
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  }

  /**
   * Anthropic格式流式聊天
   */
  private async *chatStreamAnthropic(
    modelConfig: any,
    apiKey: string,
    messages: ChatMessage[],
  ): AsyncGenerator<string> {
    const anthropicMessages = this.convertToAnthropicMessages(messages);
    const systemMessage = messages.find((m) => m.role === "system")?.content;

    console.log(
      "[AIService] Anthropic request body:",
      JSON.stringify(
        {
          model: modelConfig.model,
          messages: anthropicMessages,
          system: systemMessage || undefined,
          max_tokens: modelConfig.maxTokens,
          temperature: modelConfig.temperature,
          top_p: modelConfig.topP,
          stream: true,
        },
        null,
        2,
      ),
    );

    console.log("[AIService] API Endpoint:", modelConfig.apiEndpoint);
    console.log(
      "[AIService] API Key (first 20 chars):",
      apiKey.substring(0, 20) + "...",
    );

    const response = await fetch(modelConfig.apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelConfig.model,
        messages: anthropicMessages,
        system: systemMessage || undefined,
        max_tokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature,
        top_p: modelConfig.topP,
        stream: true,
      }),
    });

    console.log("[AIService] Anthropic response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AIService] Anthropic error response:", errorText);
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Response body is not readable");

    const decoder = new TextDecoder();
    let buffer = "";
    let currentEvent = "";
    let chunkCount = 0;
    let allRawData = "";

    console.log("[AIService] Starting to read Anthropic stream...");

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log(
          "[AIService] Anthropic stream ended, total chunks:",
          chunkCount,
        );
        console.log(
          "[AIService] Raw data preview:",
          allRawData.substring(0, 500),
        );
        break;
      }

      const decoded = decoder.decode(value, { stream: true });
      allRawData += decoded;
      buffer += decoded;
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        console.log(
          "[AIService] Anthropic SSE line:",
          trimmedLine.substring(0, 200),
        );

        // 解析 event: 行
        if (trimmedLine.startsWith("event: ")) {
          currentEvent = trimmedLine.slice(7);
          console.log("[AIService] Anthropic event:", currentEvent);
          continue;
        }

        // 解析 data: 行
        if (trimmedLine.startsWith("data: ")) {
          const data = trimmedLine.slice(6);

          try {
            const parsed = JSON.parse(data);
            console.log(
              "[AIService] Anthropic parsed data:",
              JSON.stringify(parsed).substring(0, 200),
            );

            if (
              parsed.type === "content_block_delta" &&
              parsed.delta?.type === "text_delta"
            ) {
              const text = parsed.delta.text;
              if (text) {
                chunkCount++;
                console.log(
                  "[AIService] Anthropic yielding chunk",
                  chunkCount,
                  ":",
                  text.substring(0, 20),
                );
                yield text;
              }
            } else if (parsed.type === "error") {
              console.error("[AIService] Anthropic API error:", parsed);
              throw new Error(parsed.error?.message || "Unknown API error");
            }
          } catch (e) {
            // JSON 解析失败，记录日志
            console.warn(
              "[AIService] Failed to parse Anthropic SSE:",
              trimmedLine.substring(0, 100),
              "Error:",
              e,
            );
          }
        }
      }
    }
  }

  /**
   * Ollama格式流式聊天
   */
  private async *chatStreamOllama(
    modelConfig: any,
    messages: ChatMessage[],
  ): AsyncGenerator<string> {
    const response = await fetch(modelConfig.apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelConfig.model,
        messages: messages,
        stream: true,
        options: {
          temperature: modelConfig.temperature,
          num_predict: modelConfig.maxTokens,
          top_p: modelConfig.topP,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Response body is not readable");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Ollama每行一个JSON对象
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const data = JSON.parse(line);
          if (data.done) {
            // 流结束
            if (data.prompt_eval_count) {
              console.log(
                "[AIService] Ollama total tokens:",
                data.prompt_eval_count + (data.eval_count || 0),
              );
            }
            break;
          }

          const content = data.message?.content || data.response;
          if (content) {
            yield content;
          }
        } catch (e) {
          console.warn(
            "[AIService] Failed to parse Ollama SSE:",
            line.substring(0, 100),
          );
        }
      }
    }
  }

  /**
   * LM Studio格式流式聊天（兼容OpenAI）
   */
  private async *chatStreamLMStudio(
    modelConfig: any,
    messages: ChatMessage[],
  ): AsyncGenerator<string> {
    // LM Studio兼容OpenAI格式
    yield* this.chatStreamOpenAI(modelConfig, "", messages);
  }
}

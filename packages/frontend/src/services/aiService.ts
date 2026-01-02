import { ModelConfig } from "../types";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class AIService {
  private config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  async chat(
    messages: ChatMessage[],
    onStream?: (chunk: string) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    try {
      // 检测 API 类型 - Anthropic API 或 OpenAI 格式
      // GLM 的 /api/anthropic 和 /api/coding/paas 都使用 Anthropic 格式
      const isAnthropic =
        this.config.apiEndpoint.includes("/anthropic") ||
        this.config.apiEndpoint.includes("/coding");

      if (isAnthropic) {
        return await this.anthropicChat(messages, onStream, signal);
      }

      const request: ChatCompletionRequest = {
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        top_p: this.config.topP,
        max_tokens: this.config.maxTokens,
        stream: !!onStream,
      };

      if (onStream) {
        return await this.streamChat(request, onStream, signal);
      } else {
        return await this.completeChat(request, signal);
      }
    } catch (error) {
      // 如果是 AbortError，不显示错误消息
      if (error instanceof DOMException && error.name === "AbortError") {
        console.log("请求已取消");
        throw error;
      }
      console.error("AI service error:", error);
      throw new Error("AI服务调用失败");
    }
  }

  private async anthropicChat(
    messages: ChatMessage[],
    onStream?: (chunk: string) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    // 将 messages 转换为 Anthropic 格式
    let systemPrompt = "";
    const chatMessages: Array<{ role: string; content: string }> = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        systemPrompt = msg.content;
      } else {
        chatMessages.push({ role: msg.role, content: msg.content });
      }
    }

    const requestBody = {
      model: this.config.model || "claude-sonnet-4-20250514",
      messages: chatMessages,
      stream: !!onStream,
      max_tokens: this.config.maxTokens || 4096,
      ...(systemPrompt && { system: systemPrompt }),
    };

    // GLM API 需要添加完整路径后缀
    let apiUrl = this.config.apiEndpoint;

    // /api/anthropic 端点需要添加 /v1/messages
    if (apiUrl.includes("/anthropic") && !apiUrl.endsWith("/messages")) {
      apiUrl = apiUrl.endsWith("/")
        ? apiUrl + "v1/messages"
        : apiUrl + "/v1/messages";
    }
    // /api/coding/paas 端点需要添加 /messages
    else if (apiUrl.includes("/coding/paas") && !apiUrl.endsWith("/messages")) {
      apiUrl = apiUrl.endsWith("/")
        ? apiUrl + "messages"
        : apiUrl + "/messages";
    }

    console.log("[Anthropic API] 请求端点:", apiUrl);
    console.log("[Anthropic API] 原始端点:", this.config.apiEndpoint);
    console.log("[Anthropic API] 请求体:", requestBody);

    // 将完整 URL 转换为代理路径（开发环境）
    let fetchUrl = apiUrl;
    if (apiUrl.includes("open.bigmodel.cn")) {
      const url = new URL(apiUrl);
      fetchUrl = url.pathname + url.search;
      console.log("[Anthropic API] 使用代理路径:", fetchUrl);
    }

    const response = await fetch(fetchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(requestBody),
      signal: signal,
    });

    console.log("[Anthropic API] 响应状态:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Anthropic API] 错误响应:", errorText);
      throw new Error(`API请求失败: ${response.status} - ${errorText}`);
    }

    if (onStream) {
      return await this.anthropicStreamChat(response, onStream);
    } else {
      const data = await response.json();
      return data.content[0]?.text || "";
    }
  }

  private async anthropicStreamChat(
    response: Response,
    onStream: (chunk: string) => void,
  ): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法读取响应流");
    }

    const decoder = new TextDecoder();
    let fullContent = "";
    let buffer = "";

    console.log("[Anthropic Stream] 开始读取流");

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("[Anthropic Stream] 流读取完成, 总内容:", fullContent);
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      console.log("[Anthropic Stream] 收到原始数据块:", chunk);

      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmedLine = line.trim();
        console.log("[Anthropic Stream] 处理行:", trimmedLine);

        if (!trimmedLine || !trimmedLine.startsWith("data:")) continue;

        const data = trimmedLine.slice(5).trim();
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          console.log(
            "[Anthropic Stream] 事件类型:",
            parsed.type,
            "完整数据:",
            parsed,
          );

          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            const content = parsed.delta.text;
            fullContent += content;
            console.log("[Anthropic Stream] 收到内容:", content);
            onStream(content);
          }
        } catch (e) {
          console.error("[Anthropic Stream] 解析失败:", e, "原始数据:", data);
        }
      }
    }

    console.log("[Anthropic Stream] 最终内容:", fullContent);
    return fullContent;
  }

  private async completeChat(
    request: ChatCompletionRequest,
    signal?: AbortSignal,
  ): Promise<string> {
    const response = await fetch(this.config.apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(request),
      signal: signal,
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data: ChatCompletionResponse = await response.json();
    return data.choices[0]?.message?.content || "";
  }

  private async streamChat(
    request: ChatCompletionRequest,
    onStream: (chunk: string) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    const response = await fetch(this.config.apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(request),
      signal: signal,
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法读取响应流");
    }

    const decoder = new TextDecoder();
    let fullContent = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // 保留最后一个不完整的行

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith(":")) continue;

        if (trimmedLine.startsWith("data: ")) {
          const data = trimmedLine.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);

            // OpenAI 格式
            if (parsed.choices && parsed.choices[0]?.delta?.content) {
              const content = parsed.choices[0].delta.content;
              fullContent += content;
              onStream(content);
            }
            // Anthropic 格式
            else if (
              parsed.type === "content_block_delta" &&
              parsed.delta?.text
            ) {
              const content = parsed.delta.text;
              fullContent += content;
              onStream(content);
            }
            // 其他可能的格式
            else if (parsed.content) {
              const content = parsed.content;
              fullContent += content;
              onStream(content);
            }
          } catch (e) {
            console.error("解析流数据失败:", e, "原始数据:", data);
          }
        }
      }
    }

    return fullContent;
  }

  // 生成内容
  async generateContent(prompt: string, context?: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: "你是一个专业的写作助手，擅长帮助用户创作高质量的笔记内容。",
      },
    ];

    if (context) {
      messages.push({
        role: "user",
        content: `上下文：${context}\n\n任务：${prompt}`,
      });
    } else {
      messages.push({
        role: "user",
        content: prompt,
      });
    }

    return await this.chat(messages);
  }

  // 改写润色
  async rewrite(
    text: string,
    style: "formal" | "casual" | "professional" = "professional",
  ): Promise<string> {
    const styleMap = {
      formal: "正式",
      casual: "轻松",
      professional: "专业",
    };

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `你是一个专业的文本编辑助手。请将用户的文本改写为${styleMap[style]}风格，保持原意的同时让表达更加流畅和优美。`,
      },
      {
        role: "user",
        content: text,
      },
    ];

    return await this.chat(messages);
  }

  // 摘要提取
  async summarize(text: string, maxLength?: number): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `你是一个专业的文本摘要助手。请提取文本的核心内容，生成简洁准确的摘要。${maxLength ? `摘要长度不超过${maxLength}字。` : ""}`,
      },
      {
        role: "user",
        content: text,
      },
    ];

    return await this.chat(messages);
  }

  // 关键词生成
  async extractKeywords(
    text: string,
    maxCount: number = 10,
  ): Promise<string[]> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `你是一个专业的内容分析助手。请从文本中提取${maxCount}个最重要的关键词，用逗号分隔。只返回关键词，不要其他内容。`,
      },
      {
        role: "user",
        content: text,
      },
    ];

    const result = await this.chat(messages);
    return result
      .split(/[,，]/)
      .map((k) => k.trim())
      .filter((k) => k);
  }

  // 内容扩展
  async expand(
    text: string,
    direction: "detail" | "example" | "explain" = "detail",
  ): Promise<string> {
    const directionMap = {
      detail: "补充更多细节",
      example: "添加具体例子",
      explain: "进一步解释说明",
    };

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `你是一个专业的内容创作助手。请根据用户的要求${directionMap[direction]}，使内容更加丰富和完整。`,
      },
      {
        role: "user",
        content: text,
      },
    ];

    return await this.chat(messages);
  }

  // 翻译
  async translate(
    text: string,
    targetLanguage: "en" | "zh" = "en",
  ): Promise<string> {
    const languageMap = {
      en: "英文",
      zh: "中文",
    };

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `你是一个专业的翻译助手。请将用户的文本翻译成${languageMap[targetLanguage]}，保持原文的意思和风格。`,
      },
      {
        role: "user",
        content: text,
      },
    ];

    return await this.chat(messages);
  }

  // 语法修正
  async fixGrammar(text: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "你是一个专业的文本校对助手。请检查并修正文本中的语法错误、拼写错误和标点符号错误，保持原文的表达方式。",
      },
      {
        role: "user",
        content: text,
      },
    ];

    return await this.chat(messages);
  }

  // 带流式回调的生成
  async generateContentStream(
    prompt: string,
    onStream: (chunk: string) => void,
    context?: string,
  ): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: "你是一个专业的写作助手，擅长帮助用户创作高质量的笔记内容。",
      },
    ];

    if (context) {
      messages.push({
        role: "user",
        content: `上下文：${context}\n\n任务：${prompt}`,
      });
    } else {
      messages.push({
        role: "user",
        content: prompt,
      });
    }

    return await this.chat(messages, onStream);
  }

  // 更新配置
  updateConfig(config: Partial<ModelConfig>) {
    this.config = { ...this.config, ...config };
  }
}

// 创建AI服务实例的工厂函数
export function createAIService(config: ModelConfig): AIService {
  return new AIService(config);
}

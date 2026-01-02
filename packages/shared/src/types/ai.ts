// AI 相关类型
export interface AiAssistant {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  avatar?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  sortOrder: number;
  isBuiltIn: boolean;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiConversation {
  id: string;
  title?: string;
  userId: string;
  noteId?: string;
  assistantId?: string;
  createdAt: string;
  updatedAt: string;
  // 关联数据
  note?: {
    id: string;
    title: string;
  };
  assistant?: AiAssistant;
  messages?: AiMessage[];
}

export interface AiMessage {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  tokensUsed?: number;
  model?: string;
  createdAt: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  description?: string;
  apiEndpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  enabled: boolean;
  isDefault: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModelUsageLog {
  id: string;
  modelId: string;
  action: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  success: boolean;
  errorMessage?: string;
  metadata?: any;
  createdAt: string;
}

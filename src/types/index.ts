// 笔记相关类型
export interface Note {
  id: string;
  title: string;
  content: string;
  htmlContent?: string;
  tags: string[];
  category: string;
  isDeleted: boolean;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface NoteVersion {
  id: string;
  noteId: string;
  title: string;
  content: string;
  createdAt: number;
}

// 分类相关类型
export interface Category {
  id: string;
  name: string;
  icon?: string;
  createdAt: number;
}

// AI助手相关类型
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface AIConversation {
  id: string;
  noteId?: string;
  messages: AIMessage[];
  title?: string;
  createdAt: number;
  updatedAt: number;
}

export type AIActionType = 
  | 'generate'        // 内容生成
  | 'rewrite'         // 改写润色
  | 'summarize'       // 摘要提取
  | 'keywords'        // 关键词生成
  | 'expand'          // 内容扩展
  | 'translate'       // 翻译
  | 'fixGrammar'      // 语法修正
  | 'custom';         // 自定义

// 模型配置相关类型
export interface ModelConfig {
  id: string;
  name: string;
  apiKey: string;
  apiEndpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  enabled: boolean;
}

export interface ModelUsageLog {
  id: string;
  modelId: string;
  action: AIActionType;
  inputTokens: number;
  outputTokens: number;
  timestamp: number;
  success: boolean;
  errorMessage?: string;
}

export interface ModelQuota {
  total: number;
  used: number;
  resetAt: number;
}

// 应用设置类型
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  autoSave: boolean;
  autoSaveInterval: number; // 秒
  fontSize: number;
  showLineNumbers: boolean;
  spellCheck: boolean;
  syncEnabled: boolean;
  language: 'zh-CN' | 'en-US';
}

// 搜索和过滤类型
export interface SearchFilter {
  keyword?: string;
  tags?: string[];
  category?: string;
  dateRange?: {
    start: number;
    end: number;
  };
}

// 附件类型
export interface Attachment {
  id: string;
  noteId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  createdAt: number;
}

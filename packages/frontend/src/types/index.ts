// 从共享包重新导出所有类型
// 暂时注释，先让前端运行起来
// export * from "@ainote/shared";

// 导出本地类型（用于 IndexedDB 存储）
export * from "./local";

// NoteMetadata 类型定义
export interface NoteMetadata {
  drawioData?: string;
  drawioThumbnail?: string;
  mindmapData?: string;
  mindmapLayout?: "mindmap" | "organization" | "tree";
  customConfig?: Record<string, any>;
}

// NoteVersion 类型定义
export interface NoteVersion {
  id: string;
  noteId: string;
  content: string;
  createdAt: number;
}

// 以下是为了向后兼容保留的前端特定类型
// 这些类型主要与 IndexedDB 本地存储相关

// AI助手相关类型（本地扩展）
export interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  actionType?: AIActionType; // 标记是否来自快捷操作
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
  | "generate" // 内容生成
  | "rewrite" // 改写润色
  | "summarize" // 摘要提取
  | "keywords" // 关键词生成
  | "expand" // 内容扩展
  | "translate" // 翻译
  | "fixGrammar" // 语法修正
  | "custom"; // 自定义

// 模型配置相关类型（本地扩展，用于 IndexedDB）
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
  theme: "light" | "dark" | "auto";
  autoSave: boolean;
  autoSaveInterval: number; // 秒
  fontSize: number;
  showLineNumbers: boolean;
  spellCheck: boolean;
  syncEnabled: boolean;
  language: "zh-CN" | "en-US";
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

// 文件附件类型（用于 DrawIO 等导出功能）
export interface FileAttachment {
  id: string;
  noteId: string;
  fileName: string;
  fileType: "drawio" | "png" | "svg" | "pdf" | "xml";
  fileSize: number;
  fileData: string; // Base64 编码的文件数据
  createdAt: number;
}

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
  mindmapLayout?:
    | "mindMap"
    | "logicalStructure"
    | "organizationStructure"
    | "catalogOrganization"
    | "fishbone"
    | "timeline"
    | "verticalTimeline";
  mindmapTheme?: string;
  customConfig?: Record<string, any>;
  // Monaco 编辑器相关配置
  monacoLanguage?: string;
  monacoTheme?: string;
  monacoFontSize?: number;
  monacoMinimap?: boolean;
  monacoLineNumbers?: string;
  monacoWordWrap?: string;
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
}

export interface AIConversation {
  id: string;
  noteId?: string;
  userId?: string;
  assistantId?: string;
  messages: AIMessage[];
  title?: string;
  createdAt: number;
  updatedAt: number;
  // 上下文摘要（压缩后的历史对话）
  contextSummary?: string;
  // 最近一次压缩的消息索引（之后的消息未被压缩）
  lastCompressedMessageIndex?: number;
  // 思维导图专用上下文
  mindmapContext?: {
    // 最后一次同步的数据哈希
    lastDataHash: string;
    // 最后同步时间
    lastSyncTime: number;
    // 结构摘要（大文件时使用）
    structureSummary?: string;
  };
}

// 模型配置相关类型（本地扩展，用于 IndexedDB）
export interface ModelConfig {
  id: string;
  name: string;
  description?: string;
  apiKey?: string;
  apiEndpoint: string;
  apiType: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  enabled: boolean;
  isDefault: boolean;
  isPublic?: boolean; // 是否公有（其他人可见但不可编辑）
  userId?: string;
  // 同步相关字段（仅本地使用）
  _pendingSync?: boolean;
}

export interface ModelUsageLog {
  id: string;
  modelId: string;
  action: string;
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

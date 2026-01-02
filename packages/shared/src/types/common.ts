// API 响应相关类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any[];
}

export interface ResponseMeta {
  timestamp?: string;
  page?: number;
  pageSize?: number;
  total?: number;
  hasMore?: boolean;
}

// 分页参数
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// 搜索和过滤
export interface SearchFilter {
  keyword?: string;
  tags?: string[];
  category?: string;
  dateRange?: {
    start: number;
    end: number;
  };
}

// 应用设置类型
export interface AppSettings {
  theme: "light" | "dark" | "auto";
  autoSave: boolean;
  autoSaveInterval: number;
  fontSize: number;
  showLineNumbers: boolean;
  spellCheck: boolean;
  syncEnabled: boolean;
  language: "zh-CN" | "en-US";
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

// 文件附件类型
export interface FileAttachment {
  id: string;
  noteId: string;
  fileName: string;
  fileType: "drawio" | "png" | "svg" | "pdf" | "xml";
  fileSize: number;
  fileData: string;
  createdAt: number;
}

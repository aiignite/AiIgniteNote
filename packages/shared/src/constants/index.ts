// 常量定义

// API 基础 URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

// 文件类型
export const FILE_TYPES = {
  MARKDOWN: "markdown",
  RICH_TEXT: "richtext",
  DRAWIO: "drawio",
  MINDMAP: "mindmap",
} as const;

// AI 操作类型
export const AI_ACTIONS = {
  GENERATE: "generate",
  REWRITE: "rewrite",
  SUMMARIZE: "summarize",
  KEYWORDS: "keywords",
  EXPAND: "expand",
  TRANSLATE: "translate",
  FIX_GRAMMAR: "fixGrammar",
  CUSTOM: "custom",
} as const;

// 同步状态
export const SYNC_STATUS = {
  IDLE: "idle",
  SYNCING: "syncing",
  CONFLICT: "conflict",
  ERROR: "error",
} as const;

// 默认分类
export const DEFAULT_CATEGORIES = [
  { id: "default", name: "未分类", icon: "📁" },
  { id: "work", name: "工作", icon: "💼" },
  { id: "study", name: "学习", icon: "📚" },
  { id: "life", name: "生活", icon: "🏠" },
  { id: "ideas", name: "灵感", icon: "💡" },
] as const;

// 主题
export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  AUTO: "auto",
} as const;

// 语言
export const LANGUAGES = {
  ZH_CN: "zh-CN",
  EN_US: "en-US",
} as const;

// 错误代码
export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  SERVER_ERROR: "SERVER_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
} as const;

// 分页默认值
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Token 过期时间
export const ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 分钟
export const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 天

// IndexedDB 本地存储的 Note 类型
// 这是前端本地使用的类型，与服务端类型略有不同

// 本地定义的文件类型枚举，避免循环引用
export enum NoteFileType {
  MARKDOWN = "markdown",
  RICH_TEXT = "richtext",
  DRAWIO = "drawio",
  MINDMAP = "mindmap",
  MONACO = "monaco",
}

// AI 助手配置（本地存储）
export interface LocalAIAssistant {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  avatar?: string;
  model: string; // 模型配置 ID，空字符串表示使用默认模型
  temperature?: number;
  maxTokens?: number;
  isBuiltIn?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  createdAt: number;
  updatedAt: number;
}

export interface LocalNote {
  id: string;
  title: string;
  content: string;
  htmlContent?: string;
  tags: string[];
  category: string; // 本地存储的是分类名称或ID
  isDeleted: boolean;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
  version: number;
  fileType: NoteFileType;
  metadata?: {
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
    customConfig?: Record<string, any>;
  };
  // 同步相关字段
  synced: boolean; // 是否已同步到服务器
  pendingSync: boolean; // 是否有待同步的更改
  needsServerId: boolean; // 是否需要在服务器创建新记录（而不是更新现有记录）
  lastSyncError?: string; // 最后一次同步失败的错误信息
  syncedAt?: number;
  serverVersion?: number;
}

// IndexedDB 本地存储的 Category 类型
export interface LocalCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  createdAt: number;
  sortOrder?: number;
  // 同步相关字段（仅本地使用）
  _pendingSync?: boolean;
  _deleted?: boolean;
}

// IndexedDB 本地存储的 Tag 类型
export interface LocalTag {
  id: string;
  name: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
  // 同步相关字段（仅本地使用）
  _pendingSync?: boolean;
  _deleted?: boolean;
}

// 从服务端 Note 转换为本地 Note
export function toLocalNote(serverNote: any): LocalNote {
  return {
    id: serverNote.id,
    title: serverNote.title,
    content: serverNote.content,
    htmlContent: serverNote.htmlContent,
    tags: serverNote.tags || [],
    category: serverNote.categoryId || serverNote.category?.id || "",
    isDeleted: serverNote.isDeleted || false,
    isFavorite: serverNote.isFavorite || false,
    createdAt: new Date(serverNote.createdAt).getTime(),
    updatedAt: new Date(serverNote.updatedAt).getTime(),
    version: serverNote.version || 1,
    fileType: serverNote.fileType || "markdown",
    metadata: serverNote.metadata,
    syncedAt: serverNote.syncedAt,
    pendingSync: serverNote.pendingSync,
    serverVersion: serverNote.serverVersion,
  };
}

// 从本地 Note 转换为服务端 Note
export function toServerNote(localNote: LocalNote): any {
  return {
    id: localNote.id,
    title: localNote.title,
    content: localNote.content,
    htmlContent: localNote.htmlContent,
    tags: localNote.tags,
    categoryId: localNote.category,
    isDeleted: localNote.isDeleted,
    isFavorite: localNote.isFavorite,
    version: localNote.version,
    fileType: localNote.fileType,
    metadata: localNote.metadata,
    createdAt: new Date(localNote.createdAt).toISOString(),
    updatedAt: new Date(localNote.updatedAt).toISOString(),
  };
}

// 从服务端 Category 转换为本地 Category
export function toLocalCategory(serverCategory: any): LocalCategory {
  return {
    id: serverCategory.id,
    name: serverCategory.name,
    icon: serverCategory.icon,
    color: serverCategory.color,
    sortOrder: serverCategory.sortOrder,
    createdAt: new Date(serverCategory.createdAt).getTime(),
  };
}

// 从服务端 Tag 转换为本地 Tag
export function toLocalTag(serverTag: any): LocalTag {
  return {
    id: serverTag.id,
    name: serverTag.name,
    color: serverTag.color,
    createdAt: new Date(serverTag.createdAt).getTime(),
    updatedAt: new Date(serverTag.updatedAt).getTime(),
  };
}

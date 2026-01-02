// 笔记文件类型枚举
export enum NoteFileType {
  MARKDOWN = "markdown",
  RICH_TEXT = "richtext",
  DRAWIO = "drawio",
  MINDMAP = "mindmap",
}

// 笔记元数据接口
export interface NoteMetadata {
  // DrawIO 相关
  drawioData?: string;
  drawioThumbnail?: string;

  // 思维导图相关
  mindmapData?: string;
  mindmapLayout?: "mindmap" | "organization" | "tree";

  // 通用元数据
  customConfig?: Record<string, any>;
}

// 分类相关类型
export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  // 关联数据
  _count?: {
    notes: number;
  };
}

// 笔记相关类型
export interface Note {
  id: string;
  title: string;
  content: string;
  htmlContent?: string;
  fileType: string;
  metadata?: NoteMetadata | any;
  tags: string[];
  isDeleted: boolean;
  isFavorite: boolean;
  version: number;
  userId: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  // 关联数据
  category?: Category;
  // 同步相关字段
  syncedAt?: number;
  pendingSync?: boolean;
  serverVersion?: number;
  conflict?: {
    localData: any;
    serverData: any;
  };
}

export interface NoteVersion {
  id: string;
  noteId: string;
  content: string;
  version: number;
  createdAt: string;
}

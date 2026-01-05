import { ReactNode } from "react";
import { NoteFileType, NoteMetadata } from "../../types";

// 编辑器动作类型
export type EditorAction =
  | "download" // 下载/导出
  | "upload" // 上传/导入
  | "preview" // 预览
  | "fullscreen" // 全屏
  | "share" // 分享
  | "exportImage"; // 导出图片

// 统一的编辑器 Props
export interface EditorProps {
  noteId: string;
  title: string;
  content: string;
  metadata?: NoteMetadata;
  readOnly?: boolean;

  // 回调函数
  onChange: (content: string, metadata?: NoteMetadata) => void;
  onTitleChange: (title: string) => void;
  onSave?: () => void;
  onDownload?: (format: string) => void;
  onExportImage?: (exportFn: () => Promise<void>) => void;

  // Markdown 编辑器专用控制
  previewMode?: "edit" | "live" | "preview";
  onPreviewModeChange?: (mode: "edit" | "live" | "preview") => void;
  isFullscreen?: boolean;
  onFullscreenChange?: (fullscreen: boolean) => void;
}

// 编辑器配置接口
export interface EditorConfig {
  type: NoteFileType;
  name: string;
  icon: ReactNode;
  description: string;
  component: React.ComponentType<EditorProps>;
  supportedActions: EditorAction[];
}

// 编辑器实例接口（用于外部调用）
export interface EditorInstance {
  getContent(): string;
  setContent(content: string): void;
  focus(): void;
  blur(): void;
  destroy?(): void;
}

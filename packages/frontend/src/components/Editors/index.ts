// 导出所有编辑器组件
export { default as MarkdownEditor } from "./MarkdownEditor";
export { default as RichTextEditor } from "./RichTextEditor";
export { default as DrawIOEditor } from "./DrawIOEditor";
export { default as MindMapEditor } from "./MindMapEditor";

// 导出类型和接口
export type {
  EditorProps,
  EditorConfig,
  EditorAction,
  EditorInstance,
} from "./BaseEditor";

// 导出编辑器注册表和相关工具函数
export {
  EDITOR_REGISTRY,
  getEditorConfig,
  getSupportedEditorTypes,
  getEditorComponent,
  supportsAction,
} from "./EditorRegistry";

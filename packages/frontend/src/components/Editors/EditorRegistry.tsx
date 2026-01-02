import { NoteFileType } from "../../types";
import {
  FileMarkdownOutlined,
  FileTextOutlined,
  ApartmentOutlined,
  NodeIndexOutlined,
  CodeOutlined,
} from "@ant-design/icons";
import type { EditorConfig } from "./BaseEditor";

// 动态导入编辑器组件（懒加载）
import MarkdownEditor from "./MarkdownEditor";
import RichTextEditor from "./RichTextEditor";
import DrawIOEditor from "./DrawIOEditor";
import MindMapEditor from "./MindMapEditor";
import MonacoEditor from "./MonacoEditor";

// 编辑器配置注册表
export const EDITOR_REGISTRY: EditorConfig[] = [
  {
    type: NoteFileType.MARKDOWN,
    name: "Markdown",
    icon: <FileMarkdownOutlined />,
    description: "支持 Markdown 语法的文档编辑",
    component: MarkdownEditor,
    supportedActions: ["download", "upload", "preview", "fullscreen"],
  },
  {
    type: NoteFileType.RICH_TEXT,
    name: "富文本",
    icon: <FileTextOutlined />,
    description: "所见即所得的富文本编辑",
    component: RichTextEditor,
    supportedActions: ["download", "upload", "fullscreen"],
  },
  {
    type: NoteFileType.DRAWIO,
    name: "DrawIO",
    icon: <ApartmentOutlined />,
    description: "DrawIO 流程图绘制",
    component: DrawIOEditor,
    supportedActions: ["download", "upload", "fullscreen"],
  },
  {
    type: NoteFileType.MINDMAP,
    name: "思维导图",
    icon: <NodeIndexOutlined />,
    description: "思维导图编辑",
    component: MindMapEditor,
    supportedActions: ["download", "upload", "fullscreen"],
  },
  {
    type: NoteFileType.MONACO,
    name: "代码编辑器",
    icon: <CodeOutlined />,
    description: "Monaco 代码编辑器，支持多种编程语言",
    component: MonacoEditor,
    supportedActions: ["download", "upload", "fullscreen"],
  },
];

// 根据 fileType 获取编辑器配置
export function getEditorConfig(
  fileType: NoteFileType,
): EditorConfig | undefined {
  return EDITOR_REGISTRY.find((config) => config.type === fileType);
}

// 获取所有支持的编辑器类型
export function getSupportedEditorTypes(): NoteFileType[] {
  return EDITOR_REGISTRY.map((config) => config.type);
}

// 获取编辑器组件
export function getEditorComponent(
  fileType: NoteFileType,
): React.ComponentType<any> | undefined {
  return getEditorConfig(fileType)?.component;
}

// 检查编辑器是否支持指定动作
export function supportsAction(
  fileType: NoteFileType,
  action: string,
): boolean {
  const config = getEditorConfig(fileType);
  return config?.supportedActions.includes(action as any) ?? false;
}

/**
 * 编辑器选择内容类型定义
 * 统一处理不同编辑器的选区数据
 */

/**
 * 选择内容的数据来源类型
 */
export type SelectionSource =
  | "markdown"
  | "richtext"
  | "mindmap"
  | "drawio"
  | "monaco";

/**
 * 选择内容的类型
 */
export type SelectionContentType =
  | "text"
  | "mindmap_nodes"
  | "drawio_elements"
  | "code";

/**
 * 思维导图节点数据
 */
export interface MindMapNodeData {
  text: string;
  level: number;
  id?: string;
  children?: MindMapNodeData[];
}

/**
 * DrawIO 元素数据
 */
export interface DrawIOElementData {
  id: string;
  label?: string;
  type?: string;
  style?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

/**
 * 统一的选择内容
 */
export interface SelectedContent {
  /** 内容类型 */
  type: SelectionContentType;
  /** 来源编辑器 */
  source: SelectionSource;
  /** 格式化后的文本（AI 助手默认使用） */
  text: string;
  /** 原始数据（可选模式） */
  raw?: any;
  /** 元数据 */
  metadata?: {
    /** 节点/元素数量 */
    count?: number;
    /** 层级信息（思维导图） */
    maxLevel?: number;
    /** 是否包含结构化数据 */
    hasStructure?: boolean;
    /** 选择时间戳 */
    timestamp?: number;
  };
}

/**
 * 空的选择内容
 */
export const EMPTY_SELECTION: SelectedContent = {
  type: "text",
  source: "markdown",
  text: "",
  metadata: { count: 0 },
};

/**
 * 选择内容工具函数
 */
export class SelectionHelper {
  /**
   * 从思维导图节点列表生成结构化文本
   */
  static formatMindMapNodes(nodes: MindMapNodeData[]): string {
    if (nodes.length === 0) return "";

    // 按层级排序
    const sortedNodes = [...nodes].sort((a, b) => a.level - b.level);

    // 格式化为带缩进的文本
    const lines = sortedNodes.map((node) => {
      const indent = "  ".repeat(node.level);
      const prefix = node.level === 0 ? "📍" : "├─";
      return `${indent}${prefix} ${node.text}`;
    });

    return lines.join("\n");
  }

  /**
   * 从 DrawIO 元素生成文本
   */
  static formatDrawIOElements(elements: DrawIOElementData[]): string {
    if (elements.length === 0) return "";

    return elements
      .map((el, index) => {
        const label = el.label || `元素 ${index + 1}`;
        const type = el.type || "未知类型";
        return `[${index + 1}] ${label} (${type})`;
      })
      .join("\n");
  }

  /**
   * 生成选择内容的描述文本
   */
  static getSelectionDescription(content: SelectedContent): string {
    const { type, source, metadata } = content;

    const sourceNames: Record<SelectionSource, string> = {
      markdown: "Markdown",
      richtext: "富文本",
      mindmap: "思维导图",
      drawio: "DrawIO",
      monaco: "代码",
    };

    const typeNames: Record<SelectionContentType, string> = {
      text: "文本",
      mindmap_nodes: "节点",
      drawio_elements: "元素",
      code: "代码",
    };

    const sourceName = sourceNames[source];
    const typeName = typeNames[type];

    if (type === "mindmap_nodes" || type === "drawio_elements") {
      const count = metadata?.count || 0;
      const levelInfo =
        type === "mindmap_nodes" && metadata?.maxLevel
          ? ` (最深层级: ${metadata.maxLevel})`
          : "";
      return `已选择 ${sourceName} 的 ${count} 个${typeName}${levelInfo}`;
    }

    if (type === "text" || type === "code") {
      const preview = content.text.slice(0, 30);
      const ellipsis = content.text.length > 30 ? "..." : "";
      return `已选择 ${sourceName} 内容: "${preview}${ellipsis}"`;
    }

    return `已选择 ${sourceName} 内容`;
  }

  /**
   * 验证选择内容是否有效
   */
  static isValidSelection(content: SelectedContent): boolean {
    if (!content || !content.text) return false;

    // 检查内容长度
    const MAX_TEXT_LENGTH = 10000; // 10k 字符限制
    if (content.text.length > MAX_TEXT_LENGTH) {
      console.warn(
        `[SelectionHelper] 选择内容过长 (${content.text.length} > ${MAX_TEXT_LENGTH})，将被截断`,
      );
      content.text =
        content.text.slice(0, MAX_TEXT_LENGTH) + "\n...(内容过长，已截断)";
    }

    return true;
  }

  /**
   * 截断过长的选择内容
   */
  static truncateText(text: string, maxLength: number = 1000): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "\n...(内容过长，已截断)";
  }
}

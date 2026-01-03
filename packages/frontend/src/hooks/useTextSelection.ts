/**
 * 文本选择 Hook
 * 统一处理文本编辑器的选区监听和 AI 助手集成
 */

import { useEffect, useCallback } from "react";
import { useAIStore } from "../store/aiStore";
import { SelectedContent } from "../types/selection";
import { NoteFileType } from "../types";

export interface UseTextSelectionOptions {
  /** 编辑器类型 */
  fileType?: NoteFileType;
  /** 是否启用选择监听 */
  enabled?: boolean;
  /** 选择变化回调 */
  onSelectionChange?: (content: SelectedContent) => void;
}

/**
 * 获取编辑器来源类型
 */
function getSourceType(fileType?: NoteFileType): SelectedContent["source"] {
  switch (fileType) {
    case NoteFileType.MARKDOWN:
      return "markdown";
    case NoteFileType.RICH_TEXT:
      return "richtext";
    case NoteFileType.MONACO:
      return "monaco";
    default:
      return "markdown";
  }
}

/**
 * 获取内容类型
 */
function getContentType(fileType?: NoteFileType): SelectedContent["type"] {
  if (fileType === NoteFileType.MONACO) {
    return "code";
  }
  return "text";
}

/**
 * 文本选择 Hook
 */
export function useTextSelection(options: UseTextSelectionOptions = {}) {
  const { fileType, enabled = true, onSelectionChange } = options;
  const { setSelectedContent, clearSelectedContent } = useAIStore();

  /**
   * 处理文本选择变化
   */
  const handleSelectionChange = useCallback(() => {
    if (!enabled) return;

    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || "";

    // 如果没有选中文本，清除选择
    if (!selectedText) {
      clearSelectedContent();
      return;
    }

    // 构建选择内容
    const content: SelectedContent = {
      type: getContentType(fileType),
      source: getSourceType(fileType),
      text: selectedText,
      metadata: {
        count: selectedText.length,
        timestamp: Date.now(),
      },
    };

    // 更新 AI Store
    setSelectedContent(content);

    // 触发回调
    onSelectionChange?.(content);
  }, [
    enabled,
    fileType,
    setSelectedContent,
    clearSelectedContent,
    onSelectionChange,
  ]);

  /**
   * 清除选择
   */
  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    clearSelectedContent();
  }, [clearSelectedContent]);

  /**
   * 手动设置选择内容（用于 Monaco 等非原生选区）
   */
  const manualSetSelection = useCallback(
    (text: string) => {
      if (!text) {
        clearSelectedContent();
        return;
      }

      const content: SelectedContent = {
        type: getContentType(fileType),
        source: getSourceType(fileType),
        text,
        metadata: {
          count: text.length,
          timestamp: Date.now(),
        },
      };

      setSelectedContent(content);
      onSelectionChange?.(content);
    },
    [fileType, setSelectedContent, onSelectionChange],
  );

  // 监听文本选择变化
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [enabled, handleSelectionChange]);

  return {
    clearSelection,
    manualSetSelection,
  };
}

/**
 * 获取当前选中文本的辅助函数
 */
export function getSelectedText(): string {
  const selection = window.getSelection();
  return selection?.toString().trim() || "";
}

/**
 * 清除选区的辅助函数
 */
export function clearTextSelection(): void {
  window.getSelection()?.removeAllRanges();
}

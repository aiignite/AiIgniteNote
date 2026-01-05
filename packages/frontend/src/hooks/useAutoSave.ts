import { useState, useEffect, useCallback, useRef } from "react";

interface UseAutoSaveOptions {
  noteId?: string;
  title: string;
  content: string;
  tags: string[];
  onSave: () => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave({
  noteId,
  title,
  content,
  tags,
  onSave,
  delay = 2000,
  enabled = true,
}: UseAutoSaveOptions) {
  const [saveStatus, setSaveStatus] = useState("已保存");
  const [lastSaveTime, setLastSaveTime] = useState<number>(Date.now());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 用于追踪上次的值，检测实际变化
  const prevValuesRef = useRef<{
    title: string;
    content: string;
    tags: string;
  } | null>(null);

  // 标记是否已经完成首次初始化
  const isInitializedRef = useRef(false);

  // 记录上一次的 enabled 状态，初始值设为 false
  const prevEnabledRef = useRef(false);

  // 检测内容变化
  useEffect(() => {
    const currentTitle = title;
    const currentContent = content;
    const currentTags = JSON.stringify(tags);

    // 如果从禁用变为启用，重新初始化 prevValuesRef
    if (prevEnabledRef.current !== enabled && prevValuesRef.current !== null) {
      prevValuesRef.current = null;
      isInitializedRef.current = false;
    }
    prevEnabledRef.current = enabled;

    // 如果未启用，不检测变化
    if (!enabled) {
      return;
    }

    // 第一次加载时，不标记为未保存
    if (prevValuesRef.current === null) {
      prevValuesRef.current = {
        title: currentTitle,
        content: currentContent,
        tags: currentTags,
      };

      // 标记已初始化
      isInitializedRef.current = true;
      return;
    }

    // 如果还没有完成首次初始化，不检测变化
    if (!isInitializedRef.current) {
      return;
    }

    const prev = prevValuesRef.current;

    // 只有当值真正改变时才标记为未保存
    if (
      currentTitle !== prev.title ||
      currentContent !== prev.content ||
      currentTags !== prev.tags
    ) {
      setHasUnsavedChanges(true);
      setSaveStatus("未保存");
    }

    prevValuesRef.current = {
      title: currentTitle,
      content: currentContent,
      tags: currentTags,
    };
  }, [title, content, tags, enabled]);

  // 自动保存
  useEffect(() => {
    if (!noteId || !hasUnsavedChanges || !enabled) return;

    const timer = setTimeout(async () => {
      try {
        setSaveStatus("保存中...");
        await onSave();
        setHasUnsavedChanges(false);
        setLastSaveTime(Date.now());
        setSaveStatus("已保存");
      } catch (error) {
        console.error("Auto save failed:", error);
        setSaveStatus("保存失败");
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [noteId, hasUnsavedChanges, onSave, delay, enabled]);

  // 手动保存
  const manualSave = useCallback(async () => {
    if (!noteId) {
      setSaveStatus("无法保存：没有笔记ID");
      return;
    }

    try {
      setSaveStatus("保存中...");
      await onSave();
      setHasUnsavedChanges(false);
      setLastSaveTime(Date.now());
      setSaveStatus("已保存");
    } catch (error) {
      console.error("Manual save failed:", error);
      setSaveStatus("保存失败");
    }
  }, [noteId, onSave]);

  return {
    saveStatus,
    lastSaveTime,
    hasUnsavedChanges,
    manualSave,
  };
}

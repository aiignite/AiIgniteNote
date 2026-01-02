import { useState, useEffect, useCallback, useRef } from "react";

interface UseAutoSaveOptions {
  noteId?: string;
  title: string;
  content: string;
  tags: string[];
  onSave: () => Promise<void>;
  delay?: number;
}

export function useAutoSave({
  noteId,
  title,
  content,
  tags,
  onSave,
  delay = 2000, // 改为 2 秒自动保存
}: UseAutoSaveOptions) {
  const [saveStatus, setSaveStatus] = useState("已保存");
  const [lastSaveTime, setLastSaveTime] = useState<number>(Date.now());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 用于追踪上次的值，检测实际变化
  const prevValuesRef = useRef({ title, content, tags: JSON.stringify(tags) });

  // 检测内容变化
  useEffect(() => {
    const currentTitle = title;
    const currentContent = content;
    const currentTags = JSON.stringify(tags);

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
  }, [title, content, tags]);

  // 自动保存
  useEffect(() => {
    if (!noteId || !hasUnsavedChanges) return;

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
  }, [noteId, hasUnsavedChanges, onSave, delay]);

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

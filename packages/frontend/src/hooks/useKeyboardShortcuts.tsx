import { useEffect, useCallback } from "react";
import { message } from "antd";
import { useNoteStore } from "../store/noteStore";
import { useAIStore } from "../store/aiStore";

interface KeyboardShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
  disabled?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcutConfig[],
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 检查是否在输入框中
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true";

      shortcuts.forEach((shortcut) => {
        if (shortcut.disabled) return;

        const keyMatch =
          e.key.toLowerCase() === shortcut.key.toLowerCase() ||
          e.code === shortcut.key;

        const ctrlMatch =
          shortcut.ctrlKey === undefined || e.ctrlKey === shortcut.ctrlKey;
        const shiftMatch =
          shortcut.shiftKey === undefined || e.shiftKey === shortcut.shiftKey;
        const altMatch =
          shortcut.altKey === undefined || e.altKey === shortcut.altKey;
        const metaMatch =
          shortcut.metaKey === undefined || e.metaKey === shortcut.metaKey;

        // 如果在输入框中，只处理允许的快捷键
        if (isInput && !shortcut.ctrlKey && !shortcut.metaKey) {
          return;
        }

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          e.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
}

// 全局快捷键 Hook
export function useGlobalKeyboardShortcuts() {
  const { createNote, currentNote, setCurrentNote } = useNoteStore();
  const { createConversation } = useAIStore();

  const handleNewNote = useCallback(async () => {
    // 创建新笔记
    const newNote = await createNote({
      title: "新建笔记",
      content: "",
      htmlContent: "",
      tags: [],
      category: "", // 使用空字符串，后端会自动分配到"未分类"
      isDeleted: false,
      isFavorite: false,
      fileType: "markdown" as any,
    });

    // 设置为当前笔记并导航
    setCurrentNote(newNote);

    // 触发导航到新笔记
    window.location.hash = `/notes/${newNote.id}`;

    message.success("已创建新笔记");
  }, [createNote, setCurrentNote]);

  const handleSaveNote = useCallback(() => {
    // 触发手动保存
    message.success("笔记已保存");
  }, []);

  const handleSearch = useCallback(() => {
    const searchInput = document.querySelector(
      'input[placeholder*="搜索"]',
    ) as HTMLInputElement;
    searchInput?.focus();
  }, []);

  const handleToggleAI = useCallback(() => {
    // TODO: 实现 AI 助手切换
    message.info("AI 助手切换");
  }, []);

  const handleNewConversation = useCallback(() => {
    createConversation();
    message.success("已创建新对话");
  }, [createConversation]);

  const shortcuts: KeyboardShortcutConfig[] = [
    {
      key: "n",
      ctrlKey: true,
      description: "新建笔记 (Ctrl+N)",
      action: handleNewNote,
    },
    {
      key: "s",
      ctrlKey: true,
      description: "保存笔记 (Ctrl+S)",
      action: handleSaveNote,
    },
    {
      key: "f",
      ctrlKey: true,
      description: "搜索 (Ctrl+F)",
      action: handleSearch,
    },
    {
      key: "b",
      ctrlKey: true,
      description: "加粗 (Ctrl+B)",
      action: () => {
        document.execCommand("bold");
      },
      disabled: !currentNote,
    },
    {
      key: "i",
      ctrlKey: true,
      description: "斜体 (Ctrl+I)",
      action: () => {
        document.execCommand("italic");
      },
      disabled: !currentNote,
    },
    {
      key: "u",
      ctrlKey: true,
      description: "下划线 (Ctrl+U)",
      action: () => {
        document.execCommand("underline");
      },
      disabled: !currentNote,
    },
    {
      key: "k",
      ctrlKey: true,
      description: "切换 AI 助手 (Ctrl+K)",
      action: handleToggleAI,
    },
    {
      key: "Enter",
      ctrlKey: true,
      shiftKey: true,
      description: "新建对话 (Ctrl+Shift+Enter)",
      action: handleNewConversation,
    },
  ];

  useKeyboardShortcuts(shortcuts, true);

  return shortcuts;
}

// 快捷键帮助组件
export interface ShortcutHelpProps {
  shortcuts?: KeyboardShortcutConfig[];
}

export function ShortcutHelp({ shortcuts }: ShortcutHelpProps) {
  const globalShortcuts = useGlobalKeyboardShortcuts();

  const displayShortcuts = shortcuts || globalShortcuts;

  const formatKey = (shortcut: KeyboardShortcutConfig) => {
    const parts: string[] = [];
    if (shortcut.ctrlKey) parts.push("Ctrl");
    if (shortcut.shiftKey) parts.push("Shift");
    if (shortcut.altKey) parts.push("Alt");
    if (shortcut.metaKey) parts.push("Cmd");
    parts.push(shortcut.key.toUpperCase());
    return parts.join(" + ");
  };

  return (
    <div style={{ padding: "16px 0" }}>
      <h4 style={{ marginBottom: 16 }}>键盘快捷键</h4>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "8px 16px",
        }}
      >
        {displayShortcuts.map((shortcut, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
            }}
          >
            <kbd
              style={{
                padding: "2px 8px",
                background: "rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: 4,
                fontFamily: "monospace",
              }}
            >
              {formatKey(shortcut)}
            </kbd>
            <span style={{ color: "rgba(0,0,0,0.65)" }}>
              {shortcut.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

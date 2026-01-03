import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "auto";

export interface FontFamily {
  value: string;
  label: string;
  fonts: string[];
}

export interface EditorTheme {
  value: string;
  label: string;
  bg: string;
  fg: string;
}

export interface ThemeSettings {
  theme: ThemeMode;
  fontSize: number;
  fontFamily: string;
  editorTheme: string;
  showLineNumbers: boolean;
  codeFolding: boolean;
  autoSave: boolean;
  spellCheck: boolean;
}

interface ThemeStore extends ThemeSettings {
  // Actions
  setTheme: (theme: ThemeMode) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setEditorTheme: (theme: string) => void;
  setShowLineNumbers: (show: boolean) => void;
  setCodeFolding: (enabled: boolean) => void;
  setAutoSave: (enabled: boolean) => void;
  setSpellCheck: (enabled: boolean) => void;
  resetSettings: () => void;
  getEffectiveTheme: () => "light" | "dark";
}

// 字体配置
export const FONT_FAMILIES: Record<string, FontFamily> = {
  system: {
    value: "system",
    label: "系统默认",
    fonts: [
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "Helvetica Neue",
      "Arial",
      "sans-serif",
    ],
  },
  georgia: {
    value: "georgia",
    label: "Georgia",
    fonts: ["Georgia", "Times New Roman", "Times", "serif"],
  },
  arial: {
    value: "arial",
    label: "Arial",
    fonts: ["Arial", "Helvetica", "sans-serif"],
  },
  helvetica: {
    value: "helvetica",
    label: "Helvetica",
    fonts: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
  },
};

// 编辑器主题配置
export const EDITOR_THEMES: Record<string, EditorTheme> = {
  github: {
    value: "github",
    label: "GitHub",
    bg: "#ffffff",
    fg: "#24292e",
  },
  monokai: {
    value: "monokai",
    label: "Monokai",
    bg: "#272822",
    fg: "#f8f8f2",
  },
  nord: {
    value: "nord",
    label: "Nord",
    bg: "#2e3440",
    fg: "#d8dee9",
  },
  dracula: {
    value: "dracula",
    label: "Dracula",
    bg: "#282a36",
    fg: "#f8f8f2",
  },
};

const DEFAULT_SETTINGS: ThemeSettings = {
  theme: "light",
  fontSize: 14,
  fontFamily: "system",
  editorTheme: "github",
  showLineNumbers: true,
  codeFolding: true,
  autoSave: true,
  spellCheck: false,
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      setTheme: (theme) => set({ theme }),

      setFontSize: (fontSize) => set({ fontSize }),

      setFontFamily: (fontFamily) => set({ fontFamily }),

      setEditorTheme: (editorTheme) => set({ editorTheme }),

      setShowLineNumbers: (showLineNumbers) => set({ showLineNumbers }),

      setCodeFolding: (codeFolding) => set({ codeFolding }),

      setAutoSave: (autoSave) => set({ autoSave }),

      setSpellCheck: (spellCheck) => set({ spellCheck }),

      resetSettings: () => set(DEFAULT_SETTINGS),

      getEffectiveTheme: () => {
        const { theme } = get();
        if (theme === "auto") {
          return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
        }
        return theme;
      },
    }),
    {
      name: "ainote-theme-storage",
      // 只持久化特定字段
      partialize: (state) => ({
        theme: state.theme,
        fontSize: state.fontSize,
        fontFamily: state.fontFamily,
        editorTheme: state.editorTheme,
        showLineNumbers: state.showLineNumbers,
        codeFolding: state.codeFolding,
        autoSave: state.autoSave,
        spellCheck: state.spellCheck,
      }),
    },
  ),
);

// 监听系统主题变化
if (typeof window !== "undefined") {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      // 主题设置为 auto 时，需要重新应用主题
      useThemeStore.getState().setTheme(useThemeStore.getState().theme);
    });
}

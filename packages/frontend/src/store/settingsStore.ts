import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppSettings } from "../types";

interface SettingsStore {
  settings: AppSettings;

  // Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  setTheme: (theme: "light" | "dark" | "auto") => void;
  setAutoSave: (enabled: boolean, interval?: number) => void;
  setFontSize: (size: number) => void;
  toggleSpellCheck: () => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  theme: "light",
  autoSave: true,
  autoSaveInterval: 30,
  fontSize: 14,
  showLineNumbers: false,
  spellCheck: true,
  syncEnabled: false,
  language: "zh-CN",
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      setTheme: (theme) => {
        set((state) => ({
          settings: { ...state.settings, theme },
        }));

        // 应用主题到DOM
        if (theme === "dark") {
          document.documentElement.setAttribute("data-theme", "dark");
        } else {
          document.documentElement.setAttribute("data-theme", "light");
        }
      },

      setAutoSave: (enabled, interval) => {
        set((state) => ({
          settings: {
            ...state.settings,
            autoSave: enabled,
            autoSaveInterval: interval ?? state.settings.autoSaveInterval,
          },
        }));
      },

      setFontSize: (size) => {
        set((state) => ({
          settings: { ...state.settings, fontSize: size },
        }));
      },

      toggleSpellCheck: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            spellCheck: !state.settings.spellCheck,
          },
        }));
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
      },
    }),
    {
      name: "ainote-settings",
    },
  ),
);

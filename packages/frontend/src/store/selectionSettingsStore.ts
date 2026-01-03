/**
 * 选择内容设置 Store
 * 管理用户的选择内容相关偏好设置
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SelectionSendMode = "text" | "json" | "hybrid";

export interface SelectionSettings {
  /** 发送模式：text-仅文本, json-完整JSON, hybrid-混合模式 */
  sendMode: SelectionSendMode;
  /** 最大节点数量限制 */
  maxNodes: number;
  /** 最大文本长度限制 */
  maxTextLength: number;
  /** 是否自动显示预览 */
  showPreview: boolean;
  /** 是否在发送时自动清除选择 */
  autoClearOnSend: boolean;

  // Actions
  setSendMode: (mode: SelectionSendMode) => void;
  setMaxNodes: (count: number) => void;
  setMaxTextLength: (length: number) => void;
  setShowPreview: (show: boolean) => void;
  setAutoClearOnSend: (auto: boolean) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: Omit<SelectionSettings, "setSendMode" | "setMaxNodes" | "setMaxTextLength" | "setShowPreview" | "setAutoClearOnSend" | "resetSettings"> =
  {
    sendMode: "text",
    maxNodes: 20,
    maxTextLength: 2000,
    showPreview: true,
    autoClearOnSend: true,
  };

export const useSelectionSettingsStore = create<SelectionSettings>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setSendMode: (mode) => set({ sendMode: mode }),
      setMaxNodes: (count) => set({ maxNodes: count }),
      setMaxTextLength: (length) => set({ maxTextLength: length }),
      setShowPreview: (show) => set({ showPreview: show }),
      setAutoClearOnSend: (auto) => set({ autoClearOnSend: auto }),

      resetSettings: () => set(DEFAULT_SETTINGS as any),
    }),
    {
      name: "selection-settings-storage",
      version: 1,
    },
  ),
);

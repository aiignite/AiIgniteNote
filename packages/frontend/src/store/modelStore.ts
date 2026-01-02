import { create } from "zustand";
import { ModelConfig, ModelUsageLog, ModelQuota } from "../types";
import { db } from "../db";

interface ModelStore {
  configs: ModelConfig[];
  currentConfig: ModelConfig | null;
  usageLogs: ModelUsageLog[];
  quota: ModelQuota | null;
  isLoading: boolean;

  // Actions
  loadConfigs: () => Promise<void>;
  loadUsageLogs: (modelId: string, limit?: number) => Promise<void>;
  createConfig: (config: Omit<ModelConfig, "id">) => Promise<ModelConfig>;
  updateConfig: (id: string, updates: Partial<ModelConfig>) => Promise<void>;
  deleteConfig: (id: string) => Promise<void>;
  setCurrentConfig: (config: ModelConfig | null) => void;
  getEnabledConfig: () => Promise<ModelConfig | undefined>;
  logUsage: (log: Omit<ModelUsageLog, "id" | "timestamp">) => Promise<void>;
  updateQuota: (quota: ModelQuota) => void;
  testConnection: (config: ModelConfig) => Promise<boolean>;
}

export const useModelStore = create<ModelStore>((set, get) => ({
  configs: [],
  currentConfig: null,
  usageLogs: [],
  quota: null,
  isLoading: false,

  loadConfigs: async () => {
    set({ isLoading: true });
    try {
      const configs = await db.modelConfigs.toArray();
      set({ configs, isLoading: false });

      // 自动加载启用的配置
      const enabledConfig = configs.find((c) => c.enabled);
      if (enabledConfig) {
        set({ currentConfig: enabledConfig });
      }
    } catch (error) {
      console.error("Failed to load model configs:", error);
      set({ isLoading: false });
    }
  },

  loadUsageLogs: async (modelId, limit = 100) => {
    try {
      const logs = await db.getUsageLogs(modelId, limit);
      set({ usageLogs: logs });
    } catch (error) {
      console.error("Failed to load usage logs:", error);
    }
  },

  createConfig: async (configData) => {
    try {
      const config = await db.createModelConfig(configData);
      set((state) => ({ configs: [...state.configs, config] }));
      return config;
    } catch (error) {
      console.error("Failed to create model config:", error);
      throw error;
    }
  },

  updateConfig: async (id, updates) => {
    try {
      await db.updateModelConfig(id, updates);
      set((state) => ({
        configs: state.configs.map((config) =>
          config.id === id ? { ...config, ...updates } : config,
        ),
        currentConfig:
          state.currentConfig?.id === id
            ? { ...state.currentConfig, ...updates }
            : state.currentConfig,
      }));
    } catch (error) {
      console.error("Failed to update model config:", error);
      throw error;
    }
  },

  deleteConfig: async (id) => {
    try {
      await db.modelConfigs.delete(id);
      set((state) => ({
        configs: state.configs.filter((config) => config.id !== id),
        currentConfig:
          state.currentConfig?.id === id ? null : state.currentConfig,
      }));
    } catch (error) {
      console.error("Failed to delete model config:", error);
      throw error;
    }
  },

  setCurrentConfig: (config) => {
    set({ currentConfig: config });
  },

  getEnabledConfig: async () => {
    try {
      const config = await db.getEnabledModelConfig();
      if (config) {
        set({ currentConfig: config });
      }
      return config;
    } catch (error) {
      console.error("Failed to get enabled config:", error);
      return undefined;
    }
  },

  logUsage: async (logData) => {
    try {
      await db.logUsage(logData);
      // 更新使用日志列表
      await get().loadUsageLogs(logData.modelId);
    } catch (error) {
      console.error("Failed to log usage:", error);
      throw error;
    }
  },

  updateQuota: (quota) => {
    set({ quota });
  },

  testConnection: async () => {
    try {
      // 这里会实际调用API测试连接
      // 暂时返回true
      return true;
    } catch (error) {
      console.error("Failed to test connection:", error);
      return false;
    }
  },
}));

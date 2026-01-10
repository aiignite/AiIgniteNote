import { create } from "zustand";
import { ModelConfig, ModelUsageLog, ModelQuota } from "../types";
import { db } from "../db";
import { modelsApi } from "../lib/api/models";

interface ModelStore {
  configs: ModelConfig[];
  currentConfig: ModelConfig | null;
  usageLogs: ModelUsageLog[];
  quota: ModelQuota | null;
  isLoading: boolean;
  isDetecting: boolean;
  detectedModels: string[];

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
  detectModels: (
    apiType: string,
    apiEndpoint: string,
    apiKey?: string,
  ) => Promise<string[]>;
  clearDetectedModels: () => void;
}

export const useModelStore = create<ModelStore>((set, get) => ({
  configs: [],
  currentConfig: null,
  usageLogs: [],
  quota: null,
  isLoading: false,
  isDetecting: false,
  detectedModels: [],

  loadConfigs: async () => {
    set({ isLoading: true });
    try {
      // 先从后端 API 获取最新的模型配置
      const response = await modelsApi.getConfigs();
      const remoteConfigs = response.data || [];

      // 同步到 IndexedDB
      for (const config of remoteConfigs) {
        const existing = await db.modelConfigs.get(config.id);
        if (existing) {
          // 更新现有配置（保留 apiKey 如果远程没有）
          await db.modelConfigs.update(config.id, {
            ...config,
            apiKey: existing.apiKey || "", // 保留本地存储的 apiKey
          });
        } else {
          // 创建新配置（apiKey 为空，需要用户在本地设置）
          await db.modelConfigs.add({
            ...config,
            apiKey: "",
          });
        }
      }

      // 删除本地不存在于远程的配置
      const localConfigs = await db.modelConfigs.toArray();
      const remoteIds = new Set(remoteConfigs.map((c: any) => c.id));
      for (const localConfig of localConfigs) {
        if (!remoteIds.has(localConfig.id)) {
          await db.modelConfigs.delete(localConfig.id);
        }
      }

      // 直接使用后端返回的配置（已过滤权限）
      set({ configs: remoteConfigs, isLoading: false });

      // 自动加载启用的配置
      const enabledConfig = remoteConfigs.find((c: any) => c.enabled);
      if (enabledConfig) {
        set({ currentConfig: enabledConfig });
      }
    } catch (error) {
      console.error("Failed to load model configs:", error);
      // 如果 API 调用失败，回退到只从 IndexedDB 加载
      try {
        const configs = await db.modelConfigs.toArray();
        set({ configs, isLoading: false });
      } catch (dbError) {
        console.error("Failed to load from IndexedDB:", dbError);
        set({ isLoading: false });
      }
    }
  },

  loadUsageLogs: async (modelId, limit = 100) => {
    try {
      // 先从后端 API 获取最新的使用日志
      const response = await modelsApi.getUsageLogs({
        modelId,
        limit,
      });

      const remoteLogs = response.data?.logs || [];

      // 转换为本地格式
      const logs: ModelUsageLog[] = remoteLogs.map((log: any) => ({
        id: log.id,
        modelId: log.modelId,
        modelName: log.modelName,
        success: log.success,
        inputTokens: log.inputTokens || 0,
        outputTokens: log.outputTokens || 0,
        totalTokens: log.totalTokens || 0,
        timestamp: new Date(log.createdAt).getTime(),
      }));

      set({ usageLogs: logs });
    } catch (error) {
      console.error("Failed to load usage logs from backend:", error);

      // 如果 API 调用失败，回退到 IndexedDB
      try {
        const localLogs = await db.getUsageLogs(modelId, limit);
        set({ usageLogs: localLogs });
      } catch (dbError) {
        console.error("Failed to load usage logs from IndexedDB:", dbError);
        set({ usageLogs: [] });
      }
    }
  },

  createConfig: async (configData) => {
    console.log("🔧 [modelStore] 开始创建配置:", configData);

    try {
      // 优先调用后端 API 创建
      console.log("📡 [modelStore] 调用后端 API...");
      const response = await modelsApi.createConfig({
        name: configData.name,
        description: configData.description,
        apiKey: configData.apiKey || "",
        apiEndpoint: configData.apiEndpoint,
        apiType: configData.apiType,
        model: configData.model,
        temperature: configData.temperature,
        maxTokens: configData.maxTokens,
        topP: configData.topP,
        isPublic: configData.isPublic ?? false,
      });

      console.log("✅ [modelStore] 后端 API 响应:", response);
      const newConfig = response.data;

      if (!newConfig || !newConfig.id) {
        throw new Error("后端返回的数据无效");
      }

      console.log("💾 [modelStore] 同步到 IndexedDB...");
      // 同步到 IndexedDB
      await db.modelConfigs.add({
        ...newConfig,
        isPublic: newConfig.isPublic ?? false,
        apiKey: configData.apiKey || "", // 使用用户输入的 apiKey
      });

      console.log("✅ [modelStore] IndexedDB 保存成功");

      // 更新状态
      set((state) => ({ configs: [...state.configs, newConfig] }));
      console.log("✅ [modelStore] 配置创建完成:", newConfig);
      return newConfig;
    } catch (error: any) {
      console.error("❌ [modelStore] 创建配置失败:", error);
      console.error("错误详情:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // 如果后端调用失败（可能是离线），回退到只存储到 IndexedDB
      try {
        console.log("📴 [modelStore] 回退到离线模式...");
        const config = await db.createModelConfig({
          ...configData,
          // 添加离线标记
        } as any);
        set((state) => ({ configs: [...state.configs, config] }));

        // 标记为待同步
        await db.modelConfigs.update(config.id, { _pendingSync: true });

        console.warn("⚠️ [modelStore] 配置已保存到本地 (待同步)");
        return config;
      } catch (dbError) {
        console.error("❌ [modelStore] IndexedDB 保存也失败:", dbError);
        throw error;
      }
    }
  },

  updateConfig: async (id, updates) => {
    try {
      // 检查是否有 apiKey 需要保留
      const existing = await db.modelConfigs.get(id);
      const updateData = {
        ...updates,
        ...(existing?.apiKey && { apiKey: existing.apiKey }),
      };

      // 优先调用后端 API 更新
      await modelsApi.updateConfig(id, updateData);

      // 同步到 IndexedDB
      await db.modelConfigs.update(id, updateData);

      // 更新状态
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

      // 如果后端调用失败，只更新 IndexedDB 并标记待同步
      try {
        await db.modelConfigs.update(id, { ...updates, _pendingSync: true });
        set((state) => ({
          configs: state.configs.map((config) =>
            config.id === id ? { ...config, ...updates } : config,
          ),
          currentConfig:
            state.currentConfig?.id === id
              ? { ...state.currentConfig, ...updates }
              : state.currentConfig,
        }));
        console.warn("Config updated locally (pending sync when online)");
      } catch (dbError) {
        console.error("Failed to update IndexedDB:", dbError);
        throw error;
      }
    }
  },

  deleteConfig: async (id) => {
    try {
      // 优先调用后端 API 删除
      await modelsApi.deleteConfig(id);

      // 从 IndexedDB 删除
      await db.modelConfigs.delete(id);

      // 更新状态
      set((state) => ({
        configs: state.configs.filter((config) => config.id !== id),
        currentConfig:
          state.currentConfig?.id === id ? null : state.currentConfig,
      }));
    } catch (error) {
      console.error("Failed to delete model config:", error);

      // 如果后端调用失败，只从 IndexedDB 删除并标记
      try {
        const existing = await db.modelConfigs.get(id);
        if (existing) {
          await db.modelConfigs.delete(id);
          // 保留记录但标记为已删除
          await db.modelConfigs.add({
            ...existing,
            _deleted: true,
            _pendingSync: true,
          } as any);
        }
        set((state) => ({
          configs: state.configs.filter((config) => config.id !== id),
          currentConfig:
            state.currentConfig?.id === id ? null : state.currentConfig,
        }));
        console.warn("Config deleted locally (pending sync when online)");
      } catch (dbError) {
        console.error("Failed to delete from IndexedDB:", dbError);
        throw error;
      }
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

  testConnection: async (config) => {
    try {
      // 调用后端 API 测试连接
      const response = await modelsApi.testConnectionConfig({
        apiType: config.apiType || "openai",
        apiEndpoint: config.apiEndpoint,
        apiKey: config.apiKey,
        model: config.model,
      });
      return response.data?.success || false;
    } catch (error) {
      console.error("Failed to test connection:", error);
      return false;
    }
  },

  detectModels: async (apiType, apiEndpoint, apiKey) => {
    set({ isDetecting: true, detectedModels: [] });
    try {
      const response = await modelsApi.detectModels({
        apiType,
        apiEndpoint,
        apiKey,
      });
      const models = response.data?.models || [];
      set({ detectedModels: models, isDetecting: false });
      return models;
    } catch (error: any) {
      console.error("Failed to detect models:", error);
      set({ isDetecting: false, detectedModels: [] });
      throw error;
    }
  },

  clearDetectedModels: () => {
    set({ detectedModels: [] });
  },
}));

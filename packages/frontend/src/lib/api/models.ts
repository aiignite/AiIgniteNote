import { apiClient } from "./client";

export const modelsApi = {
  // Model configs
  getConfigs: () => apiClient.get("/models/configs"),

  createConfig: (data: {
    name: string;
    description?: string;
    apiKey: string;
    apiEndpoint: string;
    apiType?: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    isPublic?: boolean;
  }) => apiClient.post("/models/configs", data),

  updateConfig: (
    id: string,
    data: {
      name?: string;
      description?: string;
      apiKey?: string;
      apiEndpoint?: string;
      apiType?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      enabled?: boolean;
      isDefault?: boolean;
      isPublic?: boolean;
    },
  ) => apiClient.put(`/models/configs/${id}`, data),

  deleteConfig: (id: string) => apiClient.delete(`/models/configs/${id}`),

  // Get single config with API key (for editing)
  getConfigWithKey: (id: string) => apiClient.get(`/models/configs/${id}`),

  // Detect local models
  detectModels: (params: {
    apiType: string;
    apiEndpoint: string;
    apiKey?: string;
  }) => apiClient.post("/models/configs/detect-models", params),

  // Test connection
  testConnectionConfig: (params: {
    apiType: string;
    apiEndpoint: string;
    apiKey?: string;
    model: string;
  }) => apiClient.post("/models/configs/test-connection", params),

  // Usage
  getUsage: (params?: {
    modelId?: string;
    startDate?: string;
    endDate?: string;
  }) => apiClient.get("/models/usage", { params }),

  getUsageLogs: (params?: {
    page?: number;
    limit?: number;
    modelId?: string;
  }) => apiClient.get("/models/usage/logs", { params }),
};

import { apiClient } from './client';

export const modelsApi = {
  // Model configs
  getConfigs: () =>
    apiClient.get('/models/configs'),

  createConfig: (data: {
    name: string;
    description?: string;
    apiKey: string;
    apiEndpoint: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  }) =>
    apiClient.post('/models/configs', data),

  updateConfig: (id: string, data: {
    name?: string;
    description?: string;
    apiKey?: string;
    apiEndpoint?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    enabled?: boolean;
    isDefault?: boolean;
  }) =>
    apiClient.put(`/models/configs/${id}`, data),

  deleteConfig: (id: string) =>
    apiClient.delete(`/models/configs/${id}`),

  // Usage
  getUsage: (params?: { modelId?: string; startDate?: string; endDate?: string }) =>
    apiClient.get('/models/usage', { params }),

  getUsageLogs: (params?: { page?: number; limit?: number; modelId?: string }) =>
    apiClient.get('/models/usage/logs', { params })
};

import { apiClient } from './client';

export const syncApi = {
  // Get sync status
  getStatus: () =>
    apiClient.get('/sync/status'),

  // Pull changes from server
  pull: (data: {
    lastSyncAt?: string;
    types?: ('notes' | 'categories' | 'aiAssistants')[];
  }) =>
    apiClient.post('/sync/pull', data),

  // Push local changes to server
  push: (data: {
    notes?: any[];
    categories?: any[];
    aiAssistants?: any[];
  }) =>
    apiClient.post('/sync/push', data),

  // Resolve conflict
  resolveConflict: (id: string, data: {
    type: 'note' | 'category';
    resolution: 'local' | 'server' | 'merge';
    data?: any;
  }) =>
    apiClient.post(`/sync/resolve/${id}`, data)
};

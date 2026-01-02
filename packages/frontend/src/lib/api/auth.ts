import { apiClient } from './client';

export const authApi = {
  // Register
  register: (data: { email: string; password: string; username?: string; displayName?: string }) =>
    apiClient.post('/auth/register', data),

  // Login
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),

  // Logout
  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),

  // Refresh token
  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),

  // Get current user
  getCurrentUser: () =>
    apiClient.get('/auth/me')
};

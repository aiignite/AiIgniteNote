import { apiClient } from "./client";

export interface User {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  requirePasswordChange: boolean;
  createdAt: string;
  _count?: {
    notes: number;
    categories: number;
    aiConversations: number;
  };
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const usersApi = {
  // Get all users
  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => apiClient.get("/users", { params }),

  // Get current user
  getMe: () => apiClient.get("/users/me"),

  // Update current user
  updateMe: (data: {
    displayName?: string;
    username?: string;
    avatar?: string;
    preferences?: any;
  }) => apiClient.put("/users/me", data),

  // Get current user stats
  getMeStats: () => apiClient.get("/users/me/stats"),

  // Get user by ID
  getUserById: (id: string) => apiClient.get(`/users/${id}`),

  // Update user by ID (admin)
  updateUser: (id: string, data: {
    username?: string;
    displayName?: string;
    avatar?: string;
    emailVerified?: boolean;
    requirePasswordChange?: boolean;
    preferences?: any;
  }) => apiClient.put(`/users/${id}`, data),

  // Delete user by ID (admin)
  deleteUser: (id: string) => apiClient.delete(`/users/${id}`),

  // Toggle user active status (admin)
  toggleUserActive: (id: string) => apiClient.patch(`/users/${id}/toggle-active`),

  // Reset user password (admin)
  resetPassword: (id: string, newPassword: string) =>
    apiClient.post(`/users/${id}/reset-password`, { newPassword }),

  // Create user (admin)
  createUser: (data: {
    email: string;
    password: string;
    username?: string;
    displayName: string;
    avatar?: string;
    emailVerified?: boolean;
  }) => apiClient.post("/users", data),
};

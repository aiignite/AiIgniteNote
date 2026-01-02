import { apiClient } from './client';

export const categoriesApi = {
  // Get categories
  getCategories: () =>
    apiClient.get('/categories'),

  // Create category
  createCategory: (data: {
    name: string;
    icon?: string;
    color?: string;
  }) =>
    apiClient.post('/categories', data),

  // Update category
  updateCategory: (id: string, data: {
    name?: string;
    icon?: string;
    color?: string;
    sortOrder?: number;
  }) =>
    apiClient.put(`/categories/${id}`, data),

  // Delete category
  deleteCategory: (id: string) =>
    apiClient.delete(`/categories/${id}`)
};

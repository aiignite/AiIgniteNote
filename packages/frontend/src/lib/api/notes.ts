import { apiClient } from "./client";

export const notesApi = {
  // Get notes list
  getNotes: (params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    tags?: string;
    isFavorite?: boolean;
  }) => apiClient.get("/notes", { params }),

  // Get note by id
  getNote: (id: string) => apiClient.get(`/notes/${id}`),

  // Create note
  createNote: (data: {
    title: string;
    content?: string;
    htmlContent?: string;
    fileType?: string;
    categoryId: string;
    tags?: string[];
    metadata?: any;
  }) => apiClient.post("/notes", data),

  // Update note
  updateNote: (
    id: string,
    data: {
      title?: string;
      content?: string;
      htmlContent?: string;
      fileType?: string;
      categoryId?: string;
      tags?: string[];
      metadata?: any;
      isFavorite?: boolean;
    },
  ) => apiClient.put(`/notes/${id}`, data),

  // Delete note (soft delete)
  deleteNote: (id: string) => apiClient.delete(`/notes/${id}`),

  // Restore note
  restoreNote: (id: string) => apiClient.patch(`/notes/${id}/restore`),

  // Get note versions
  getNoteVersions: (id: string) => apiClient.get(`/notes/${id}/versions`),

  // Batch sync notes
  syncNotes: (
    notes: Array<{
      id: string;
      title: string;
      content: string;
      htmlContent?: string;
      fileType: string;
      tags: string[];
      metadata?: any;
      isFavorite: boolean;
      categoryId: string;
      createdAt: number;
      updatedAt: number;
    }>,
  ) => apiClient.post("/notes/sync", { notes }),

  // Get deleted notes (recycle bin)
  getDeletedNotes: () => apiClient.get("/notes/deleted"),

  // Permanent delete note
  permanentDeleteNote: (id: string) => apiClient.delete(`/notes/deleted/${id}`),

  // Categories
  getCategories: () => apiClient.get("/categories"),

  createCategory: (data: {
    name: string;
    icon?: string;
    color?: string;
    sortOrder?: number;
  }) => apiClient.post("/categories", data),

  updateCategory: (
    id: string,
    data: {
      name?: string;
      icon?: string;
      color?: string;
      sortOrder?: number;
    },
  ) => apiClient.put(`/categories/${id}`, data),

  deleteCategory: (id: string) => apiClient.delete(`/categories/${id}`),
};

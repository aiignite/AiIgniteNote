import { apiClient } from "./client";

export interface Tag {
  id: string;
  name: string;
  color?: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  noteCount?: number;
}

export interface CreateTagData {
  name: string;
  color?: string;
}

export interface UpdateTagData {
  name?: string;
  color?: string;
}

export const tagsApi = {
  // 获取用户的所有标签
  getTags: async () => {
    const response = await apiClient.get("/tags");
    return response.data;
  },

  // 获取单个标签
  getTag: async (id: string) => {
    const response = await apiClient.get(`/tags/${id}`);
    return response.data;
  },

  // 创建标签
  createTag: async (data: CreateTagData) => {
    const response = await apiClient.post("/tags", data);
    return response.data;
  },

  // 更新标签
  updateTag: async (id: string, data: UpdateTagData) => {
    const response = await apiClient.put(`/tags/${id}`, data);
    return response.data;
  },

  // 删除标签
  deleteTag: async (id: string) => {
    const response = await apiClient.delete(`/tags/${id}`);
    return response.data;
  },

  // 为笔记设置标签
  setNoteTags: async (noteId: string, tagIds: string[]) => {
    const response = await apiClient.post(`/tags/notes/${noteId}`, { tagIds });
    return response.data;
  },

  // 获取笔记的标签
  getNoteTags: async (noteId: string) => {
    const response = await apiClient.get(`/tags/notes/${noteId}`);
    return response.data;
  },

  // 根据标签搜索笔记
  searchNotesByTags: async (tagIds: string[]) => {
    const response = await apiClient.post("/tags/search", { tagIds });
    return response.data;
  },
};

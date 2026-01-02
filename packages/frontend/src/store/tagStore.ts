import { create } from "zustand";
import { LocalTag } from "../types";
import { db } from "../db";
import { tagsApi } from "../lib/api/tags";

interface TagStore {
  tags: LocalTag[];
  isLoading: boolean;

  // Actions
  loadTags: () => Promise<void>;
  createTag: (tag: Omit<LocalTag, "id" | "createdAt" | "updatedAt">) => Promise<LocalTag>;
  updateTag: (id: string, updates: Partial<Omit<LocalTag, "id" | "createdAt" | "updatedAt">>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  getTagById: (id: string) => LocalTag | undefined;
  getTagsByNoteId: (noteId: string) => Promise<LocalTag[]>;
}

export const useTagStore = create<TagStore>((set, get) => ({
  tags: [],
  isLoading: false,

  loadTags: async () => {
    set({ isLoading: true });
    try {
      // 先从后端 API 获取最新的标签
      const response = await tagsApi.getTags();
      const remoteTags = response || [];

      // 同步到 IndexedDB
      for (const tag of remoteTags) {
        const existing = await db.tags.get(tag.id);
        if (existing) {
          await db.tags.update(tag.id, tag);
        } else {
          await db.tags.add({
            ...tag,
            createdAt: new Date(tag.createdAt).getTime(),
            updatedAt: new Date(tag.updatedAt).getTime(),
          });
        }
      }

      // 删除本地不存在于远程的标签
      const localTags = await db.tags.toArray();
      const remoteIds = new Set(remoteTags.map((t: any) => t.id));
      for (const localTag of localTags) {
        if (!remoteIds.has(localTag.id)) {
          await db.tags.delete(localTag.id);
        }
      }

      // 从 IndexedDB 加载标签
      const tags = await db.tags.toArray();
      set({ tags, isLoading: false });
    } catch (error) {
      console.error("Failed to load tags:", error);
      // 如果 API 调用失败，回退到只从 IndexedDB 加载
      try {
        const tags = await db.tags.toArray();
        set({ tags, isLoading: false });
      } catch (dbError) {
        console.error("Failed to load tags from IndexedDB:", dbError);
        set({ tags: [], isLoading: false });
      }
    }
  },

  createTag: async (tagData) => {
    try {
      // 先创建到后端
      const response = await tagsApi.createTag({
        name: tagData.name,
        color: tagData.color,
      });

      const newTag: LocalTag = {
        id: response.id,
        name: response.name,
        color: response.color,
        createdAt: new Date(response.createdAt).getTime(),
        updatedAt: new Date(response.updatedAt).getTime(),
      };

      // 保存到 IndexedDB
      await db.tags.add(newTag);

      // 更新状态
      set((state) => ({
        tags: [...state.tags, newTag],
      }));

      return newTag;
    } catch (error) {
      console.error("Failed to create tag:", error);
      throw error;
    }
  },

  updateTag: async (id, updates) => {
    try {
      // 更新后端
      await tagsApi.updateTag(id, updates);

      // 更新 IndexedDB
      await db.tags.update(id, updates);

      // 更新状态
      set((state) => ({
        tags: state.tags.map((tag) =>
          tag.id === id ? { ...tag, ...updates, updatedAt: Date.now() } : tag
        ),
      }));
    } catch (error) {
      console.error("Failed to update tag:", error);
      throw error;
    }
  },

  deleteTag: async (id) => {
    try {
      // 删除后端
      await tagsApi.deleteTag(id);

      // 删除 IndexedDB
      await db.tags.delete(id);

      // 更新状态
      set((state) => ({
        tags: state.tags.filter((tag) => tag.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete tag:", error);
      throw error;
    }
  },

  getTagById: (id) => {
    return get().tags.find((tag) => tag.id === id);
  },

  getTagsByNoteId: async (noteId: string) => {
    try {
      const response = await tagsApi.getNoteTags(noteId);
      return response.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        createdAt: new Date(tag.createdAt).getTime(),
        updatedAt: new Date(tag.updatedAt).getTime(),
      }));
    } catch (error) {
      console.error("Failed to get note tags:", error);
      return [];
    }
  },
}));

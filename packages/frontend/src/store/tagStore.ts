import { create } from "zustand";
import { LocalTag } from "../types";
import { db } from "../db";
import { tagsApi } from "../lib/api/tags";

interface TagStore {
  tags: LocalTag[];
  isLoading: boolean;
  isOnline: boolean;

  // Actions
  loadTags: () => Promise<void>;
  createTag: (
    tag: Omit<LocalTag, "id" | "createdAt" | "updatedAt">,
  ) => Promise<LocalTag>;
  updateTag: (
    id: string,
    updates: Partial<Omit<LocalTag, "id" | "createdAt" | "updatedAt">>,
  ) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  getTagById: (id: string) => LocalTag | undefined;
  getTagsByNoteId: (noteId: string) => Promise<LocalTag[]>;
  checkOnlineStatus: () => void;
  syncPendingTags: () => Promise<void>;
}

export const useTagStore = create<TagStore>((set, get) => ({
  tags: [],
  isLoading: false,
  isOnline: navigator.onLine,

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
      const { isOnline } = get();

      if (isOnline) {
        // 在线状态：优先调用后端 API 创建
        try {
          const response = await tagsApi.createTag({
            name: tagData.name,
            color: tagData.color,
            isPublic: tagData.isPublic ?? false,
          });

          const newTag: LocalTag = {
            id: response.id,
            name: response.name,
            color: response.color,
            isPublic: response.isPublic ?? false,
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
        } catch (apiError) {
          console.warn(
            "Failed to create tag on backend, using local only:",
            apiError,
          );
          // 后端调用失败，回退到只存储到 IndexedDB
        }
      }

      // 离线状态或后端失败：只保存到 IndexedDB
      const id = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();
      const newTag: LocalTag = {
        id,
        name: tagData.name,
        color: tagData.color,
        createdAt: now,
        updatedAt: now,
      };

      await db.tags.add({ ...newTag, _pendingSync: true } as any);

      // 更新状态
      set((state) => ({
        tags: [...state.tags, newTag],
      }));

      console.warn("Tag saved locally (pending sync when online)");
      return newTag;
    } catch (error) {
      console.error("Failed to create tag:", error);
      throw error;
    }
  },

  updateTag: async (id, updates) => {
    try {
      const { isOnline } = get();

      if (isOnline) {
        // 在线状态：优先调用后端 API 更新
        try {
          await tagsApi.updateTag(id, updates);
          // 更新 IndexedDB
          await db.tags.update(id, { ...updates, updatedAt: Date.now() });
        } catch (apiError) {
          console.warn(
            "Failed to update tag on backend, updating local only:",
            apiError,
          );
          // 后端调用失败，只更新 IndexedDB 并标记待同步
          await db.tags.update(id, {
            ...updates,
            updatedAt: Date.now(),
            _pendingSync: true,
          } as any);
        }
      } else {
        // 离线状态：只更新 IndexedDB 并标记待同步
        await db.tags.update(id, {
          ...updates,
          updatedAt: Date.now(),
          _pendingSync: true,
        } as any);
        console.warn("Tag updated locally (pending sync when online)");
      }

      // 更新状态
      set((state) => ({
        tags: state.tags.map((tag) =>
          tag.id === id ? { ...tag, ...updates, updatedAt: Date.now() } : tag,
        ),
      }));
    } catch (error) {
      console.error("Failed to update tag:", error);
      throw error;
    }
  },

  deleteTag: async (id) => {
    try {
      const { isOnline } = get();

      if (isOnline) {
        // 在线状态：优先调用后端 API 删除
        try {
          await tagsApi.deleteTag(id);
          // 从 IndexedDB 删除
          await db.tags.delete(id);
        } catch (apiError) {
          console.warn(
            "Failed to delete tag on backend, deleting local only:",
            apiError,
          );
          // 后端调用失败，只从 IndexedDB 删除并标记
          const existing = await db.tags.get(id);
          if (existing) {
            await db.tags.delete(id);
            await db.tags.add({
              ...existing,
              _deleted: true,
              _pendingSync: true,
            } as any);
          }
        }
      } else {
        // 离线状态：只从 IndexedDB 删除并标记
        const existing = await db.tags.get(id);
        if (existing) {
          await db.tags.delete(id);
          await db.tags.add({
            ...existing,
            _deleted: true,
            _pendingSync: true,
          } as any);
        }
        console.warn("Tag deleted locally (pending sync when online)");
      }

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

  checkOnlineStatus: () => {
    set({ isOnline: navigator.onLine });
  },

  // 同步待处理的标签到服务器
  syncPendingTags: async () => {
    const { isOnline } = get();
    if (!isOnline) {
      console.log("Offline, skipping tag sync");
      return;
    }

    try {
      // 获取所有待同步的标签（包括已删除的）
      const pendingTags = await db.tags
        .filter((tag) => (tag as any)._pendingSync)
        .toArray();

      console.log(`Found ${pendingTags.length} pending tags to sync`);

      for (const tag of pendingTags) {
        try {
          const isDeleted = (tag as any)._deleted;

          if (isDeleted) {
            // 同步删除操作
            try {
              await tagsApi.deleteTag(tag.id);
              // 从 IndexedDB 中完全移除
              await db.tags.delete(tag.id);
              console.log(`Synced deleted tag: ${tag.id}`);
            } catch (apiError) {
              console.error(
                `Failed to sync delete for tag ${tag.id}:`,
                apiError,
              );
            }
          } else {
            // 同步创建或更新操作
            // 先尝试更新
            try {
              await tagsApi.updateTag(tag.id, {
                name: tag.name,
                color: tag.color,
              });
              // 清除待同步标记
              await db.tags.update(tag.id, { _pendingSync: undefined } as any);
              console.log(`Synced updated tag: ${tag.id}`);
            } catch (updateError) {
              // 如果更新失败，可能是新创建的标签，尝试创建
              try {
                const response = await tagsApi.createTag({
                  name: tag.name,
                  color: tag.color,
                });
                // 更新本地 ID 为服务器返回的 ID
                const oldId = tag.id;
                await db.tags.delete(oldId);
                await db.tags.add({
                  id: response.id,
                  name: response.name,
                  color: response.color,
                  createdAt: new Date(response.createdAt).getTime(),
                  updatedAt: new Date(response.updatedAt).getTime(),
                });
                console.log(`Synced new tag: ${oldId} -> ${response.id}`);
              } catch (createError) {
                console.error(`Failed to sync tag ${tag.id}:`, createError);
              }
            }
          }
        } catch (error) {
          console.error(`Error syncing tag ${tag.id}:`, error);
        }
      }

      // 重新加载标签列表
      await get().loadTags();
    } catch (error) {
      console.error("Failed to sync pending tags:", error);
    }
  },
}));

// 监听在线状态变化
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    useTagStore.getState().checkOnlineStatus();
    // 连接恢复时自动同步
    useTagStore.getState().syncPendingTags();
  });

  window.addEventListener("offline", () => {
    useTagStore.getState().checkOnlineStatus();
  });
}

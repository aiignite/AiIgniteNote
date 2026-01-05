import { create } from "zustand";
import { LocalNote, LocalCategory, SearchFilter } from "../types/index";
import { db } from "../db";
import { notesApi } from "../lib/api/notes";

// 同步状态
export type SyncStatus = "idle" | "syncing" | "success" | "error";

interface NoteStore {
  notes: LocalNote[];
  currentNote: LocalNote | null;
  categories: LocalCategory[];
  isLoading: boolean;
  searchFilter: SearchFilter;
  isOnline: boolean;
  syncStatus: SyncStatus;
  lastSyncTime: number | null;
  lastUsedFileType: string; // 记住用户最后使用的文件类型

  // Actions
  loadNotes: () => Promise<void>;
  loadCategories: () => Promise<void>;
  createNote: (
    note: Omit<LocalNote, "id" | "createdAt" | "updatedAt" | "version">,
  ) => Promise<LocalNote>;
  updateNote: (id: string, updates: Partial<LocalNote>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  setCurrentNote: (note: LocalNote | null) => void;
  setLastUsedFileType: (fileType: string) => void; // 新增：设置最后使用的文件类型
  searchNotes: (keyword: string) => Promise<void>;
  setSearchFilter: (filter: SearchFilter) => void;
  toggleFavorite: (id: string) => Promise<void>;
  getNotesByCategory: (categoryId: string) => Promise<LocalNote[]>;
  getNotesByTag: (tag: string) => Promise<LocalNote[]>;
  getNotesByTagId: (tagId: string) => Promise<LocalNote[]>;
  getFavoriteNotes: () => Promise<LocalNote[]>;
  getDeletedNotes: () => Promise<LocalNote[]>;
  createCategory: (
    category: Omit<LocalCategory, "id" | "createdAt">,
  ) => Promise<LocalCategory>;
  updateCategory: (
    id: string,
    updates: Partial<LocalCategory>,
  ) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // 同步相关
  checkOnlineStatus: () => void;
  syncAllNotes: () => Promise<void>;
  syncToServer: (note: LocalNote) => Promise<boolean>;
  syncPendingNotes: () => Promise<void>;
  syncPendingCategories: () => Promise<void>;
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  currentNote: null,
  categories: [],
  isLoading: false,
  searchFilter: {},
  isOnline: navigator.onLine,
  syncStatus: "idle" as SyncStatus,
  lastSyncTime: null,
  lastUsedFileType: localStorage.getItem("lastUsedFileType") || "markdown", // 从 localStorage 读取，默认为 markdown

  // 检查在线状态
  checkOnlineStatus: () => {
    const wasOffline = !get().isOnline;
    set({ isOnline: navigator.onLine });

    // 如果从离线变为在线，自动重试同步待同步的笔记
    if (wasOffline && navigator.onLine) {
      console.log("[noteStore] 网络已恢复，开始同步待同步的笔记");
      get().syncPendingNotes();
    }
  },

  loadNotes: async () => {
    set({ isLoading: true });
    try {
      const { isOnline } = get();

      if (isOnline) {
        // 在线状态：从后端API获取最新数据
        try {
          const response = await notesApi.getNotes();
          const remoteNotes = response.data.notes || [];

          // 同步到 IndexedDB
          for (const note of remoteNotes) {
            const existing = await db.notes.get(note.id);
            const localNote = {
              id: note.id,
              title: note.title,
              content: note.content,
              htmlContent: note.htmlContent,
              tags: note.tags || [],
              category: note.categoryId || note.category?.id || "",
              isDeleted: note.isDeleted || false,
              isFavorite: note.isFavorite || false,
              createdAt: new Date(note.createdAt).getTime(),
              updatedAt: new Date(note.updatedAt).getTime(),
              version: note.version || 1,
              fileType: note.fileType || "markdown",
              metadata: note.metadata,
            };

            if (existing) {
              // 只更新远程更新时间更新的笔记
              if (localNote.updatedAt > existing.updatedAt) {
                await db.notes.put(localNote);
              }
            } else {
              // 新笔记，添加到本地
              await db.notes.put(localNote);
            }
          }

          // 从 IndexedDB 加载所有笔记
          const notes = await db.notes
            .filter((note) => !note.isDeleted)
            .reverse()
            .sortBy("updatedAt");

          set({ notes, isLoading: false });
          return;
        } catch (apiError) {
          console.warn(
            "Failed to load from backend, using local cache:",
            apiError,
          );
          // API调用失败，回退到本地数据
        }
      }

      // 离线状态或API失败：从 IndexedDB 加载
      const notes = await db.notes
        .filter((note) => !note.isDeleted)
        .reverse()
        .sortBy("updatedAt");
      set({ notes, isLoading: false });
    } catch (error) {
      console.error("Failed to load notes:", error);
      set({ notes: [], isLoading: false });
    }
  },

  loadCategories: async () => {
    try {
      const { isOnline } = get();

      if (isOnline) {
        // 在线状态：从后端API获取最新数据（PostgreSQL 为准）
        try {
          const response = await notesApi.getCategories();
          const remoteCategories = response.data || [];

          // 清空 IndexedDB 中的所有分类
          await db.categories.clear();

          // 将后端分类同步到 IndexedDB 和 store
          const syncedCategories = await Promise.all(
            remoteCategories.map(async (category) => {
              const localCategory = {
                id: category.id,
                name: category.name,
                icon: category.icon,
                color: category.color,
                sortOrder: category.sortOrder,
                createdAt: new Date(category.createdAt).getTime(),
                _synced: true, // 标记为已同步
              };
              await db.categories.put(localCategory);
              return localCategory;
            }),
          );

          set({ categories: syncedCategories });
          console.log(
            `[loadCategories] 已从 PostgreSQL 同步 ${remoteCategories.length} 个分类`,
          );
          return;
        } catch (apiError) {
          console.error("Failed to load categories from backend:", apiError);
          throw apiError;
        }
      }

      // 离线状态：从 IndexedDB 加载
      const categories = await db.categories.toArray();
      set({ categories });
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  },

  createNote: async (noteData) => {
    try {
      // 先保存到本地 IndexedDB
      const localNote = await db.createNote(noteData);

      // 如果在线，尝试同步到后端
      const { isOnline } = get();
      if (isOnline) {
        try {
          const requestData = {
            title: noteData.title,
            content: noteData.content,
            htmlContent: noteData.htmlContent,
            fileType: noteData.fileType,
            categoryId: noteData.category,
            tags: noteData.tags,
            metadata: noteData.metadata,
            isPublic: noteData.isPublic ?? false,
          };

          console.log(
            "[createNote] 准备发送的数据:",
            JSON.stringify(requestData, null, 2),
          );

          const response = await notesApi.createNote(requestData);

          // 更新本地笔记的 ID 为后端返回的 ID
          const syncedNote = {
            ...localNote,
            id: response.data.id,
            synced: true,
            pendingSync: false,
            needsServerId: false,
          };
          await db.notes.put(syncedNote);
          set((state) => ({ notes: [syncedNote, ...state.notes] }));
          return syncedNote;
        } catch (apiError: any) {
          console.warn("[createNote] 同步到后端失败，标记为待同步:", apiError);

          // 详细的错误日志
          if (apiError.response) {
            console.error("[createNote] 后端返回错误:", {
              status: apiError.response.status,
              data: apiError.response.data,
              request: {
                url: apiError.config?.url,
                method: apiError.config?.method,
                data: apiError.config?.data,
              },
            });
          }

          // 标记为需要服务器 ID，后续会通过 sync API 创建
          const pendingNote = {
            ...localNote,
            synced: false,
            pendingSync: true,
            needsServerId: true, // 标记需要在服务器创建新记录
            lastSyncError:
              apiError.response?.data?.error?.message ||
              apiError.response?.data?.message ||
              (apiError instanceof Error ? apiError.message : String(apiError)),
          };
          await db.notes.put(pendingNote);
          set((state) => ({ notes: [pendingNote, ...state.notes] }));
          return pendingNote;
        }
      } else {
        // 离线状态，标记为待同步
        const pendingNote = {
          ...localNote,
          synced: false,
          pendingSync: true,
          needsServerId: true,
        };
        await db.notes.put(pendingNote);
        set((state) => ({ notes: [pendingNote, ...state.notes] }));
        return pendingNote;
      }
    } catch (error) {
      console.error("Failed to create note:", error);
      throw error;
    }
  },

  updateNote: async (id, updates) => {
    try {
      const updatedAt = Date.now();
      const updateData = { ...updates, updatedAt };

      // 获取当前笔记信息，检查是否需要服务器 ID
      const currentNote = await db.notes.get(id);
      if (!currentNote) {
        throw new Error("笔记不存在");
      }

      // 先更新本地 IndexedDB
      await db.updateNote(id, {
        ...updateData,
        synced: false, // 标记为未同步
        pendingSync: true, // 标记为待同步
        lastSyncError: undefined, // 清除之前的错误
      });

      // 如果在线，尝试同步到后端
      const { isOnline } = get();
      if (isOnline) {
        try {
          // 如果笔记标记为需要服务器 ID，则创建新记录而非更新
          if (currentNote.needsServerId) {
            console.log(`[updateNote] 笔记 ${id} 需要服务器 ID，将创建新记录`);

            const requestData = {
              title: updates.title || currentNote.title,
              content: updates.content ?? currentNote.content,
              htmlContent: updates.htmlContent ?? currentNote.htmlContent,
              fileType: currentNote.fileType,
              categoryId: updates.category || currentNote.category,
              tags: updates.tags || currentNote.tags,
              metadata: updates.metadata || currentNote.metadata,
              isPublic: updates.isPublic ?? currentNote.isPublic ?? false,
            };

            console.log(
              "[updateNote] 准备发送的数据:",
              JSON.stringify(requestData, null, 2),
            );

            const response = await notesApi.createNote(requestData);

            // 更新本地笔记的 ID 为后端返回的 ID
            const syncedNote = {
              ...currentNote,
              ...updateData,
              id: response.data.id,
              synced: true,
              pendingSync: false,
              needsServerId: false,
              lastSyncError: undefined,
            };
            await db.notes.put(syncedNote);
            await db.notes.delete(id); // 删除旧的临时 ID 记录

            // 更新状态
            set((state) => ({
              notes: state.notes
                .filter((n) => n.id !== id) // 移除旧 ID
                .concat(syncedNote), // 添加新 ID
              currentNote:
                state.currentNote?.id === id ? syncedNote : state.currentNote,
            }));
            return;
          }

          // 正常更新流程
          await notesApi.updateNote(id, {
            title: updates.title,
            content: updates.content,
            htmlContent: updates.htmlContent,
            fileType: updates.fileType,
            categoryId: updates.category,
            tags: updates.tags,
            metadata: updates.metadata,
            isFavorite: updates.isFavorite,
            isPublic: updates.isPublic,
          });

          // 同步成功，更新本地状态
          await db.updateNote(id, {
            synced: true,
            pendingSync: false,
            lastSyncError: undefined,
          });
        } catch (apiError: any) {
          // 特殊处理 404 错误：笔记在服务器上不存在，需要创建
          if (apiError.response?.status === 404) {
            console.warn(
              `[updateNote] 笔记 ${id} 在服务器上不存在 (404)，降级为创建操作`,
            );

            try {
              const requestData = {
                title: updates.title || currentNote.title,
                content: updates.content ?? currentNote.content,
                htmlContent: updates.htmlContent ?? currentNote.htmlContent,
                fileType: currentNote.fileType,
                categoryId: updates.category || currentNote.category,
                tags: updates.tags || currentNote.tags,
                metadata: updates.metadata || currentNote.metadata,
              };

              const response = await notesApi.createNote(requestData);

              // 更新本地笔记的 ID 为后端返回的 ID
              const syncedNote = {
                ...currentNote,
                ...updateData,
                id: response.data.id,
                synced: true,
                pendingSync: false,
                needsServerId: false,
                lastSyncError: undefined,
              };
              await db.notes.put(syncedNote);
              await db.notes.delete(id); // 删除旧 ID 记录

              // 更新 store 状态
              set((state) => ({
                notes: state.notes
                  .filter((n) => n.id !== id)
                  .concat(syncedNote),
                currentNote:
                  state.currentNote?.id === id ? syncedNote : state.currentNote,
              }));

              console.log(
                `[updateNote] ✅ 成功创建笔记: ${id} -> ${response.data.id}`,
              );
              return; // 提前返回，不执行后续的 set 操作
            } catch (createError) {
              console.error("[updateNote] 创建笔记失败:", createError);
              await db.updateNote(id, {
                lastSyncError:
                  createError instanceof Error
                    ? createError.message
                    : String(createError),
              });
              return; // 提前返回
            }
          }

          console.warn("[updateNote] 同步到后端失败，标记为待同步:", apiError);
          // 保持 pendingSync: true 状态，以便后续重试
          await db.updateNote(id, {
            lastSyncError:
              apiError instanceof Error ? apiError.message : String(apiError),
          });
        }
      }

      set((state) => ({
        notes: state.notes.map((note) =>
          note.id === id
            ? { ...note, ...updateData, synced: false, pendingSync: true }
            : note,
        ),
        currentNote:
          state.currentNote?.id === id
            ? {
                ...state.currentNote,
                ...updateData,
                synced: false,
                pendingSync: true,
              }
            : state.currentNote,
      }));
    } catch (error) {
      console.error("Failed to update note:", error);
      throw error;
    }
  },

  deleteNote: async (id) => {
    try {
      // 先删除本地 IndexedDB（软删除）
      await db.deleteNote(id);

      // 如果在线，尝试同步到后端
      const { isOnline } = get();
      if (isOnline) {
        try {
          await notesApi.deleteNote(id);
        } catch (apiError) {
          console.warn("Failed to sync delete to backend:", apiError);
        }
      }

      set((state) => ({
        notes: state.notes.filter((note) => note.id !== id),
        currentNote: state.currentNote?.id === id ? null : state.currentNote,
      }));
    } catch (error) {
      console.error("Failed to delete note:", error);
      throw error;
    }
  },

  restoreNote: async (id) => {
    try {
      await db.restoreNote(id);

      const { isOnline } = get();
      if (isOnline) {
        try {
          await notesApi.restoreNote(id);
        } catch (apiError) {
          console.warn("Failed to sync restore to backend:", apiError);
        }
      }

      await get().loadNotes();
    } catch (error) {
      console.error("Failed to restore note:", error);
      throw error;
    }
  },

  setCurrentNote: (note) => {
    set({ currentNote: note });
  },

  setLastUsedFileType: (fileType: string) => {
    set({ lastUsedFileType: fileType });
    // 保存到 localStorage 以便刷新后保持
    localStorage.setItem("lastUsedFileType", fileType);
  },

  searchNotes: async (keyword) => {
    set({ isLoading: true });
    try {
      const notes = await db.searchNotes(keyword);
      set({ notes, isLoading: false });
    } catch (error) {
      console.error("Failed to search notes:", error);
      set({ isLoading: false });
    }
  },

  setSearchFilter: (filter) => {
    set({ searchFilter: filter });
  },

  toggleFavorite: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (note) {
      await get().updateNote(id, { isFavorite: !note.isFavorite });
    }
  },

  getNotesByCategory: async (categoryId) => {
    try {
      return await db.getNotesByCategory(categoryId);
    } catch (error) {
      console.error("Failed to get notes by category:", error);
      return [];
    }
  },

  getNotesByTag: async (tag) => {
    try {
      return await db.getNotesByTag(tag);
    } catch (error) {
      console.error("Failed to get notes by tag:", error);
      return [];
    }
  },

  getNotesByTagId: async (tagId) => {
    try {
      return await db.getNotesByTagId(tagId);
    } catch (error) {
      console.error("Failed to get notes by tag ID:", error);
      return [];
    }
  },

  getFavoriteNotes: async () => {
    try {
      return await db.getFavoriteNotes();
    } catch (error) {
      console.error("Failed to get favorite notes:", error);
      return [];
    }
  },

  getDeletedNotes: async () => {
    try {
      return await db.getDeletedNotes();
    } catch (error) {
      console.error("Failed to get deleted notes:", error);
      return [];
    }
  },

  createCategory: async (categoryData) => {
    try {
      const { isOnline } = get();

      if (isOnline) {
        // 在线状态：必须先调用后端 API 创建（PostgreSQL 为准）
        try {
          const response = await notesApi.createCategory({
            name: categoryData.name,
            icon: categoryData.icon,
            color: categoryData.color,
            sortOrder: categoryData.sortOrder,
            isPublic: categoryData.isPublic ?? false,
          });

          const newCategory: LocalCategory = {
            id: response.data.id,
            name: response.data.name,
            icon: response.data.icon,
            color: response.data.color,
            sortOrder: response.data.sortOrder,
            isPublic: response.data.isPublic ?? false,
            createdAt: new Date(response.data.createdAt).getTime(),
            _synced: true, // 标记为已同步
          };

          // 同步到 IndexedDB
          await db.categories.add(newCategory as any);

          // 更新状态
          set((state) => ({ categories: [...state.categories, newCategory] }));
          console.log(
            "[createCategory] 已在 PostgreSQL 创建分类:",
            newCategory.name,
          );
          return newCategory;
        } catch (apiError) {
          console.error("[createCategory] 后端创建失败:", apiError);
          throw new Error("创建分类失败，请检查网络连接");
        }
      } else {
        // 离线状态：提示用户
        throw new Error("离线状态下无法创建分类，请连接网络后重试");
      }
    } catch (error) {
      console.error("Failed to create category:", error);
      throw error;
    }
  },

  updateCategory: async (id, updates) => {
    try {
      const { isOnline, categories } = get();

      // 检查分类是否已同步到后端（有 _synced 标记）
      const category = categories.find((c) => c.id === id);
      if (!category) {
        throw new Error("分类不存在");
      }

      const isSynced = (category as any)._synced === true;

      if (!isSynced) {
        throw new Error("只能修改已同步到服务器的分类");
      }

      if (isOnline) {
        // 在线状态：必须先调用后端 API 更新（PostgreSQL 为准）
        try {
          await notesApi.updateCategory(id, updates);
          // 同步到 IndexedDB
          await db.updateCategory(id, updates);
          console.log(
            "[updateCategory] 已在 PostgreSQL 更新分类:",
            updates.name,
          );
        } catch (apiError) {
          console.error("[updateCategory] 后端更新失败:", apiError);
          throw new Error("更新分类失败，请检查网络连接");
        }
      } else {
        // 离线状态：提示用户
        throw new Error("离线状态下无法更新分类，请连接网络后重试");
      }

      set((state) => ({
        categories: state.categories.map((cat) =>
          cat.id === id ? { ...cat, ...updates } : cat,
        ),
      }));
    } catch (error) {
      console.error("Failed to update category:", error);
      throw error;
    }
  },

  deleteCategory: async (id) => {
    try {
      const { isOnline, categories } = get();

      // 检查分类是否已同步到后端（有 _synced 标记）
      const category = categories.find((c) => c.id === id);
      if (!category) {
        throw new Error("分类不存在");
      }

      const isSynced = (category as any)._synced === true;

      if (!isSynced) {
        throw new Error("只能删除已同步到服务器的分类");
      }

      if (isOnline) {
        // 在线状态：必须先调用后端 API 删除（PostgreSQL 为准）
        try {
          await notesApi.deleteCategory(id);
          // 从 IndexedDB 删除
          await db.deleteCategory(id);
          console.log(
            "[deleteCategory] 已在 PostgreSQL 删除分类:",
            category.name,
          );
        } catch (apiError) {
          console.error("[deleteCategory] 后端删除失败:", apiError);
          throw new Error("删除分类失败，请检查网络连接");
        }
      } else {
        // 离线状态：提示用户
        throw new Error("离线状态下无法删除分类，请连接网络后重试");
      }

      set((state) => ({
        categories: state.categories.filter((cat) => cat.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete category:", error);
      throw error;
    }
  },

  // 同步单个笔记到服务器
  syncToServer: async (note: LocalNote) => {
    try {
      await notesApi.updateNote(note.id, {
        title: note.title,
        content: note.content,
        htmlContent: note.htmlContent,
        fileType: note.fileType,
        categoryId: note.category,
        tags: note.tags,
        metadata: note.metadata,
        isFavorite: note.isFavorite,
      });
      return true;
    } catch (error) {
      console.error("Failed to sync note to server:", error);
      return false;
    }
  },

  // 批量同步所有笔记到服务器
  syncAllNotes: async () => {
    const { isOnline, notes } = get();
    if (!isOnline) {
      set({ syncStatus: "error" as SyncStatus });
      return;
    }

    set({ syncStatus: "syncing" as SyncStatus });

    try {
      // 获取本地所有需要同步的笔记
      const localNotes = notes.filter((n) => !n.isDeleted);

      if (localNotes.length === 0) {
        set({ syncStatus: "success" as SyncStatus, lastSyncTime: Date.now() });
        return;
      }

      // 批量同步
      const result = await notesApi.syncNotes(
        localNotes.map((note) => ({
          id: note.id,
          title: note.title,
          content: note.content,
          htmlContent: note.htmlContent,
          fileType: note.fileType,
          tags: note.tags || [],
          metadata: note.metadata || null,
          isFavorite: note.isFavorite || false,
          categoryId: note.category,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        })),
      );

      console.log("Sync result:", result);

      set({ syncStatus: "success" as SyncStatus, lastSyncTime: Date.now() });

      // 3秒后重置状态
      setTimeout(() => {
        set((state) =>
          state.syncStatus === "success"
            ? { syncStatus: "idle" as SyncStatus }
            : {},
        );
      }, 3000);
    } catch (error) {
      console.error("Failed to sync notes:", error);
      set({ syncStatus: "error" as SyncStatus });

      setTimeout(() => {
        set((state) =>
          state.syncStatus === "error"
            ? { syncStatus: "idle" as SyncStatus }
            : {},
        );
      }, 3000);
    }
  },

  // 同步待处理的笔记到服务器
  syncPendingNotes: async () => {
    const { isOnline } = get();
    if (!isOnline) {
      console.log("[syncPendingNotes] 离线状态，跳过同步");
      return;
    }

    try {
      console.log("[syncPendingNotes] 开始同步待处理的笔记");

      // 获取所有待同步的笔记
      const pendingNotes = await db.notes
        .filter((note) => note.pendingSync)
        .toArray();

      console.log(
        `[syncPendingNotes] 找到 ${pendingNotes.length} 个待同步笔记`,
      );

      let successCount = 0;
      let failCount = 0;

      for (const note of pendingNotes) {
        try {
          if (note.needsServerId) {
            // 需要在服务器创建新记录
            console.log(`[syncPendingNotes] 创建新笔记: ${note.id}`);
            const response = await notesApi.createNote({
              title: note.title,
              content: note.content,
              htmlContent: note.htmlContent,
              fileType: note.fileType,
              categoryId: note.category,
              tags: note.tags,
              metadata: note.metadata,
            });

            // 更新本地笔记的 ID 和状态
            const syncedNote = {
              ...note,
              id: response.data.id,
              synced: true,
              pendingSync: false,
              needsServerId: false,
              lastSyncError: undefined,
            };
            await db.notes.put(syncedNote);
            await db.notes.delete(note.id); // 删除旧 ID 记录

            // 更新 store 状态
            set((state) => ({
              notes: state.notes
                .filter((n) => n.id !== note.id)
                .concat(syncedNote),
              currentNote:
                state.currentNote?.id === note.id
                  ? syncedNote
                  : state.currentNote,
            }));

            successCount++;
            console.log(
              `[syncPendingNotes] ✅ 创建成功: ${note.id} -> ${response.data.id}`,
            );
          } else {
            // 正常更新现有记录
            console.log(`[syncPendingNotes] 更新笔记: ${note.id}`);
            await notesApi.updateNote(note.id, {
              title: note.title,
              content: note.content,
              htmlContent: note.htmlContent,
              fileType: note.fileType,
              categoryId: note.category,
              tags: note.tags,
              metadata: note.metadata,
              isFavorite: note.isFavorite,
            });

            // 更新同步状态
            await db.updateNote(note.id, {
              synced: true,
              pendingSync: false,
              lastSyncError: undefined,
            });

            // 更新 store 状态
            set((state) => ({
              notes: state.notes.map((n) =>
                n.id === note.id
                  ? {
                      ...n,
                      synced: true,
                      pendingSync: false,
                      lastSyncError: undefined,
                    }
                  : n,
              ),
              currentNote:
                state.currentNote?.id === note.id
                  ? {
                      ...state.currentNote,
                      synced: true,
                      pendingSync: false,
                      lastSyncError: undefined,
                    }
                  : state.currentNote,
            }));

            successCount++;
            console.log(`[syncPendingNotes] ✅ 更新成功: ${note.id}`);
          }
        } catch (error) {
          failCount++;
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error(
            `[syncPendingNotes] ❌ 同步失败 ${note.id}:`,
            errorMessage,
          );

          // 更新错误信息
          await db.updateNote(note.id, {
            lastSyncError: errorMessage,
          });
        }
      }

      console.log(
        `[syncPendingNotes] 同步完成: ${successCount} 成功, ${failCount} 失败`,
      );

      set({
        syncStatus:
          failCount === 0 ? ("success" as SyncStatus) : ("error" as SyncStatus),
      });

      setTimeout(() => {
        set((state) =>
          state.syncStatus === "success" || state.syncStatus === "error"
            ? { syncStatus: "idle" as SyncStatus }
            : {},
        );
      }, 3000);
    } catch (error) {
      console.error("[syncPendingNotes] 同步过程出错:", error);
      set({ syncStatus: "error" as SyncStatus });
    }
  },

  // 同步待处理的分类到服务器
  syncPendingCategories: async () => {
    const { isOnline } = get();
    if (!isOnline) {
      console.log("Offline, skipping category sync");
      return;
    }

    try {
      // 获取所有待同步的分类（包括已删除的）
      const pendingCategories = await db.categories
        .filter((cat) => (cat as any)._pendingSync)
        .toArray();

      console.log(
        `Found ${pendingCategories.length} pending categories to sync`,
      );

      for (const category of pendingCategories) {
        try {
          const isDeleted = (category as any)._deleted;

          if (isDeleted) {
            // 同步删除操作
            try {
              await notesApi.deleteCategory(category.id);
              // 从 IndexedDB 中完全移除
              await db.categories.delete(category.id);
              console.log(`Synced deleted category: ${category.id}`);
            } catch (apiError) {
              console.error(
                `Failed to sync delete for category ${category.id}:`,
                apiError,
              );
            }
          } else {
            // 同步创建或更新操作
            // 先尝试更新
            try {
              await notesApi.updateCategory(category.id, {
                name: category.name,
                icon: category.icon,
                color: category.color,
                sortOrder: category.sortOrder,
              });
              // 清除待同步标记
              await db.categories.update(category.id, {
                _pendingSync: undefined,
              } as any);
              console.log(`Synced updated category: ${category.id}`);
            } catch (updateError) {
              // 如果更新失败，可能是新创建的分类，尝试创建
              try {
                const response = await notesApi.createCategory({
                  name: category.name,
                  icon: category.icon,
                  color: category.color,
                  sortOrder: category.sortOrder,
                });
                // 更新本地 ID 为服务器返回的 ID
                const oldId = category.id;
                await db.categories.delete(oldId);
                await db.categories.add({
                  id: response.data.id,
                  name: response.data.name,
                  icon: response.data.icon,
                  color: response.data.color,
                  sortOrder: response.data.sortOrder,
                  createdAt: new Date(response.data.createdAt).getTime(),
                });
                console.log(
                  `Synced new category: ${oldId} -> ${response.data.id}`,
                );
              } catch (createError) {
                console.error(
                  `Failed to sync category ${category.id}:`,
                  createError,
                );
              }
            }
          }
        } catch (error) {
          console.error(`Error syncing category ${category.id}:`, error);
        }
      }

      // 重新加载分类列表
      await get().loadCategories();
    } catch (error) {
      console.error("Failed to sync pending categories:", error);
    }
  },
}));

// 监听在线状态变化
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    useNoteStore.getState().checkOnlineStatus();
    // 连接恢复时自动同步
    useNoteStore.getState().syncPendingNotes();
    useNoteStore.getState().syncAllNotes();
    useNoteStore.getState().syncPendingCategories();
  });

  window.addEventListener("offline", () => {
    useNoteStore.getState().checkOnlineStatus();
  });
}

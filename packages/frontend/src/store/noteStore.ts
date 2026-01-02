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

  // 检查在线状态
  checkOnlineStatus: () => {
    set({ isOnline: navigator.onLine });
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
        // 在线状态：从后端API获取最新数据
        try {
          const response = await notesApi.getCategories();
          const remoteCategories = response.data || [];

          // 同步到 IndexedDB
          for (const category of remoteCategories) {
            const localCategory = {
              id: category.id,
              name: category.name,
              icon: category.icon,
              color: category.color,
              sortOrder: category.sortOrder,
              createdAt: new Date(category.createdAt).getTime(),
            };
            await db.categories.put(localCategory);
          }

          const categories = await db.categories.toArray();
          set({ categories });
          return;
        } catch (apiError) {
          console.warn("Failed to load categories from backend:", apiError);
        }
      }

      // 离线状态或API失败：从 IndexedDB 加载
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
          const response = await notesApi.createNote({
            title: noteData.title,
            content: noteData.content,
            htmlContent: noteData.htmlContent,
            fileType: noteData.fileType,
            categoryId: noteData.category,
            tags: noteData.tags,
            metadata: noteData.metadata,
          });

          // 更新本地笔记的 ID 为后端返回的 ID
          const syncedNote = { ...localNote, id: response.data.id };
          await db.notes.put(syncedNote);
          set((state) => ({ notes: [syncedNote, ...state.notes] }));
          return syncedNote;
        } catch (apiError) {
          console.warn(
            "Failed to sync to backend, using local only:",
            apiError,
          );
          set((state) => ({ notes: [localNote, ...state.notes] }));
          return localNote;
        }
      } else {
        // 离线状态，只保存到本地
        set((state) => ({ notes: [localNote, ...state.notes] }));
        return localNote;
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

      // 先更新本地 IndexedDB
      await db.updateNote(id, updateData);

      // 如果在线，尝试同步到后端
      const { isOnline } = get();
      if (isOnline) {
        try {
          await notesApi.updateNote(id, {
            title: updates.title,
            content: updates.content,
            htmlContent: updates.htmlContent,
            categoryId: updates.category,
            tags: updates.tags,
            metadata: updates.metadata,
            isFavorite: updates.isFavorite,
          });
        } catch (apiError) {
          console.warn("Failed to sync update to backend:", apiError);
        }
      }

      set((state) => ({
        notes: state.notes.map((note) =>
          note.id === id ? { ...note, ...updateData } : note,
        ),
        currentNote:
          state.currentNote?.id === id
            ? { ...state.currentNote, ...updateData }
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
      const category = await db.createCategory(categoryData);
      set((state) => ({ categories: [...state.categories, category] }));
      return category;
    } catch (error) {
      console.error("Failed to create category:", error);
      throw error;
    }
  },

  updateCategory: async (id, updates) => {
    try {
      await db.updateCategory(id, updates);
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
      await db.deleteCategory(id);
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
}));

// 监听在线状态变化
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    useNoteStore.getState().checkOnlineStatus();
    // 连接恢复时自动同步
    useNoteStore.getState().syncAllNotes();
  });

  window.addEventListener("offline", () => {
    useNoteStore.getState().checkOnlineStatus();
  });
}

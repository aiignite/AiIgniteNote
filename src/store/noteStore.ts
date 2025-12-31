import { create } from "zustand";
import { Note, Category, SearchFilter } from "../types/index";
import { db } from "../db";

interface NoteStore {
  notes: Note[];
  currentNote: Note | null;
  categories: Category[];
  isLoading: boolean;
  searchFilter: SearchFilter;

  // Actions
  loadNotes: () => Promise<void>;
  loadCategories: () => Promise<void>;
  createNote: (
    note: Omit<Note, "id" | "createdAt" | "updatedAt" | "version">,
  ) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  setCurrentNote: (note: Note | null) => void;
  searchNotes: (keyword: string) => Promise<void>;
  setSearchFilter: (filter: SearchFilter) => void;
  toggleFavorite: (id: string) => Promise<void>;
  getNotesByCategory: (categoryId: string) => Promise<Note[]>;
  getNotesByTag: (tag: string) => Promise<Note[]>;
  getFavoriteNotes: () => Promise<Note[]>;
  getDeletedNotes: () => Promise<Note[]>;
  createCategory: (category: Omit<Category, "id" | "createdAt">) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  currentNote: null,
  categories: [],
  isLoading: false,
  searchFilter: {},

  loadNotes: async () => {
    set({ isLoading: true });
    try {
      // 使用 filter 而不是 where().equals() 来避免无效键错误
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
      const categories = await db.categories.toArray();
      set({ categories });
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  },

  createNote: async (noteData) => {
    try {
      const note = await db.createNote(noteData);
      set((state) => ({ notes: [note, ...state.notes] }));
      return note;
    } catch (error) {
      console.error("Failed to create note:", error);
      throw error;
    }
  },

  updateNote: async (id, updates) => {
    try {
      await db.updateNote(id, updates);
      set((state) => ({
        notes: state.notes.map((note) =>
          note.id === id
            ? { ...note, ...updates, updatedAt: Date.now() }
            : note,
        ),
        currentNote:
          state.currentNote?.id === id
            ? { ...state.currentNote, ...updates, updatedAt: Date.now() }
            : state.currentNote,
      }));
    } catch (error) {
      console.error("Failed to update note:", error);
      throw error;
    }
  },

  deleteNote: async (id) => {
    try {
      await db.deleteNote(id);
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
}));

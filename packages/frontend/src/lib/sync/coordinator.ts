import { syncApi } from "../api";
import type { Note, Category, AiAssistant } from "@ainote/shared";

export interface SyncMetadata {
  syncedAt: number;
  pendingSync: boolean;
  serverVersion?: number;
  conflict?: {
    localData: any;
    serverData: any;
  };
}

export interface SyncOptions {
  autoSync?: boolean;
  syncInterval?: number; // milliseconds
  onSyncStart?: () => void;
  onSyncComplete?: (result: SyncResult) => void;
  onSyncError?: (error: Error) => void;
  onConflict?: (conflicts: Conflict[]) => void;
}

export interface SyncResult {
  notes: { pushed: number; pulled: number; conflicts: number };
  categories: { pushed: number; pulled: number; conflicts: number };
  aiAssistants: { pushed: number; pulled: number; conflicts: number };
}

export interface Conflict {
  id: string;
  type: "note" | "category" | "aiAssistant";
  localData: any;
  serverData: any;
}

class SyncCoordinator {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private options: Required<SyncOptions>;

  constructor(options: SyncOptions = {}) {
    this.options = {
      autoSync: options.autoSync ?? true,
      syncInterval: options.syncInterval ?? 60000, // 1 minute
      onSyncStart: options.onSyncStart ?? (() => {}),
      onSyncComplete: options.onSyncComplete ?? (() => {}),
      onSyncError: options.onSyncError ?? (() => {}),
      onConflict: options.onConflict ?? (() => {}),
    };

    if (this.options.autoSync) {
      this.startAutoSync();
    }
  }

  async fullSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error("Sync already in progress");
    }

    this.isSyncing = true;
    this.options.onSyncStart();

    try {
      const result: SyncResult = {
        notes: { pushed: 0, pulled: 0, conflicts: 0 },
        categories: { pushed: 0, pulled: 0, conflicts: 0 },
        aiAssistants: { pushed: 0, pulled: 0, conflicts: 0 },
      };

      // Get last sync time from localStorage
      const lastSyncAt = localStorage.getItem("lastSyncAt") || undefined;

      // Pull changes from server
      const pullResult = await this.pullChanges(lastSyncAt);
      result.notes.pulled = pullResult.notes?.length || 0;
      result.categories.pulled = pullResult.categories?.length || 0;
      result.aiAssistants.pulled = pullResult.aiAssistants?.length || 0;

      // Push local changes
      const pushResult = await this.pushChanges();
      result.notes.pushed =
        pushResult.notes?.created || 0 + pushResult.notes?.updated || 0;
      result.categories.pushed =
        pushResult.categories?.created ||
        0 + pushResult.categories?.updated ||
        0;
      result.aiAssistants.pushed =
        pushResult.aiAssistants?.created ||
        0 + pushResult.aiAssistants?.updated ||
        0;

      // Detect conflicts
      const conflicts = await this.detectConflicts();
      if (conflicts.length > 0) {
        result.notes.conflicts = conflicts.filter(
          (c) => c.type === "note",
        ).length;
        result.categories.conflicts = conflicts.filter(
          (c) => c.type === "category",
        ).length;
        result.aiAssistants.conflicts = conflicts.filter(
          (c) => c.type === "aiAssistant",
        ).length;
        this.options.onConflict(conflicts);
      }

      // Update last sync time
      localStorage.setItem("lastSyncAt", new Date().toISOString());

      this.options.onSyncComplete(result);
      return result;
    } catch (error) {
      this.options.onSyncError(error as Error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  private async pullChanges(lastSyncAt?: string) {
    try {
      const response = await syncApi.pull({
        lastSyncAt,
        types: ["notes", "categories", "aiAssistants"],
      });
      return response.data;
    } catch (error) {
      console.error("Failed to pull changes:", error);
      throw error;
    }
  }

  private async pushChanges() {
    try {
      // Get pending changes from IndexedDB
      const notes = await this.getPendingNotes();
      const categories = await this.getPendingCategories();
      const aiAssistants = await this.getPendingAssistants();

      if (
        notes.length === 0 &&
        categories.length === 0 &&
        aiAssistants.length === 0
      ) {
        return {
          notes: { created: 0, updated: 0, errors: 0 },
          categories: { created: 0, updated: 0, errors: 0 },
          aiAssistants: { created: 0, updated: 0, errors: 0 },
        };
      }

      const response = await syncApi.push({
        notes,
        categories,
        aiAssistants,
      });

      // Clear pending sync flags after successful push
      await this.clearPendingSync(notes, categories, aiAssistants);

      return response.data;
    } catch (error) {
      console.error("Failed to push changes:", error);
      throw error;
    }
  }

  private async getPendingNotes(): Promise<Note[]> {
    // This would query IndexedDB for notes with pendingSync = true
    // For now, return empty array
    return [];
  }

  private async getPendingCategories(): Promise<Category[]> {
    // This would query IndexedDB for categories with pendingSync = true
    return [];
  }

  private async getPendingAssistants(): Promise<AiAssistant[]> {
    // This would query IndexedDB for assistants with pendingSync = true
    return [];
  }

  private async clearPendingSync(
    notes: Note[],
    categories: Category[],
    assistants: AiAssistant[],
  ) {
    // This would update IndexedDB to clear pendingSync flags
    // Implementation depends on your IndexedDB structure
  }

  private async detectConflicts(): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Conflict detection logic:
    // Compare local and server versions to detect conflicts
    // A conflict occurs when:
    // 1. Same item was modified both locally and on server
    // 2. Modification timestamps are within a threshold (e.g., 1 minute)

    return conflicts;
  }

  async resolveConflict(
    conflictId: string,
    resolution: "local" | "server" | "merge",
    data?: any,
  ) {
    try {
      const response = await syncApi.resolveConflict(conflictId, {
        type: "note", // This should be determined from the conflict
        resolution,
        data,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to resolve conflict:", error);
      throw error;
    }
  }

  startAutoSync() {
    if (this.syncInterval) {
      return;
    }

    this.syncInterval = setInterval(() => {
      this.fullSync().catch((error) => {
        console.error("Auto-sync failed:", error);
      });
    }, this.options.syncInterval);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  destroy() {
    this.stopAutoSync();
  }
}

// Singleton instance
let syncCoordinator: SyncCoordinator | null = null;

export function initSyncCoordinator(options?: SyncOptions) {
  if (!syncCoordinator) {
    syncCoordinator = new SyncCoordinator(options);
  }
  return syncCoordinator;
}

export function getSyncCoordinator() {
  if (!syncCoordinator) {
    throw new Error(
      "Sync coordinator not initialized. Call initSyncCoordinator first.",
    );
  }
  return syncCoordinator;
}

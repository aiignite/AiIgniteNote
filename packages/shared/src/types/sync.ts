// 同步相关类型
export type SyncStatus = "idle" | "syncing" | "conflict" | "error";

export interface SyncState {
  isOnline: boolean;
  syncStatus: SyncStatus;
  lastSyncTime?: number;
  pendingOperations: number;
}

export interface SyncConflict {
  id: string;
  type: "note" | "category" | "conversation";
  localVersion: any;
  remoteVersion: any;
  localUpdatedAt: number;
  remoteUpdatedAt: number;
}

export type ConflictResolution = "local" | "remote" | "merge" | "manual";

export interface SyncOperation {
  id: string;
  type: "create" | "update" | "delete";
  resource: "note" | "category" | "conversation";
  resourceId: string;
  data: any;
  retryCount: number;
  createdAt: number;
}

export interface SyncStatusResponse {
  isOnline: boolean;
  lastSyncAt?: string;
  pendingCount: number;
  conflictCount: number;
}

export interface SyncPullRequest {
  lastSyncAt?: string;
  include?: ("notes" | "categories" | "conversations" | "assistants")[];
}

export interface SyncPushRequest {
  operations: SyncOperation[];
}

export interface SyncResolveRequest {
  resolution: ConflictResolution;
  customData?: any;
}

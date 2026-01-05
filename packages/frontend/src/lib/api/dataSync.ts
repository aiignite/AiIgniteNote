/**
 * 数据同步服务
 *
 * 提供离线优先的数据同步功能:
 * - PostgreSQL 是标准数据源
 * - IndexedDB 是本地缓存和离线存储
 * - 自动处理数据同步和冲突解决
 */

import { db } from '../db';
import { apiClient } from './client';

// ============================================
// 类型定义
// ============================================

export interface SyncableData {
  id: string;
  updatedAt: number;
  _pendingSync?: boolean;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}

export interface SyncConfig<T> {
  // IndexedDB 表名
  tableName: keyof AiNoteDatabase;
  // API 端点
  apiEndpoint: string;
  // 数据转换: IndexedDB -> API
  toApiFormat: (data: T) => any;
  // 数据转换: API -> IndexedDB
  fromApiFormat: (data: any) => T;
  // 是否跳过同步 (例如内置助手)
  shouldSync?: (data: T) => boolean;
}

// ============================================
// 同步服务类
// ============================================

export class DataSyncService {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;

  constructor() {
    this.initNetworkListeners();
  }

  // 初始化网络状态监听
  private initNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('[DataSync] 网络已连接');
      this.isOnline = true;
      this.syncAllPending();
    });

    window.addEventListener('offline', () => {
      console.log('[DataSync] 网络已断开');
      this.isOnline = false;
    });
  }

  // 检查是否在线
  checkOnline(): boolean {
    return this.isOnline;
  }

  // ============================================
  // 创建数据 (离线优先)
  // ============================================

  async create<T extends SyncableData>(
    config: SyncConfig<T>,
    data: Omit<T, 'id' | 'updatedAt' | '_pendingSync'>
  ): Promise<T> {
    const now = Date.now();

    // 1. 生成临时 ID
    const tempId = this.generateTempId(config.tableName as string);

    // 2. 准备本地数据
    const localData: T = {
      ...data,
      id: tempId,
      updatedAt: now,
      _pendingSync: true, // 标记为待同步
    } as T;

    // 3. 先保存到 IndexedDB
    await (db[config.tableName] as any).add(localData);
    console.log(`[DataSync] 已保存到本地: ${tempId}`);

    // 4. 如果在线,尝试同步到服务器
    if (this.isOnline) {
      try {
        const apiData = config.toApiFormat(localData);
        const response = await apiClient.post(config.apiEndpoint, apiData);
        const remoteData = response.data;

        // 5. 同步成功,更新本地 ID 和清除标记
        const syncedData = config.fromApiFormat(remoteData);
        await (db[config.tableName] as any).put(syncedData);
        console.log(`[DataSync] 已同步到服务器: ${tempId} -> ${syncedData.id}`);

        return syncedData;
      } catch (error) {
        console.error(`[DataSync] 同步失败,保留待同步标记: ${tempId}`, error);
        // 同步失败,保留 _pendingSync 标记
        return localData;
      }
    }

    return localData;
  }

  // ============================================
  // 更新数据 (离线优先)
  // ============================================

  async update<T extends SyncableData>(
    config: SyncConfig<T>,
    id: string,
    updates: Partial<Omit<T, 'id' | 'updatedAt' | '_pendingSync'>>
  ): Promise<void> {
    const now = Date.now();

    // 1. 先更新 IndexedDB
    await (db[config.tableName] as any).update(id, {
      ...updates,
      updatedAt: now,
      _pendingSync: true, // 标记为待同步
    });
    console.log(`[DataSync] 已更新本地数据: ${id}`);

    // 2. 如果在线,尝试同步到服务器
    if (this.isOnline) {
      try {
        const currentData = await (db[config.tableName] as any).get(id);
        const apiData = config.toApiFormat(currentData);

        await apiClient.put(`${config.apiEndpoint}/${id}`, apiData);

        // 同步成功,清除标记
        await (db[config.tableName] as any).update(id, { _pendingSync: false });
        console.log(`[DataSync] 已同步更新到服务器: ${id}`);
      } catch (error) {
        console.error(`[DataSync] 更新同步失败,保留待同步标记: ${id}`, error);
        // 同步失败,保留 _pendingSync 标记
      }
    }
  }

  // ============================================
  // 删除数据 (软删除 + 同步)
  // ============================================

  async delete<T extends SyncableData>(
    config: SyncConfig<T>,
    id: string,
    isSoftDelete = true
  ): Promise<void> {
    // 1. 先标记为待删除
    if (isSoftDelete) {
      await (db[config.tableName] as any).update(id, {
        isDeleted: true,
        _pendingSync: true,
      });
    } else {
      await (db[config.tableName] as any).delete(id);
    }
    console.log(`[DataSync] 已删除本地数据: ${id}`);

    // 2. 如果在线,尝试同步到服务器
    if (this.isOnline) {
      try {
        await apiClient.delete(`${config.apiEndpoint}/${id}`);

        // 同步成功,真删除
        if (isSoftDelete) {
          await (db[config.tableName] as any).delete(id);
        }
        console.log(`[DataSync] 已同步删除到服务器: ${id}`);
      } catch (error) {
        console.error(`[DataSync] 删除同步失败,保留待同步标记: ${id}`, error);
        // 同步失败,保留 _pendingSync 标记,下次再试
      }
    }
  }

  // ============================================
  // 同步所有待同步数据
  // ============================================

  async syncAllPending(): Promise<void> {
    if (this.syncInProgress) {
      console.log('[DataSync] 同步正在进行中,跳过');
      return;
    }

    if (!this.isOnline) {
      console.log('[DataSync] 离线状态,跳过同步');
      return;
    }

    this.syncInProgress = true;
    console.log('[DataSync] 开始同步所有待同步数据...');

    try {
      // 同步笔记
      await this.syncTable('notes');

      // 同步分类
      await this.syncTable('categories');

      // 同步标签
      await this.syncTable('tags');

      // 同步 AI 助手
      await this.syncTable('aiAssistants');

      // 同步模型配置
      await this.syncTable('modelConfigs');

      console.log('[DataSync] 所有待同步数据已处理完成');
    } catch (error) {
      console.error('[DataSync] 批量同步失败:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // ============================================
  // 从服务器同步数据到本地
  // ============================================

  async syncFromServer<T extends SyncableData>(
    config: SyncConfig<T>
  ): Promise<SyncResult> {
    if (!this.isOnline) {
      return { success: false, synced: 0, failed: 0, errors: [] };
    }

    console.log(`[DataSync] 从服务器同步 ${config.tableName}...`);

    try {
      const response = await apiClient.get(config.apiEndpoint);
      const remoteItems = response.data;

      let synced = 0;
      const errors: Array<{ id: string; error: string }> = [];

      for (const remoteItem of remoteItems) {
        try {
          const localItem = config.fromApiFormat(remoteItem);

          // 检查是否需要跳过同步
          if (config.shouldSync && !config.shouldSync(localItem)) {
            continue;
          }

          // 检查本地是否存在
          const existing = await (db[config.tableName] as any).get(localItem.id);

          if (!existing) {
            // 不存在,直接添加
            await (db[config.tableName] as any).put(localItem);
            synced++;
          } else {
            // 存在,检查是否需要更新
            if (localItem.updatedAt > existing.updatedAt) {
              await (db[config.tableName] as any).put(localItem);
              synced++;
            }
          }
        } catch (error) {
          errors.push({ id: remoteItem.id, error: String(error) });
        }
      }

      console.log(`[DataSync] ${config.tableName} 同步完成: ${synced} 条, ${errors.length} 条失败`);

      return {
        success: errors.length === 0,
        synced,
        failed: errors.length,
        errors,
      };
    } catch (error) {
      console.error(`[DataSync] 从服务器同步 ${config.tableName} 失败:`, error);
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: [{ id: 'all', error: String(error) }],
      };
    }
  }

  // ============================================
  // 私有方法
  // ============================================

  // 生成临时 ID
  private generateTempId(tableName: string): string {
    return `${tableName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // 同步单个表
  private async syncTable(tableName: string): Promise<void> {
    try {
      // 获取所有待同步的数据
      const table = db[tableName as keyof AiNoteDatabase] as any;
      const pendingItems = await table
        .filter((item: any) => item._pendingSync === true)
        .toArray();

      console.log(`[DataSync] ${tableName}: 发现 ${pendingItems.length} 条待同步数据`);

      if (pendingItems.length === 0) {
        return;
      }

      for (const item of pendingItems) {
        try {
          // 根据操作类型执行同步
          if (item.isDeleted) {
            // 已删除
            await this.syncDelete(tableName, item);
          } else if (item.id.startsWith(tableName + '_')) {
            // 临时 ID,需要创建
            await this.syncCreate(tableName, item);
          } else {
            // 正常更新
            await this.syncUpdate(tableName, item);
          }
        } catch (error) {
          console.error(`[DataSync] 同步失败 ${tableName}:${item.id}:`, error);
        }
      }
    } catch (error) {
      console.error(`[DataSync] 同步表 ${tableName} 失败:`, error);
    }
  }

  // 同步创建操作
  private async syncCreate(tableName: string, item: any): Promise<void> {
    const apiEndpoint = `/${this.getApiEndpoint(tableName)}`;

    // 调用 API 创建
    const response = await apiClient.post(apiEndpoint, item);
    const remoteData = response.data;

    // 更新本地数据 (使用服务器返回的 ID)
    await (db[tableName as keyof AiNoteDatabase] as any).put({
      ...item,
      id: remoteData.id,
      _pendingSync: false,
    });

    console.log(`[DataSync] 创建同步成功: ${item.id} -> ${remoteData.id}`);
  }

  // 同步更新操作
  private async syncUpdate(tableName: string, item: any): Promise<void> {
    const apiEndpoint = `/${this.getApiEndpoint(tableName)}/${item.id}`;

    // 调用 API 更新
    await apiClient.put(apiEndpoint, item);

    // 清除待同步标记
    await (db[tableName as keyof AiNoteDatabase] as any).update(item.id, {
      _pendingSync: false,
    });

    console.log(`[DataSync] 更新同步成功: ${item.id}`);
  }

  // 同步删除操作
  private async syncDelete(tableName: string, item: any): Promise<void> {
    const apiEndpoint = `/${this.getApiEndpoint(tableName)}/${item.id}`;

    try {
      // 调用 API 删除
      await apiClient.delete(apiEndpoint);

      // 真删除本地数据
      await (db[tableName as keyof AiNoteDatabase] as any).delete(item.id);

      console.log(`[DataSync] 删除同步成功: ${item.id}`);
    } catch (error) {
      // 删除失败,保留数据
      console.error(`[DataSync] 删除同步失败: ${item.id}`, error);
    }
  }

  // 获取 API 端点
  private getApiEndpoint(tableName: string): string {
    const endpointMap: Record<string, string> = {
      notes: 'api/v1/notes',
      categories: 'api/v1/categories',
      tags: 'api/v1/tags',
      aiAssistants: 'api/v1/ai/assistants',
      modelConfigs: 'api/v1/models',
    };

    return endpointMap[tableName] || tableName;
  }
}

// ============================================
// 导出单例
// ============================================

export const dataSyncService = new DataSyncService();

// ============================================
// 便捷方法
// ============================================

/**
 * 创建数据 (离线优先)
 */
export async function createOfflineFirst<T extends SyncableData>(
  config: SyncConfig<T>,
  data: Omit<T, 'id' | 'updatedAt' | '_pendingSync'>
): Promise<T> {
  return dataSyncService.create(config, data);
}

/**
 * 更新数据 (离线优先)
 */
export async function updateOfflineFirst<T extends SyncableData>(
  config: SyncConfig<T>,
  id: string,
  updates: Partial<Omit<T, 'id' | 'updatedAt' | '_pendingSync'>>
): Promise<void> {
  return dataSyncService.update(config, id, updates);
}

/**
 * 删除数据 (离线优先)
 */
export async function deleteOfflineFirst<T extends SyncableData>(
  config: SyncConfig<T>,
  id: string
): Promise<void> {
  return dataSyncService.delete(config, id);
}

/**
 * 从服务器同步到本地
 */
export async function syncFromServer<T extends SyncableData>(
  config: SyncConfig<T>
): Promise<SyncResult> {
  return dataSyncService.syncFromServer(config);
}

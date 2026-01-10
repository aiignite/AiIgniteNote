import Dexie, { Table } from "dexie";
import {
  LocalNote as Note,
  NoteVersion,
  LocalCategory as Category,
  LocalTag as Tag,
  AIConversation,
  AIMessage,
  ModelConfig,
  ModelUsageLog,
  Attachment,
  FileAttachment,
  NoteFileType,
  LocalAIAssistant,
} from "../types";

export class AiNoteDatabase extends Dexie {
  notes!: Table<Note>;
  noteVersions!: Table<NoteVersion>;
  categories!: Table<Category>;
  conversations!: Table<AIConversation>;
  modelConfigs!: Table<ModelConfig>;
  usageLogs!: Table<ModelUsageLog>;
  attachments!: Table<Attachment>;
  fileAttachments!: Table<FileAttachment>;
  aiAssistants!: Table<LocalAIAssistant>;
  tags!: Table<Tag>;
  noteTags!: Table<{
    id: string;
    noteId: string;
    tagId: string;
    createdAt: number;
  }>;

  constructor() {
    super("AiNoteDB");

    this.version(1).stores({
      notes: "id, title, category, isDeleted, isFavorite, createdAt, updatedAt",
      noteVersions: "id, noteId, createdAt",
      categories: "id, name, createdAt",
      conversations: "id, noteId, createdAt, updatedAt",
      modelConfigs: "id, name, enabled",
      usageLogs: "id, modelId, timestamp",
      attachments: "id, noteId, name, createdAt",
    });

    // 数据库版本 2：添加文件类型支持
    this.version(2)
      .stores({
        notes:
          "id, title, category, fileType, isDeleted, isFavorite, createdAt, updatedAt",
        noteVersions: "id, noteId, createdAt",
        categories: "id, name, createdAt",
        conversations: "id, noteId, createdAt, updatedAt",
        modelConfigs: "id, name, enabled",
        usageLogs: "id, modelId, timestamp",
        attachments: "id, noteId, name, createdAt",
        fileAttachments: "id, noteId, fileType, createdAt",
      })
      .upgrade(async (tx) => {
        // 数据迁移：为现有笔记添加 fileType 字段，默认为 markdown
        const notes = await tx.table<Note>("notes").toArray();
        for (const note of notes) {
          if (!("fileType" in note) || note.fileType === undefined) {
            await tx
              .table<Note>("notes")
              .update(note.id, { fileType: NoteFileType.MARKDOWN });
          }
        }
      });

    // 数据库版本 3：添加 AI 助手支持
    this.version(3)
      .stores({
        notes:
          "id, title, category, fileType, isDeleted, isFavorite, createdAt, updatedAt",
        noteVersions: "id, noteId, createdAt",
        categories: "id, name, createdAt",
        conversations: "id, noteId, createdAt, updatedAt",
        modelConfigs: "id, name, enabled",
        usageLogs: "id, modelId, timestamp",
        attachments: "id, noteId, name, createdAt",
        fileAttachments: "id, noteId, fileType, createdAt",
        aiAssistants: "id, isBuiltIn, isActive, sortOrder",
      })
      .upgrade(async (tx) => {
        // 数据迁移：初始化默认 AI 助手
        // 使用统一的助手配置，确保与 PostgreSQL 数据库一致
        const { BUILT_IN_ASSISTANTS } = await import("../config/assistants.config");

        for (const assistant of BUILT_IN_ASSISTANTS) {
          try {
            await tx.table<LocalAIAssistant>("aiAssistants").add(assistant);
          } catch {
            // 忽略已存在的助手
          }
        }
        console.log(`已初始化 ${BUILT_IN_ASSISTANTS.length} 个内置 AI 助手`);
      });

    // 数据库版本 4：添加标签支持
    this.version(4)
      .stores({
        notes:
          "id, title, category, fileType, isDeleted, isFavorite, createdAt, updatedAt",
        noteVersions: "id, noteId, createdAt",
        categories: "id, name, createdAt",
        conversations: "id, noteId, createdAt, updatedAt",
        modelConfigs: "id, name, enabled",
        usageLogs: "id, modelId, timestamp",
        attachments: "id, noteId, name, createdAt",
        fileAttachments: "id, noteId, fileType, createdAt",
        aiAssistants: "id, isBuiltIn, isActive, sortOrder",
        tags: "id, name, createdAt",
        noteTags: "id, noteId, tagId, createdAt",
      })
      .upgrade(async () => {
        // 标签功能不需要数据迁移
        console.log("Database upgraded to version 4: Tags support added");
      });

    // 数据库版本 5：添加离线同步标记支持
    this.version(5)
      .stores({
        notes:
          "id, title, category, fileType, isDeleted, isFavorite, createdAt, updatedAt, pendingSync",
        noteVersions: "id, noteId, createdAt",
        categories: "id, name, createdAt, _pendingSync",
        conversations: "id, noteId, createdAt, updatedAt",
        modelConfigs: "id, name, enabled, _pendingSync",
        usageLogs: "id, modelId, timestamp",
        attachments: "id, noteId, name, createdAt",
        fileAttachments: "id, noteId, fileType, createdAt",
        aiAssistants: "id, isBuiltIn, isActive, sortOrder",
        tags: "id, name, createdAt, _pendingSync",
        noteTags: "id, noteId, tagId, createdAt",
      })
      .upgrade(async () => {
        // 离线同步功能不需要数据迁移
        console.log(
          "Database upgraded to version 5: Offline sync support added",
        );
      });

    // 数据库版本 6：添加权限管理支持 (isPublic, userId)
    this.version(6)
      .stores({
        notes:
          "id, title, category, fileType, isDeleted, isFavorite, isPublic, createdAt, updatedAt, pendingSync",
        noteVersions: "id, noteId, createdAt",
        categories: "id, name, isPublic, createdAt, _pendingSync",
        conversations: "id, noteId, createdAt, updatedAt",
        modelConfigs: "id, name, enabled, isPublic, _pendingSync",
        usageLogs: "id, modelId, timestamp",
        attachments: "id, noteId, name, createdAt",
        fileAttachments: "id, noteId, fileType, createdAt",
        aiAssistants: "id, isBuiltIn, isPublic, isActive, sortOrder",
        tags: "id, name, isPublic, createdAt, _pendingSync",
        noteTags: "id, noteId, tagId, createdAt",
      })
      .upgrade(async (tx) => {
        // 为现有数据添加 isPublic 字段，默认为 false (私有)
        console.log(
          "Database upgraded to version 6: Permission management support added",
        );

        // 迁移笔记数据
        const notes = await tx.table<Note>("notes").toArray();
        for (const note of notes) {
          if (note.isPublic === undefined) {
            await tx.table<Note>("notes").update(note.id, {
              isPublic: false,
              userId: note.userId || "",
            });
          }
        }

        // 迁移分类数据
        const categories = await tx.table<Category>("categories").toArray();
        for (const category of categories) {
          if (category.isPublic === undefined) {
            await tx.table<Category>("categories").update(category.id, {
              isPublic: false,
              userId: category.userId || "",
            });
          }
        }

        // 迁移标签数据
        const tags = await tx.table<Tag>("tags").toArray();
        for (const tag of tags) {
          if (tag.isPublic === undefined) {
            await tx.table<Tag>("tags").update(tag.id, {
              isPublic: false,
              userId: tag.userId || "",
            });
          }
        }

        // 迁移 AI 助手数据
        const assistants = await tx
          .table<LocalAIAssistant>("aiAssistants")
          .toArray();
        for (const assistant of assistants) {
          if (assistant.isPublic === undefined) {
            await tx
              .table<LocalAIAssistant>("aiAssistants")
              .update(assistant.id, {
                isPublic: false,
                userId: assistant.userId || "",
              });
          }
        }

        // 迁移模型配置数据
        const modelConfigs = await tx
          .table<ModelConfig>("modelConfigs")
          .toArray();
        for (const config of modelConfigs) {
          if (config.isPublic === undefined) {
            await tx.table<ModelConfig>("modelConfigs").update(config.id, {
              isPublic: false,
              userId: config.userId || "",
            });
          }
        }
      });

    // 数据库版本 7：移除 isBuiltIn 字段，所有助手从数据库加载
    this.version(7)
      .stores({
        notes:
          "id, title, category, fileType, isDeleted, isFavorite, isPublic, createdAt, updatedAt, pendingSync",
        noteVersions: "id, noteId, createdAt",
        categories: "id, name, isPublic, createdAt, _pendingSync",
        conversations: "id, noteId, createdAt, updatedAt",
        modelConfigs: "id, name, enabled, isPublic, _pendingSync",
        usageLogs: "id, modelId, timestamp",
        attachments: "id, noteId, name, createdAt",
        fileAttachments: "id, noteId, fileType, createdAt",
        aiAssistants: "id, isPublic, isActive, sortOrder",
        tags: "id, name, isPublic, createdAt, _pendingSync",
        noteTags: "id, noteId, tagId, createdAt",
      })
      .upgrade(async (tx) => {
        console.log(
          "Database upgraded to version 7: Removed isBuiltIn field, all assistants loaded from database",
        );

        // 删除所有内置助手数据（它们将从 PostgreSQL 加载）
        const assistants = await tx
          .table<LocalAIAssistant>("aiAssistants")
          .toArray();
        for (const assistant of assistants) {
          if ((assistant as any).isBuiltIn === true) {
            await tx.table<LocalAIAssistant>("aiAssistants").delete(assistant.id);
            console.log(`[DB] 已删除内置助手: ${assistant.name}`);
          }
        }
      });

    // 数据库版本 8：为对话表添加 userId 和 assistantId 索引
    this.version(8)
      .stores({
        notes:
          "id, title, category, fileType, isDeleted, isFavorite, isPublic, createdAt, updatedAt, pendingSync",
        noteVersions: "id, noteId, createdAt",
        categories: "id, name, isPublic, createdAt, _pendingSync",
        conversations: "id, noteId, userId, assistantId, createdAt, updatedAt",
        modelConfigs: "id, name, enabled, isPublic, _pendingSync",
        usageLogs: "id, modelId, timestamp",
        attachments: "id, noteId, name, createdAt",
        fileAttachments: "id, noteId, fileType, createdAt",
        aiAssistants: "id, isPublic, isActive, sortOrder",
        tags: "id, name, isPublic, createdAt, _pendingSync",
        noteTags: "id, noteId, tagId, createdAt",
      })
      .upgrade(async () => {
        console.log(
          "Database upgraded to version 8: Added userId and assistantId indexes to conversations",
        );
      });

    // 数据库版本 9：清理没有 userId 的旧对话数据
    this.version(9)
      .stores({
        notes:
          "id, title, category, fileType, isDeleted, isFavorite, isPublic, createdAt, updatedAt, pendingSync",
        noteVersions: "id, noteId, createdAt",
        categories: "id, name, isPublic, createdAt, _pendingSync",
        conversations: "id, noteId, userId, assistantId, createdAt, updatedAt",
        modelConfigs: "id, name, enabled, isPublic, _pendingSync",
        usageLogs: "id, modelId, timestamp",
        attachments: "id, noteId, name, createdAt",
        fileAttachments: "id, noteId, fileType, createdAt",
        aiAssistants: "id, isPublic, isActive, sortOrder",
        tags: "id, name, isPublic, createdAt, _pendingSync",
        noteTags: "id, noteId, tagId, createdAt",
      })
      .upgrade(async () => {
        console.log(
          "Database upgraded to version 9: Cleaned up old conversations without userId",
        );

        // 删除所有没有 userId 的旧对话数据
        // 这些数据是在添加 userId 字段之前创建的
        const allConversations = await this.conversations.toArray();
        const conversationsToDelete = allConversations.filter(conv => !conv.userId);

        if (conversationsToDelete.length > 0) {
          console.log(`[DB] 删除了 ${conversationsToDelete.length} 个没有 userId 的旧对话`);

          for (const conv of conversationsToDelete) {
            await this.conversations.delete(conv.id);
          }
        }
      });
  }

  // ============================================
  // 标签操作
  // ============================================

  async getTags(): Promise<Tag[]> {
    return await this.tags.toArray();
  }

  async getTag(id: string): Promise<Tag | undefined> {
    return await this.tags.get(id);
  }

  async createTag(
    tag: Omit<Tag, "id" | "createdAt" | "updatedAt">,
  ): Promise<Tag> {
    const id = `tag_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = Date.now();
    const newTag: Tag = {
      ...tag,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await this.tags.add(newTag);
    return newTag;
  }

  async updateTag(
    id: string,
    updates: Partial<Omit<Tag, "id" | "createdAt" | "updatedAt">>,
  ): Promise<void> {
    await this.tags.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  }

  async deleteTag(id: string): Promise<void> {
    // 删除标签
    await this.tags.delete(id);
    // 删除关联的笔记标签关系
    await this.noteTags.where("tagId").equals(id).delete();
  }

  async setNoteTags(noteId: string, tagIds: string[]): Promise<void> {
    // 删除现有的标签关联
    await this.noteTags.where("noteId").equals(noteId).delete();

    // 创建新的标签关联
    for (const tagId of tagIds) {
      const id = `notetag_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await this.noteTags.add({
        id,
        noteId,
        tagId,
        createdAt: Date.now(),
      });
    }
  }

  async getNoteTags(noteId: string): Promise<Tag[]> {
    const noteTagRelations = await this.noteTags
      .where("noteId")
      .equals(noteId)
      .toArray();

    const tags: Tag[] = [];
    for (const relation of noteTagRelations) {
      const tag = await this.tags.get(relation.tagId);
      if (tag) {
        tags.push(tag);
      }
    }

    return tags;
  }

  async getNotesByTagId(tagId: string): Promise<Note[]> {
    const noteTagRelations = await this.noteTags
      .where("tagId")
      .equals(tagId)
      .toArray();

    const noteIds = noteTagRelations.map((r) => r.noteId);
    const notes: Note[] = [];

    for (const noteId of noteIds) {
      const note = await this.notes.get(noteId);
      if (note && !note.isDeleted) {
        notes.push(note);
      }
    }

    return notes;
  }

  // 笔记操作
  async createNote(
    note: Omit<Note, "id" | "createdAt" | "updatedAt" | "version">,
  ): Promise<Note> {
    const id = `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = Date.now();
    const newNote: Note = {
      ...note,
      id,
      createdAt: now,
      updatedAt: now,
      version: 1,
      // 兼容旧数据：如果没有 fileType，默认为 markdown
      fileType: note.fileType ?? NoteFileType.MARKDOWN,
    };

    await this.notes.add(newNote);

    // 创建版本记录
    await this.createNoteVersion(newNote);

    return newNote;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<void> {
    const note = await this.notes.get(id);
    if (!note) throw new Error("Note not found");

    const updatedNote = {
      ...note,
      ...updates,
      updatedAt: Date.now(),
      version: note.version + 1,
    };

    await this.notes.put(updatedNote);

    // 创建新版本
    await this.createNoteVersion(updatedNote);
  }

  async deleteNote(id: string): Promise<void> {
    await this.notes.update(id, { isDeleted: true, updatedAt: Date.now() });
  }

  async permanentDeleteNote(id: string): Promise<void> {
    await this.notes.delete(id);
    // 删除相关版本
    await this.noteVersions.where("noteId").equals(id).delete();
  }

  async restoreNote(id: string): Promise<void> {
    await this.notes.update(id, { isDeleted: false, updatedAt: Date.now() });
  }

  async searchNotes(keyword: string): Promise<Note[]> {
    const lowerKeyword = keyword.toLowerCase();
    return await this.notes
      .filter(
        (note) =>
          !note.isDeleted &&
          (note.title.toLowerCase().includes(lowerKeyword) ||
            note.content.toLowerCase().includes(lowerKeyword)),
      )
      .toArray();
  }

  async getNotesByCategory(categoryId: string): Promise<Note[]> {
    return await this.notes
      .where("category")
      .equals(categoryId)
      .filter((note) => !note.isDeleted)
      .toArray();
  }

  async getNotesByTag(tag: string): Promise<Note[]> {
    return await this.notes
      .filter((note) => !note.isDeleted && note.tags.includes(tag))
      .toArray();
  }

  async getFavoriteNotes(): Promise<Note[]> {
    const notes = await this.notes.filter((note) => !note.isDeleted).toArray();
    return notes.filter((note) => note.isFavorite);
  }

  async getDeletedNotes(): Promise<Note[]> {
    const notes = await this.notes.filter((note) => note.isDeleted).toArray();
    return notes.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  // 版本历史操作
  async createNoteVersion(note: Note): Promise<void> {
    const version: NoteVersion = {
      id: `version_${note.id}_${note.version}`,
      noteId: note.id,
      content: note.content,
      createdAt: Date.now(),
    };
    await this.noteVersions.add(version);
  }

  async getNoteVersions(noteId: string): Promise<NoteVersion[]> {
    return await this.noteVersions
      .where("noteId")
      .equals(noteId)
      .reverse()
      .sortBy("createdAt");
  }

  // 分类操作
  async createCategory(
    category: Omit<Category, "id" | "createdAt">,
  ): Promise<Category> {
    const id = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newCategory: Category = {
      ...category,
      id,
      createdAt: Date.now(),
    };
    await this.categories.add(newCategory);
    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    await this.categories.update(id, updates);
  }

  async deleteCategory(id: string): Promise<void> {
    // 将该分类下的笔记移到默认分类
    await this.notes
      .where("category")
      .equals(id)
      .modify({ category: "default" });
    await this.categories.delete(id);
  }

  // AI对话操作
  async createConversation(
    conversation: Omit<AIConversation, "id" | "createdAt" | "updatedAt">,
  ): Promise<AIConversation> {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = Date.now();
    const newConversation: AIConversation = {
      ...conversation,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await this.conversations.add(newConversation);
    return newConversation;
  }

  async addMessage(
    conversationId: string,
    message: Omit<AIMessage, "id" | "timestamp">,
  ): Promise<void> {
    const conversation = await this.conversations.get(conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const newMessage: AIMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
    };

    conversation.messages.push(newMessage);

    // 只有当对话有实际内容时才保存到数据库
    // 如果只是系统消息或空消息，且对话只有这一条消息，则不保存
    const hasUserContent = conversation.messages.some(
      (m) => m.role === "user" && m.content.trim(),
    );

    if (hasUserContent) {
      await this.conversations.update(conversationId, {
        messages: conversation.messages,
        updatedAt: Date.now(),
      });
    }
  }

  async getConversations(noteId?: string): Promise<AIConversation[]> {
    // 获取当前用户 ID
    const { user } = await import("../store/authStore").then((m) => ({
      user: m.useAuthStore.getState().user,
    }));

    if (!user) {
      // 如果用户未登录，返回空数组
      return [];
    }

    if (noteId) {
      return await this.conversations
        .where("noteId")
        .equals(noteId)
        .filter((conv) => conv.userId === user.id)
        .reverse()
        .sortBy("updatedAt");
    }
    return await this.conversations
      .filter((conv) => conv.userId === user.id)
      .reverse()
      .sortBy("updatedAt");
  }

  // 模型配置操作
  async createModelConfig(
    config: Omit<ModelConfig, "id">,
  ): Promise<ModelConfig> {
    const id = `model_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newConfig: ModelConfig = { ...config, id };
    await this.modelConfigs.add(newConfig);
    return newConfig;
  }

  async updateModelConfig(
    id: string,
    updates: Partial<ModelConfig>,
  ): Promise<void> {
    await this.modelConfigs.update(id, updates);
  }

  async getEnabledModelConfig(): Promise<ModelConfig | undefined> {
    const configs = await this.modelConfigs.toArray();
    return configs.find((c) => c.enabled);
  }

  // 使用日志操作
  async logUsage(log: Omit<ModelUsageLog, "id" | "timestamp">): Promise<void> {
    const newLog: ModelUsageLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
    };
    await this.usageLogs.add(newLog);
  }

  async getUsageLogs(modelId: string, limit = 100): Promise<ModelUsageLog[]> {
    return await this.usageLogs
      .where("modelId")
      .equals(modelId)
      .reverse()
      .limit(limit)
      .toArray();
  }

  // 文件附件操作
  async createFileAttachment(
    attachment: Omit<FileAttachment, "id" | "createdAt">,
  ): Promise<FileAttachment> {
    const id = `attach_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newAttachment: FileAttachment = {
      ...attachment,
      id,
      createdAt: Date.now(),
    };
    await this.fileAttachments.add(newAttachment);
    return newAttachment;
  }

  async getNoteFileAttachments(noteId: string): Promise<FileAttachment[]> {
    return await this.fileAttachments.where("noteId").equals(noteId).toArray();
  }

  async deleteFileAttachment(id: string): Promise<void> {
    await this.fileAttachments.delete(id);
  }

  async deleteNoteFileAttachments(noteId: string): Promise<void> {
    await this.fileAttachments.where("noteId").equals(noteId).delete();
  }

  // ============================================
  // AI 助手操作
  // ============================================

  async getAssistants(): Promise<LocalAIAssistant[]> {
    return await this.aiAssistants.toArray();
  }

  async getAssistant(id: string): Promise<LocalAIAssistant | undefined> {
    return await this.aiAssistants.get(id);
  }

  async createAssistant(
    assistant: Omit<LocalAIAssistant, "id" | "createdAt" | "updatedAt">,
  ): Promise<LocalAIAssistant> {
    const id = `assistant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = Date.now();
    const newAssistant: LocalAIAssistant = {
      ...assistant,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await this.aiAssistants.add(newAssistant);
    return newAssistant;
  }

  async updateAssistant(
    id: string,
    updates: Partial<LocalAIAssistant>,
  ): Promise<void> {
    await this.aiAssistants.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  }

  async deleteAssistant(id: string): Promise<void> {
    await this.aiAssistants.delete(id);
  }

  async getActiveAssistants(): Promise<LocalAIAssistant[]> {
    return await this.aiAssistants
      .filter((assistant) => assistant.isActive === true)
      .toArray();
  }
}

export const db = new AiNoteDatabase();

// 初始化数据库
export async function initializeDatabase() {
  console.log("[DB] 数据库已准备就绪,等待从后端同步数据");
  // 本地数据库不再创建默认数据,所有数据从后端同步
}

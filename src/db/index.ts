import Dexie, { Table } from "dexie";
import {
  Note,
  NoteVersion,
  Category,
  AIConversation,
  AIMessage,
  ModelConfig,
  ModelUsageLog,
  Attachment,
} from "../types";

export class AiNoteDatabase extends Dexie {
  notes!: Table<Note>;
  noteVersions!: Table<NoteVersion>;
  categories!: Table<Category>;
  conversations!: Table<AIConversation>;
  modelConfigs!: Table<ModelConfig>;
  usageLogs!: Table<ModelUsageLog>;
  attachments!: Table<Attachment>;

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
      title: note.title,
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
    await this.conversations.update(conversationId, {
      messages: conversation.messages,
      updatedAt: Date.now(),
    });
  }

  async getConversations(noteId?: string): Promise<AIConversation[]> {
    if (noteId) {
      return await this.conversations
        .where("noteId")
        .equals(noteId)
        .reverse()
        .sortBy("updatedAt");
    }
    return await this.conversations.reverse().sortBy("updatedAt");
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
}

export const db = new AiNoteDatabase();

// 初始化默认数据
export async function initializeDatabase() {
  try {
    const categoryCount = await db.categories.count();
    if (categoryCount === 0) {
      // 创建默认分类 - 使用单个添加避免批量错误
      const defaults = [
        { id: "default", name: "未分类", createdAt: Date.now() },
        { id: "work", name: "工作", createdAt: Date.now() },
        { id: "study", name: "学习", createdAt: Date.now() },
        { id: "life", name: "生活", createdAt: Date.now() },
        { id: "ideas", name: "灵感", createdAt: Date.now() },
      ];
      for (const category of defaults) {
        try {
          await db.categories.add(category);
        } catch {
          // 忽略已存在的分类
        }
      }
    }

    const configCount = await db.modelConfigs.count();
    if (configCount === 0) {
      // 创建默认模型配置（需要用户配置API Key）
      try {
        await db.modelConfigs.add({
          id: "default",
          name: "GLM-4.7",
          apiKey: "",
          apiEndpoint: "https://open.bigmodel.cn/api/coding/paas/v4",
          model: "glm-4.7",
          temperature: 0.7,
          maxTokens: 2000,
          topP: 0.9,
          enabled: true,
        });
      } catch {
        // 忽略已存在的配置
      }
    }
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}

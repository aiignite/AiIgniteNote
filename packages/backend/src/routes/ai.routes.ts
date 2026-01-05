import { FastifyInstance } from "fastify";
import { prisma } from "../utils/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { AIService } from "../services/ai.service.js";
import {
  buildUserQuery,
  canModify,
  canDelete,
} from "../utils/permission.helper.js";

export default async function aiRoutes(fastify: FastifyInstance) {
  // Get conversations
  fastify.get(
    "/conversations",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const query = request.query as {
        page?: string;
        limit?: string;
        noteId?: string;
      };

      const page = parseInt(query.page || "1");
      const limit = parseInt(query.limit || "20");
      const skip = (page - 1) * limit;

      const where: any = {
        userId: req.userId, // 对话只有用户自己能看到
      };

      if (query.noteId) {
        where.noteId = query.noteId;
      }

      const [conversations, total] = await Promise.all([
        prisma.aiConversation.findMany({
          where,
          include: {
            note: {
              select: { id: true, title: true },
            },
            assistant: {
              select: { id: true, name: true, avatar: true },
            },
            messages: {
              orderBy: { createdAt: "asc" },
              take: 1,
            },
          },
          orderBy: { updatedAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.aiConversation.count({ where }),
      ]);

      return {
        conversations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    },
  );

  // Get conversation by id
  fastify.get(
    "/conversations/:id",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { id } = request.params as { id: string };

      const conversation = await prisma.aiConversation.findFirst({
        where: { id, userId: req.userId },
        include: {
          note: {
            select: { id: true, title: true },
          },
          assistant: {
            select: { id: true, name: true, avatar: true },
          },
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!conversation) {
        reply.status(404).send({
          error: {
            message: "Conversation not found",
            code: "CONVERSATION_NOT_FOUND",
          },
        });
        return;
      }

      return conversation;
    },
  );

  // Create conversation
  fastify.post(
    "/conversations",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const body = request.body as {
        title?: string;
        noteId?: string;
        assistantId?: string;
      };

      try {
        const conversation = await prisma.aiConversation.create({
          data: {
            title: body.title,
            userId: req.userId,
            noteId: body.noteId,
            assistantId: body.assistantId,
          },
          include: {
            note: {
              select: { id: true, title: true },
            },
            assistant: {
              select: { id: true, name: true, avatar: true },
            },
          },
        });

        return conversation;
      } catch (error: any) {
        reply.status(400).send({
          error: {
            message: error.message,
            code: "CREATE_FAILED",
          },
        });
      }
    },
  );

  // Delete conversation
  fastify.delete(
    "/conversations/:id",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { id } = request.params as { id: string };

      try {
        // Find conversation first
        const existing = await prisma.aiConversation.findFirst({
          where: { id, userId: req.userId },
        });

        if (!existing) {
          reply.status(404).send({
            error: {
              message: "Conversation not found",
              code: "CONVERSATION_NOT_FOUND",
            },
          });
          return;
        }

        await prisma.aiConversation.delete({
          where: { id },
        });

        return { message: "Conversation deleted successfully" };
      } catch (error: any) {
        reply.status(400).send({
          error: {
            message: error.message,
            code: "DELETE_FAILED",
          },
        });
      }
    },
  );

  // Add message to conversation
  fastify.post(
    "/conversations/:id/messages",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { id } = request.params as { id: string };
      const body = request.body as {
        role: string;
        content: string;
        tokensUsed?: number;
        model?: string;
      };

      try {
        // Verify conversation belongs to user
        const conversation = await prisma.aiConversation.findFirst({
          where: { id, userId: req.userId },
        });

        if (!conversation) {
          reply.status(404).send({
            error: {
              message: "Conversation not found",
              code: "CONVERSATION_NOT_FOUND",
            },
          });
          return;
        }

        const message = await prisma.aiMessage.create({
          data: {
            conversationId: id,
            role: body.role,
            content: body.content,
            tokensUsed: body.tokensUsed,
            model: body.model,
          },
        });

        // Update conversation updated timestamp
        await prisma.aiConversation.update({
          where: { id },
          data: { updatedAt: new Date() },
        });

        return message;
      } catch (error: any) {
        reply.status(400).send({
          error: {
            message: error.message,
            code: "CREATE_FAILED",
          },
        });
      }
    },
  );

  // Get AI assistants（用户自己的 + 公有的）
  fastify.get(
    "/assistants",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;

      const assistants = await prisma.aiAssistant.findMany({
        where: {
          OR: [
            { userId: req.userId }, // 用户自己的
            { isPublic: true }, // 公有的
          ],
        },
        orderBy: { sortOrder: "asc" },
      });

      return assistants;
    },
  );

  // Create custom assistant
  fastify.post(
    "/assistants",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const body = request.body as {
        name: string;
        description?: string;
        systemPrompt: string;
        avatar?: string;
        model: string;
        temperature?: number;
        maxTokens?: number;
        isActive?: boolean;
        isPublic?: boolean;
      };

      try {
        const assistant = await prisma.aiAssistant.create({
          data: {
            name: body.name,
            description: body.description,
            systemPrompt: body.systemPrompt,
            avatar: body.avatar,
            model: body.model,
            temperature: body.temperature,
            maxTokens: body.maxTokens,
            isActive: body.isActive ?? true,
            isPublic: body.isPublic ?? false,
            userId: req.userId,
          },
        });

        return assistant;
      } catch (error: any) {
        reply.status(400).send({
          error: {
            message: error.message,
            code: "CREATE_FAILED",
          },
        });
      }
    },
  );

  // Update assistant
  fastify.put(
    "/assistants/:id",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { id } = request.params as { id: string };
      const body = request.body as {
        name?: string;
        description?: string;
        systemPrompt?: string;
        avatar?: string;
        model?: string;
        temperature?: number;
        maxTokens?: number;
        isActive?: boolean;
        isPublic?: boolean;
      };

      try {
        // Find assistant first (不使用 userId 过滤，以便检查权限)
        const existing = await prisma.aiAssistant.findUnique({
          where: { id },
        });

        if (!existing) {
          reply.status(404).send({
            error: {
              message: "Assistant not found",
              code: "ASSISTANT_NOT_FOUND",
            },
          });
          return;
        }

        // 检查权限：只有创建者可以修改
        if (!canModify(existing.userId, req.userId)) {
          reply.status(403).send({
            error: {
              message: "You don't have permission to modify this assistant",
              code: "FORBIDDEN",
            },
          });
          return;
        }

        const assistant = await prisma.aiAssistant.update({
          where: { id },
          data: {
            ...(body.name && { name: body.name }),
            ...(body.description !== undefined && {
              description: body.description,
            }),
            ...(body.systemPrompt && { systemPrompt: body.systemPrompt }),
            ...(body.avatar !== undefined && { avatar: body.avatar }),
            ...(body.model && { model: body.model }),
            ...(body.temperature !== undefined && {
              temperature: body.temperature,
            }),
            ...(body.maxTokens !== undefined && { maxTokens: body.maxTokens }),
            ...(body.isActive !== undefined && { isActive: body.isActive }),
            ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
          },
        });

        return assistant;
      } catch (error: any) {
        reply.status(400).send({
          error: {
            message: error.message,
            code: "UPDATE_FAILED",
          },
        });
      }
    },
  );

  // Delete assistant
  fastify.delete(
    "/assistants/:id",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { id } = request.params as { id: string };

      try {
        // Find assistant first (不使用 userId 过滤，以便检查权限)
        const existing = await prisma.aiAssistant.findUnique({
          where: { id },
        });

        if (!existing) {
          reply.status(404).send({
            error: {
              message: "Assistant not found",
              code: "ASSISTANT_NOT_FOUND",
            },
          });
          return;
        }

        // 检查权限：只有创建者可以删除
        if (!canDelete(existing.userId, req.userId)) {
          reply.status(403).send({
            error: {
              message: "You don't have permission to delete this assistant",
              code: "FORBIDDEN",
            },
          });
          return;
        }

        await prisma.aiAssistant.delete({
          where: { id },
        });

        return { message: "Assistant deleted successfully" };
      } catch (error: any) {
        reply.status(400).send({
          error: {
            message: error.message,
            code: "DELETE_FAILED",
          },
        });
      }
    },
  );

  // Get default model
  fastify.get(
    "/models/default",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const aiService = new AIService();

      try {
        const model = await aiService.getDefaultModel(req.userId);

        if (!model) {
          reply.status(404).send({
            error: {
              message:
                "No default model found. Please configure a model in Settings.",
              code: "NO_DEFAULT_MODEL",
            },
          });
          return;
        }

        // 返回模型配置（不包含敏感信息）
        return {
          id: model.id,
          name: model.name,
          description: model.description,
          model: model.model,
          temperature: model.temperature,
          maxTokens: model.maxTokens,
          topP: model.topP,
          isDefault: model.isDefault,
          enabled: model.enabled,
        };
      } catch (error: any) {
        reply.status(500).send({
          error: {
            message: error.message,
            code: "FETCH_FAILED",
          },
        });
      }
    },
  );

  // Chat endpoint
  fastify.post(
    "/chat",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const body = request.body as {
        messages: Array<{ role: string; content: string }>;
        modelId?: string;
      };

      const aiService = new AIService();

      try {
        const response = await aiService.chat(req.userId, {
          messages: body.messages.map((m) => ({
            role: m.role as "user" | "system" | "assistant",
            content: m.content,
          })),
          modelId: body.modelId,
        });

        return response;
      } catch (error: any) {
        reply.status(500).send({
          error: {
            message: error.message,
            code: "CHAT_FAILED",
          },
        });
      }
    },
  );

  // Stream chat endpoint (Server-Sent Events)
  fastify.post(
    "/chat/stream",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const body = request.body as {
        messages: Array<{ role: string; content: string }>;
        modelId?: string;
      };

      console.log(
        "[AI Chat Stream] Request body:",
        JSON.stringify(body).substring(0, 200),
      );

      // 设置SSE响应头，包括CORS
      reply.raw.setHeader("Content-Type", "text/event-stream");
      reply.raw.setHeader("Cache-Control", "no-cache");
      reply.raw.setHeader("Connection", "keep-alive");
      reply.raw.setHeader("Access-Control-Allow-Origin", "*");
      reply.raw.setHeader("Access-Control-Allow-Credentials", "true");
      reply.raw.setHeader("X-Accel-Buffering", "no"); // 禁用Nginx缓冲

      const aiService = new AIService();

      try {
        console.log("[AI Chat Stream] Starting stream for userId:", req.userId);
        const stream = aiService.chatStream(req.userId, {
          messages: body.messages.map((m) => ({
            role: m.role as "user" | "system" | "assistant",
            content: m.content,
          })),
          modelId: body.modelId,
        });

        let chunkCount = 0;
        for await (const chunk of stream) {
          chunkCount++;
          const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
          reply.raw.write(data);
          console.log(
            "[AI Chat Stream] Sent chunk:",
            chunkCount,
            "size:",
            chunk.length,
          );
        }

        console.log("[AI Chat Stream] Completed, total chunks:", chunkCount);
        reply.raw.write("data: [DONE]\n\n");
      } catch (error: any) {
        console.error("[AI Chat Stream] Error:", error.message);
        reply.raw.write(
          `data: ${JSON.stringify({ error: error.message })}\n\n`,
        );
      } finally {
        reply.raw.end();
      }

      return reply;
    },
  );
}

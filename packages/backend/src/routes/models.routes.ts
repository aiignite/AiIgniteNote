import { FastifyInstance } from "fastify";
import { prisma } from "../utils/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { encrypt, decrypt } from "../utils/encryption.js";

export default async function modelRoutes(fastify: FastifyInstance) {
  // Get model configs
  fastify.get(
    "/configs",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;

      const configs = await prisma.modelConfig.findMany({
        where: { userId: req.userId },
        select: {
          id: true,
          name: true,
          description: true,
          apiEndpoint: true,
          apiType: true,
          model: true,
          temperature: true,
          maxTokens: true,
          topP: true,
          enabled: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
          // Exclude apiKey and userId
        },
        orderBy: { isDefault: "desc" },
      });

      return configs;
    },
  );

  // Create model config
  fastify.post(
    "/configs",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const body = request.body as {
        name: string;
        description?: string;
        apiKey: string;
        apiEndpoint: string;
        apiType?: string;
        model: string;
        temperature?: number;
        maxTokens?: number;
        topP?: number;
      };

      try {
        // Encrypt API key
        const encryptedApiKey = encrypt(body.apiKey);

        const config = await prisma.modelConfig.create({
          data: {
            name: body.name,
            description: body.description,
            apiKey: encryptedApiKey,
            apiEndpoint: body.apiEndpoint,
            apiType: body.apiType || "openai",
            model: body.model,
            temperature: body.temperature,
            maxTokens: body.maxTokens,
            topP: body.topP,
            userId: req.userId,
          },
          select: {
            id: true,
            name: true,
            description: true,
            apiEndpoint: true,
            apiType: true,
            model: true,
            temperature: true,
            maxTokens: true,
            topP: true,
            enabled: true,
            isDefault: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return config;
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

  // Update model config
  fastify.put(
    "/configs/:id",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { id } = request.params as { id: string };
      const body = request.body as {
        name?: string;
        description?: string;
        apiKey?: string;
        apiEndpoint?: string;
        apiType?: string;
        model?: string;
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        enabled?: boolean;
        isDefault?: boolean;
      };

      try {
        // 先检查是否存在
        const existing = await prisma.modelConfig.findFirst({
          where: { id, userId: req.userId },
        });

        if (!existing) {
          reply.status(404).send({
            error: { message: "Config not found", code: "CONFIG_NOT_FOUND" },
          });
          return;
        }

        const data: any = {
          ...(body.name && { name: body.name }),
          ...(body.description !== undefined && {
            description: body.description,
          }),
          ...(body.apiEndpoint && { apiEndpoint: body.apiEndpoint }),
          ...(body.apiType && { apiType: body.apiType }),
          ...(body.model && { model: body.model }),
          ...(body.temperature !== undefined && {
            temperature: body.temperature,
          }),
          ...(body.maxTokens !== undefined && { maxTokens: body.maxTokens }),
          ...(body.topP !== undefined && { topP: body.topP }),
          ...(body.enabled !== undefined && { enabled: body.enabled }),
          ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
        };

        // Encrypt new API key if provided
        if (body.apiKey) {
          data.apiKey = encrypt(body.apiKey);
        }

        // 如果设置为默认模型，需要取消其他模型的默认状态
        if (body.isDefault === true) {
          await prisma.modelConfig.updateMany({
            where: {
              userId: req.userId,
              id: { not: id },
            },
            data: { isDefault: false },
          });
        }

        const config = await prisma.modelConfig.update({
          where: { id },
          data,
          select: {
            id: true,
            name: true,
            description: true,
            apiEndpoint: true,
            apiType: true,
            model: true,
            temperature: true,
            maxTokens: true,
            topP: true,
            enabled: true,
            isDefault: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return config;
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

  // Delete model config
  fastify.delete(
    "/configs/:id",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { id } = request.params as { id: string };

      try {
        await prisma.modelConfig.deleteMany({
          where: { id, userId: req.userId },
        });

        return { message: "Config deleted successfully" };
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

  // Get usage stats
  fastify.get(
    "/usage",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const query = request.query as {
        modelId?: string;
        startDate?: string;
        endDate?: string;
      };

      // 先获取用户的所有模型ID
      const userModels = await prisma.modelConfig.findMany({
        where: { userId: req.userId },
        select: { id: true },
      });

      const modelIds = userModels.map((m) => m.id);

      const where: any = {
        modelId: { in: modelIds },
      };

      if (query.modelId) {
        where.modelId = query.modelId;
      }

      if (query.startDate || query.endDate) {
        where.createdAt = {};
        if (query.startDate) {
          where.createdAt.gte = new Date(query.startDate);
        }
        if (query.endDate) {
          where.createdAt.lte = new Date(query.endDate);
        }
      }

      const logs = await prisma.modelUsageLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      // 获取模型信息
      const modelsInfo = await prisma.modelConfig.findMany({
        where: { id: { in: modelIds } },
        select: { id: true, name: true },
      });

      const modelMap = new Map(modelsInfo.map((m) => [m.id, m.name]));

      // 计算每个模型的统计数据
      const statsByModel: Record<string, any> = {};
      logs.forEach((log) => {
        if (!statsByModel[log.modelId]) {
          statsByModel[log.modelId] = {
            modelId: log.modelId,
            modelName: modelMap.get(log.modelId) || "Unknown",
            totalCalls: 0,
            successCalls: 0,
            failedCalls: 0,
            totalTokens: 0,
            inputTokens: 0,
            outputTokens: 0,
          };
        }
        const stat = statsByModel[log.modelId];
        stat.totalCalls++;
        if (log.success) {
          stat.successCalls++;
        } else {
          stat.failedCalls++;
        }
        stat.totalTokens += log.totalTokens;
        stat.inputTokens += log.inputTokens;
        stat.outputTokens += log.outputTokens;
      });

      // 转换为数组格式
      const byModel = Object.values(statsByModel).map((stat) => ({
        ...stat,
        successRate:
          stat.totalCalls > 0 ? (stat.successCalls / stat.totalCalls) * 100 : 0,
      }));

      // 计算总体统计
      const stats = logs.reduce(
        (acc, log) => ({
          totalTokens: acc.totalTokens + log.totalTokens,
          inputTokens: acc.inputTokens + log.inputTokens,
          outputTokens: acc.outputTokens + log.outputTokens,
          successCount: acc.successCount + (log.success ? 1 : 0),
          failureCount: acc.failureCount + (log.success ? 0 : 1),
        }),
        {
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          successCount: 0,
          failureCount: 0,
        },
      );

      return {
        stats,
        byModel,
        logs: logs.map((log) => ({
          ...log,
          modelName: modelMap.get(log.modelId) || "Unknown",
        })),
      };
    },
  );

  // Get usage logs
  fastify.get(
    "/usage/logs",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const query = request.query as {
        page?: string;
        limit?: string;
        modelId?: string;
      };

      const page = parseInt(query.page || "1");
      const limit = parseInt(query.limit || "50");
      const skip = (page - 1) * limit;

      // 先获取用户的所有模型ID
      const userModels = await prisma.modelConfig.findMany({
        where: { userId: req.userId },
        select: { id: true },
      });

      const modelIds = userModels.map((m) => m.id);

      const where: any = {
        modelId: { in: modelIds },
      };

      if (query.modelId) {
        where.modelId = query.modelId;
      }

      const [logs, total] = await Promise.all([
        prisma.modelUsageLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.modelUsageLog.count({ where }),
      ]);

      // 获取模型名称
      const modelsInfo = await prisma.modelConfig.findMany({
        where: { id: { in: modelIds } },
        select: { id: true, name: true },
      });

      const modelMap = new Map(modelsInfo.map((m) => [m.id, m.name]));

      return {
        logs: logs.map((log) => ({
          ...log,
          modelName: modelMap.get(log.modelId) || "Unknown",
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    },
  );
}

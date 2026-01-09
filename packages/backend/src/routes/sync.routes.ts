import { FastifyInstance } from "fastify";
import { prisma } from "../utils/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { canModify } from "../utils/permission.helper.js";

export default async function syncRoutes(fastify: FastifyInstance) {
  // Get sync status
  fastify.get(
    "/status",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;

      // Get last synced timestamp from user preferences or calculate
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { preferences: true },
      });

      const lastSyncAt = (user?.preferences as any)?.lastSyncAt || null;

      // Count unsynced items (this is a placeholder - actual implementation depends on your sync strategy)
      const pendingSync = 0;

      return {
        lastSyncAt,
        pendingSync,
        status: "synced",
      };
    },
  );

  // Pull changes from server (incremental sync)
  fastify.post(
    "/pull",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const body = request.body as {
        lastSyncAt?: string;
        types?: ("notes" | "categories" | "aiAssistants")[];
      };

      const lastSync = body.lastSyncAt
        ? new Date(body.lastSyncAt)
        : new Date(0);
      const types = body.types || ["notes", "categories", "aiAssistants"];

      const result: any = {};

      // Pull notes
      if (types.includes("notes")) {
        result.notes = await prisma.note.findMany({
          where: {
            userId: req.userId,
            updatedAt: { gt: lastSync },
          },
          include: {
            category: true,
          },
        });
      }

      // Pull categories
      if (types.includes("categories")) {
        result.categories = await prisma.category.findMany({
          where: {
            userId: req.userId,
            updatedAt: { gt: lastSync },
          },
        });
      }

      // Pull AI assistants
      if (types.includes("aiAssistants")) {
        result.aiAssistants = await prisma.aiAssistant.findMany({
          where: {
            userId: req.userId,
            updatedAt: { gt: lastSync },
          },
        });
      }

      // Update last sync timestamp
      const currentUser = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { preferences: true },
      });

      const currentPrefs = (currentUser?.preferences as any) || {};
      await prisma.user.update({
        where: { id: req.userId },
        data: {
          preferences: {
            ...currentPrefs,
            lastSyncAt: new Date().toISOString(),
          } as any,
        },
      });

      return result;
    },
  );

  // Push local changes to server
  fastify.post(
    "/push",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const body = request.body as {
        notes?: any[];
        categories?: any[];
        aiAssistants?: any[];
      };

      const result: any = {
        notes: { created: 0, updated: 0, errors: 0 },
        categories: { created: 0, updated: 0, errors: 0 },
        aiAssistants: { created: 0, updated: 0, errors: 0 },
      };

      // Sync notes
      if (body.notes && Array.isArray(body.notes)) {
        for (const note of body.notes) {
          try {
            if (note.id) {
              // Check if exists
              const existing = await prisma.note.findFirst({
                where: { id: note.id, userId: req.userId },
              });

              // Extract fields explicitly to avoid spread issues
              const {
                id: _id,
                userId: _userId,
                createdAt: _createdAt,
                updatedAt: _updatedAt,
                category: _category,
                categoryId: _categoryId,
                ...noteData
              } = note;

              // Ensure categoryId exists
              let categoryId = note.categoryId;
              if (!categoryId) {
                const defaultCategory = await prisma.category.findFirst({
                  where: {
                    userId: req.userId,
                    name: "未分类",
                  },
                });
                categoryId = defaultCategory?.id || "";
                if (!categoryId) {
                  const newCategory = await prisma.category.create({
                    data: {
                      name: "未分类",
                      userId: req.userId,
                      sortOrder: 0,
                    },
                  });
                  categoryId = newCategory.id;
                }
              }

              if (existing) {
                // Update
                await prisma.note.update({
                  where: { id: note.id },
                  data: {
                    ...noteData,
                    categoryId,
                  },
                });
                result.notes.updated++;
              } else {
                // Create
                await prisma.note.create({
                  data: {
                    ...noteData,
                    id: note.id,
                    userId: req.userId,
                    categoryId,
                  },
                });
                result.notes.created++;
              }
            }
          } catch (error) {
            console.error("[Sync Push] Note error:", error);
            result.notes.errors++;
          }
        }
      }

      // Sync categories
      if (body.categories && Array.isArray(body.categories)) {
        for (const category of body.categories) {
          try {
            if (category.id) {
              const existing = await prisma.category.findFirst({
                where: { id: category.id, userId: req.userId },
              });

              // Extract fields explicitly to avoid spread issues
              const {
                id: _id,
                userId: _userId,
                createdAt: _createdAt,
                updatedAt: _updatedAt,
                ...categoryData
              } = category;

              if (existing) {
                await prisma.category.update({
                  where: { id: category.id },
                  data: categoryData,
                });
                result.categories.updated++;
              } else {
                await prisma.category.create({
                  data: {
                    ...categoryData,
                    id: category.id,
                    userId: req.userId,
                  },
                });
                result.categories.created++;
              }
            }
          } catch (error) {
            result.categories.errors++;
          }
        }
      }

      // Sync AI assistants
      if (body.aiAssistants && Array.isArray(body.aiAssistants)) {
        for (const assistant of body.aiAssistants) {
          try {
            if (assistant.id) {
              const existing = await prisma.aiAssistant.findFirst({
                where: { id: assistant.id, userId: req.userId },
              });

              // Extract fields explicitly to avoid spread issues
              const {
                id: _id,
                userId: _userId,
                createdAt: _createdAt,
                updatedAt: _updatedAt,
                ...assistantData
              } = assistant;

              if (existing && canModify(existing.userId, req.userId)) {
                await prisma.aiAssistant.update({
                  where: { id: assistant.id },
                  data: assistantData,
                });
                result.aiAssistants.updated++;
              } else if (!existing) {
                await prisma.aiAssistant.create({
                  data: {
                    ...assistantData,
                    id: assistant.id,
                    userId: req.userId,
                  },
                });
                result.aiAssistants.created++;
              }
            }
          } catch (error) {
            result.aiAssistants.errors++;
          }
        }
      }

      // Update last sync timestamp
      const currentUser = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { preferences: true },
      });

      const currentPrefs = (currentUser?.preferences as any) || {};
      await prisma.user.update({
        where: { id: req.userId },
        data: {
          preferences: {
            ...currentPrefs,
            lastSyncAt: new Date().toISOString(),
          } as any,
        },
      });

      return result;
    },
  );

  // Resolve conflict
  fastify.post(
    "/resolve/:id",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { id } = request.params as { id: string };
      const body = request.body as {
        type: "note" | "category";
        resolution: "local" | "server" | "merge";
        data?: any;
      };

      try {
        if (body.type === "note") {
          // Verify ownership
          const note = await prisma.note.findFirst({
            where: { id, userId: req.userId },
          });

          if (!note) {
            reply.status(404).send({
              error: { message: "Note not found", code: "NOT_FOUND" },
            });
            return;
          }

          if (body.resolution === "local" || body.resolution === "merge") {
            // Use local/merged data
            await prisma.note.update({
              where: { id },
              data: body.data,
            });
          }
          // If 'server', keep server version (do nothing)

          return { message: "Conflict resolved successfully" };
        } else if (body.type === "category") {
          const category = await prisma.category.findFirst({
            where: { id, userId: req.userId },
          });

          if (!category) {
            reply.status(404).send({
              error: { message: "Category not found", code: "NOT_FOUND" },
            });
            return;
          }

          if (body.resolution === "local" || body.resolution === "merge") {
            await prisma.category.update({
              where: { id },
              data: body.data,
            });
          }

          return { message: "Conflict resolved successfully" };
        }

        reply.status(400).send({
          error: { message: "Invalid type", code: "INVALID_TYPE" },
        });
      } catch (error: any) {
        reply.status(400).send({
          error: {
            message: error.message,
            code: "RESOLVE_FAILED",
          },
        });
      }
    },
  );
}

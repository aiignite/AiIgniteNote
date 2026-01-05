import { FastifyInstance } from "fastify";
import { prisma } from "../utils/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { buildUserQuery, canModify, canDelete } from "../utils/permission.helper.js";

export default async function categoryRoutes(fastify: FastifyInstance) {
  // Get categories
  fastify.get(
    "/",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;

      const categories = await prisma.category.findMany({
        where: buildUserQuery(req.userId), // 用户自己的 + 公有的
        include: {
          _count: {
            select: { notes: true },
          },
        },
        orderBy: { sortOrder: "asc" },
      });

      return categories;
    },
  );

  // Create category
  fastify.post(
    "/",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const body = request.body as {
        name: string;
        icon?: string;
        color?: string;
        isPublic?: boolean;
      };

      try {
        const category = await prisma.category.create({
          data: {
            name: body.name,
            icon: body.icon,
            color: body.color,
            isPublic: body.isPublic ?? false,
            userId: req.userId,
          },
        });

        return category;
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

  // Update category
  fastify.put(
    "/:id",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { id } = request.params as { id: string };
      const body = request.body as {
        name?: string;
        icon?: string;
        color?: string;
        sortOrder?: number;
        isPublic?: boolean;
      };

      try {
        // 先检查权限
        const existing = await prisma.category.findUnique({
          where: { id },
        });

        if (!existing) {
          reply.status(404).send({
            error: {
              message: "Category not found",
              code: "CATEGORY_NOT_FOUND",
            },
          });
          return;
        }

        // 检查权限：只有创建者可以修改
        if (!canModify(existing.userId, req.userId)) {
          reply.status(403).send({
            error: {
              message: "You don't have permission to modify this category",
              code: "FORBIDDEN",
            },
          });
          return;
        }

        const category = await prisma.category.update({
          where: { id },
          data: {
            ...(body.name && { name: body.name }),
            ...(body.icon !== undefined && { icon: body.icon }),
            ...(body.color !== undefined && { color: body.color }),
            ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
            ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
          },
        });

        return category;
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

  // Delete category
  fastify.delete(
    "/:id",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { id } = request.params as { id: string };

      try {
        // 先检查权限
        const existing = await prisma.category.findUnique({
          where: { id },
        });

        if (!existing) {
          reply.status(404).send({
            error: {
              message: "Category not found",
              code: "CATEGORY_NOT_FOUND",
            },
          });
          return;
        }

        // 检查权限：只有创建者可以删除
        if (!canDelete(existing.userId, req.userId)) {
          reply.status(403).send({
            error: {
              message: "You don't have permission to delete this category",
              code: "FORBIDDEN",
            },
          });
          return;
        }

        await prisma.category.delete({
          where: { id },
        });

        return { message: "Category deleted successfully" };
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
}

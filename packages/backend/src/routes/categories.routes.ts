import { FastifyInstance } from "fastify";
import { prisma } from "../utils/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";

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
        where: { userId: req.userId },
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
      };

      try {
        const category = await prisma.category.create({
          data: {
            name: body.name,
            icon: body.icon,
            color: body.color,
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
      };

      try {
        // Find category first
        const existing = await prisma.category.findFirst({
          where: { id, userId: req.userId },
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

        const category = await prisma.category.update({
          where: { id },
          data: {
            ...(body.name && { name: body.name }),
            ...(body.icon !== undefined && { icon: body.icon }),
            ...(body.color !== undefined && { color: body.color }),
            ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
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
        // Find category first
        const existing = await prisma.category.findFirst({
          where: { id, userId: req.userId },
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

import { FastifyInstance } from "fastify";
import { prisma } from "../utils/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";

export default async function noteRoutes(fastify: FastifyInstance) {
  // Get notes list
  fastify.get(
    "/",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const query = request.query as {
        page?: string;
        limit?: string;
        categoryId?: string;
        search?: string;
        tags?: string;
        isFavorite?: string;
      };

      const page = parseInt(query.page || "1");
      const limit = parseInt(query.limit || "20");
      const skip = (page - 1) * limit;

      const where: any = {
        userId: req.userId,
        isDeleted: false,
      };

      if (query.categoryId) {
        where.categoryId = query.categoryId;
      }

      if (query.search) {
        where.OR = [
          { title: { contains: query.search, mode: "insensitive" } },
          { content: { contains: query.search, mode: "insensitive" } },
        ];
      }

      if (query.tags) {
        where.tags = {
          hasSome: query.tags.split(","),
        };
      }

      if (query.isFavorite === "true") {
        where.isFavorite = true;
      }

      const [notes, total] = await Promise.all([
        prisma.note.findMany({
          where,
          include: {
            category: {
              select: { id: true, name: true, icon: true, color: true },
            },
          },
          orderBy: { updatedAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.note.count({ where }),
      ]);

      return {
        notes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    },
  );

  // Get note by id
  fastify.get(
    "/:id",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { id } = request.params as { id: string };

      const note = await prisma.note.findFirst({
        where: { id, userId: req.userId },
        include: {
          category: {
            select: { id: true, name: true, icon: true, color: true },
          },
        },
      });

      if (!note) {
        reply.status(404).send({
          error: { message: "Note not found", code: "NOTE_NOT_FOUND" },
        });
        return;
      }

      return note;
    },
  );

  // Create note
  fastify.post(
    "/",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const body = request.body as {
        title: string;
        content?: string;
        htmlContent?: string;
        fileType?: string;
        categoryId?: string;
        tags?: string[];
        metadata?: any;
      };

      try {
        // If categoryId not provided, use user's default category (未分类)
        let categoryId = body.categoryId;
        if (!categoryId) {
          const defaultCategory = await prisma.category.findFirst({
            where: {
              userId: req.userId,
              name: "未分类",
            },
          });
          categoryId = defaultCategory?.id || "";
          // If no default category exists, create one
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

        const note = await prisma.note.create({
          data: {
            title: body.title,
            content: body.content || "",
            htmlContent: body.htmlContent,
            fileType: body.fileType || "markdown",
            categoryId: categoryId,
            tags: body.tags || [],
            metadata: body.metadata || null,
            userId: req.userId,
            version: 1,
          },
          include: {
            category: {
              select: { id: true, name: true, icon: true, color: true },
            },
          },
        });

        // Create initial version
        await prisma.noteVersion.create({
          data: {
            noteId: note.id,
            title: note.title,
            content: note.content,
            version: 1,
          },
        });

        return note;
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

  // Update note
  fastify.put(
    "/:id",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { id } = request.params as { id: string };
      const body = request.body as {
        title?: string;
        content?: string;
        htmlContent?: string;
        categoryId?: string;
        tags?: string[];
        metadata?: any;
        isFavorite?: boolean;
      };

      try {
        // Get current note
        const currentNote = await prisma.note.findFirst({
          where: { id, userId: req.userId },
        });

        if (!currentNote) {
          reply.status(404).send({
            error: { message: "Note not found", code: "NOTE_NOT_FOUND" },
          });
          return;
        }

        // Build update data
        const updateData: any = {};
        if (body.title !== undefined) updateData.title = body.title;
        if (body.content !== undefined) updateData.content = body.content;
        if (body.htmlContent !== undefined)
          updateData.htmlContent = body.htmlContent;
        if (body.categoryId) updateData.categoryId = body.categoryId;
        if (body.tags !== undefined) updateData.tags = body.tags;
        if (body.metadata !== undefined) updateData.metadata = body.metadata;
        if (body.isFavorite !== undefined)
          updateData.isFavorite = body.isFavorite;
        updateData.version = { increment: 1 };

        // Update note
        const note = await prisma.note.update({
          where: { id },
          data: updateData,
          include: {
            category: {
              select: { id: true, name: true, icon: true, color: true },
            },
          },
        });

        // Create version if content changed
        if (
          body.content !== undefined &&
          body.content !== currentNote.content
        ) {
          await prisma.noteVersion.create({
            data: {
              noteId: note.id,
              title: note.title,
              content: note.content,
              version: note.version,
            },
          });
        }

        return note;
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

  // Delete note (soft delete)
  fastify.delete(
    "/:id",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { id } = request.params as { id: string };

      try {
        await prisma.note.updateMany({
          where: { id, userId: req.userId },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });

        return { message: "Note deleted successfully" };
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

  // Restore note
  fastify.patch(
    "/:id/restore",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { id } = request.params as { id: string };

      try {
        const note = await prisma.note.updateMany({
          where: { id, userId: req.userId },
          data: {
            isDeleted: false,
            deletedAt: null,
          },
        });

        if (note.count === 0) {
          reply.status(404).send({
            error: { message: "Note not found", code: "NOTE_NOT_FOUND" },
          });
          return;
        }

        return { message: "Note restored successfully" };
      } catch (error: any) {
        reply.status(400).send({
          error: {
            message: error.message,
            code: "RESTORE_FAILED",
          },
        });
      }
    },
  );

  // Get note versions
  fastify.get(
    "/:id/versions",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { id } = request.params as { id: string };

      const versions = await prisma.noteVersion.findMany({
        where: {
          note: { id, userId: req.userId },
        },
        orderBy: { version: "desc" },
      });

      return versions;
    },
  );

  // Batch sync notes (用于前端批量同步)
  fastify.post(
    "/sync",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const body = request.body as {
        notes: Array<{
          id: string;
          title: string;
          content: string;
          htmlContent?: string;
          fileType: string;
          tags: string[];
          metadata?: any;
          isFavorite: boolean;
          categoryId: string;
          createdAt: number;
          updatedAt: number;
        }>;
      };

      try {
        const results = {
          created: [] as any[],
          updated: [] as any[],
          failed: [] as any[],
        };

        for (const noteData of body.notes) {
          try {
            // Check if note exists
            const existing = await prisma.note.findFirst({
              where: { id: noteData.id, userId: req.userId },
            });

            if (existing) {
              // Update if server version is older
              const serverUpdatedAt = new Date(existing.updatedAt).getTime();
              const clientUpdatedAt = noteData.updatedAt;

              if (clientUpdatedAt > serverUpdatedAt) {
                const updated = await prisma.note.update({
                  where: { id: noteData.id },
                  data: {
                    title: noteData.title,
                    content: noteData.content,
                    htmlContent: noteData.htmlContent,
                    fileType: noteData.fileType,
                    tags: noteData.tags,
                    metadata: noteData.metadata || null,
                    isFavorite: noteData.isFavorite,
                    categoryId: noteData.categoryId,
                  },
                });
                results.updated.push(updated.id);
              }
            } else {
              // Create new note
              const created = await prisma.note.create({
                data: {
                  id: noteData.id,
                  title: noteData.title,
                  content: noteData.content,
                  htmlContent: noteData.htmlContent,
                  fileType: noteData.fileType,
                  tags: noteData.tags,
                  metadata: noteData.metadata || null,
                  isFavorite: noteData.isFavorite,
                  categoryId: noteData.categoryId,
                  userId: req.userId,
                  createdAt: new Date(noteData.createdAt),
                  updatedAt: new Date(noteData.updatedAt),
                },
              });
              results.created.push(created.id);
            }
          } catch (err: any) {
            results.failed.push({ id: noteData.id, error: err.message });
          }
        }

        return results;
      } catch (error: any) {
        reply.status(400).send({
          error: {
            message: error.message,
            code: "SYNC_FAILED",
          },
        });
      }
    },
  );

  // Get deleted notes (recycle bin)
  fastify.get(
    "/deleted",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;

      const notes = await prisma.note.findMany({
        where: {
          userId: req.userId,
          isDeleted: true,
        },
        include: {
          category: {
            select: { id: true, name: true, icon: true, color: true },
          },
        },
        orderBy: { deletedAt: "desc" },
      });

      return { notes };
    },
  );

  // Permanent delete note
  fastify.delete(
    "/deleted/:id",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { id } = request.params as { id: string };

      try {
        await prisma.note.deleteMany({
          where: { id, userId: req.userId },
        });

        return { message: "Note permanently deleted" };
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

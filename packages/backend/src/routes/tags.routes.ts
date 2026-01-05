import { FastifyInstance } from "fastify";
import { prisma } from "../utils/prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { buildUserQuery, canModify, canDelete } from "../utils/permission.helper.js";

export default async function tagsRoutes(fastify: FastifyInstance) {
  // 获取用户的所有标签（用户自己的 + 公有的）
  fastify.get(
    "/",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;

      try {
        const tags = await prisma.tag.findMany({
          where: buildUserQuery(req.userId),
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: { noteTags: true },
            },
          },
        });

        return tags.map((tag) => ({
          ...tag,
          noteCount: tag._count.noteTags,
        }));
      } catch (error) {
        console.error("Failed to fetch tags:", error);
        reply.code(500).send({ error: "Failed to fetch tags" });
      }
    },
  );

  // 获取单个标签
  fastify.get(
    "/:id",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { id } = request.params as { id: string };

      try {
        const tag = await prisma.tag.findFirst({
          where: {
            id,
            userId: req.userId,
          },
          include: {
            noteTags: {
              include: {
                note: {
                  select: {
                    id: true,
                    title: true,
                    updatedAt: true,
                  },
                },
              },
            },
          },
        });

        if (!tag) {
          reply.code(404).send({ error: "Tag not found" });
          return;
        }

        return tag;
      } catch (error) {
        console.error("Failed to fetch tag:", error);
        reply.code(500).send({ error: "Failed to fetch tag" });
      }
    },
  );

  // 创建标签
  fastify.post(
    "/",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { name, color, isPublic } = request.body as {
        name: string;
        color?: string;
        isPublic?: boolean;
      };

      if (!name || name.trim().length === 0) {
        reply.code(400).send({ error: "Tag name is required" });
        return;
      }

      try {
        // 检查是否已存在同名标签
        const existing = await prisma.tag.findFirst({
          where: {
            userId: req.userId,
            name: name.trim(),
          },
        });

        if (existing) {
          reply.code(400).send({ error: "Tag with this name already exists" });
          return;
        }

        const tag = await prisma.tag.create({
          data: {
            name: name.trim(),
            color: color || null,
            isPublic: isPublic ?? false,
            userId: req.userId,
          },
        });

        reply.code(201).send(tag);
      } catch (error) {
        console.error("Failed to create tag:", error);
        reply.code(500).send({ error: "Failed to create tag" });
      }
    },
  );

  // 更新标签
  fastify.put(
    "/:id",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { id } = request.params as { id: string };
      const { name, color, isPublic } = request.body as {
        name?: string;
        color?: string;
        isPublic?: boolean;
      };

      try {
        // 先检查权限
        const existing = await prisma.tag.findUnique({
          where: { id },
        });

        if (!existing) {
          reply.status(404).send({
            error: {
              message: "Tag not found",
              code: "TAG_NOT_FOUND",
            },
          });
          return;
        }

        // 检查权限：只有创建者可以修改
        if (!canModify(existing.userId, req.userId)) {
          reply.status(403).send({
            error: {
              message: "You don't have permission to modify this tag",
              code: "FORBIDDEN",
            },
          });
          return;
        }

        // 如果更新名称，检查是否与其他标签重名
        if (name && name !== existing.name) {
          const duplicate = await prisma.tag.findFirst({
            where: {
              userId: req.userId,
              name: name.trim(),
              id: { not: id },
            },
          });

          if (duplicate) {
            reply
              .code(400)
              .send({ error: "Tag with this name already exists" });
            return;
          }
        }

        const tag = await prisma.tag.update({
          where: { id },
          data: {
            ...(name && { name: name.trim() }),
            ...(color !== undefined && { color }),
            ...(isPublic !== undefined && { isPublic }),
          },
        });

        return tag;
      } catch (error) {
        console.error("Failed to update tag:", error);
        reply.code(500).send({ error: "Failed to update tag" });
      }
    },
  );

  // 删除标签
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
        const existing = await prisma.tag.findUnique({
          where: { id },
        });

        if (!existing) {
          reply.status(404).send({
            error: {
              message: "Tag not found",
              code: "TAG_NOT_FOUND",
            },
          });
          return;
        }

        // 检查权限：只有创建者可以删除
        if (!canDelete(existing.userId, req.userId)) {
          reply.status(403).send({
            error: {
              message: "You don't have permission to delete this tag",
              code: "FORBIDDEN",
            },
          });
          return;
        }

        // Prisma 的 onDelete: Cascade 会自动删除关联的 NoteTag 记录
        await prisma.tag.delete({
          where: { id },
        });

        return { success: true };
      } catch (error) {
        console.error("Failed to delete tag:", error);
        reply.code(500).send({ error: "Failed to delete tag" });
      }
    },
  );

  // 为笔记添加标签
  fastify.post(
    "/notes/:noteId",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { noteId } = request.params as { noteId: string };
      const { tagIds } = request.body as { tagIds: string[] };

      if (!Array.isArray(tagIds)) {
        reply.code(400).send({ error: "tagIds must be an array" });
        return;
      }

      try {
        // 验证笔记是否属于当前用户
        const note = await prisma.note.findFirst({
          where: {
            id: noteId,
            userId: req.userId,
          },
        });

        if (!note) {
          reply.code(404).send({ error: "Note not found" });
          return;
        }

        // 验证所有标签都属于当前用户
        const tags = await prisma.tag.findMany({
          where: {
            id: { in: tagIds },
            userId: req.userId,
          },
        });

        if (tags.length !== tagIds.length) {
          reply.code(400).send({ error: "Some tags are invalid" });
          return;
        }

        // 删除现有的标签关联
        await prisma.noteTag.deleteMany({
          where: { noteId },
        });

        // 创建新的标签关联
        if (tagIds.length > 0) {
          await prisma.noteTag.createMany({
            data: tagIds.map((tagId) => ({
              noteId,
              tagId,
            })),
            skipDuplicates: true,
          });
        }

        // 同时更新 notes 表的 tags 数组（保持兼容性）
        await prisma.note.update({
          where: { id: noteId },
          data: {
            tags: tags.map((t) => t.name),
          },
        });

        // 返回更新后的笔记
        const updatedNote = await prisma.note.findUnique({
          where: { id: noteId },
          include: {
            noteTags: {
              include: {
                tag: true,
              },
            },
          },
        });

        reply.send(updatedNote);
      } catch (error) {
        console.error("Failed to update note tags:", error);
        reply.code(500).send({ error: "Failed to update note tags" });
      }
    },
  );

  // 获取笔记的标签
  fastify.get(
    "/notes/:noteId",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { noteId } = request.params as { noteId: string };

      try {
        // 验证笔记是否属于当前用户
        const note = await prisma.note.findFirst({
          where: {
            id: noteId,
            userId: req.userId,
          },
          include: {
            noteTags: {
              include: {
                tag: true,
              },
            },
          },
        });

        if (!note) {
          reply.code(404).send({ error: "Note not found" });
          return;
        }

        return note.noteTags.map((nt) => nt.tag);
      } catch (error) {
        console.error("Failed to fetch note tags:", error);
        reply.code(500).send({ error: "Failed to fetch note tags" });
      }
    },
  );

  // 根据标签搜索笔记
  fastify.post(
    "/search",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const req = request as any;
      const { tagIds } = request.body as { tagIds: string[] };

      if (!Array.isArray(tagIds) || tagIds.length === 0) {
        reply.code(400).send({ error: "tagIds must be a non-empty array" });
        return;
      }

      try {
        // 查找包含所有指定标签的笔记
        const notes = await prisma.note.findMany({
          where: {
            userId: req.userId,
            isDeleted: false,
            noteTags: {
              some: {
                tagId: { in: tagIds },
              },
            },
          },
          include: {
            noteTags: {
              include: {
                tag: true,
              },
            },
            category: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
        });

        // 进一步过滤：确保笔记包含所有指定的标签
        const filteredNotes = notes.filter((note) =>
          tagIds.every((tagId) =>
            note.noteTags.some((nt) => nt.tagId === tagId),
          ),
        );

        return filteredNotes;
      } catch (error) {
        console.error("Failed to search notes by tags:", error);
        reply.code(500).send({ error: "Failed to search notes" });
      }
    },
  );
}

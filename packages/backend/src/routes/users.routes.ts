import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';

export default async function userRoutes(fastify: FastifyInstance) {
  // Get current user
  fastify.get('/me', {
    onRequest: [authenticate]
  }, async (request, reply) => {
    const req = request as any;
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        preferences: true,
        createdAt: true
      }
    });

    if (!user) {
      reply.status(404).send({
        error: { message: 'User not found', code: 'USER_NOT_FOUND' }
      });
      return;
    }

    return user;
  });

  // Update current user
  fastify.put('/me', {
    onRequest: [authenticate]
  }, async (request, reply) => {
    const req = request as any;
    const body = request.body as {
      displayName?: string;
      username?: string;
      avatar?: string;
      preferences?: any;
    };

    try {
      const user = await prisma.user.update({
        where: { id: req.userId },
        data: {
          ...(body.displayName && { displayName: body.displayName }),
          ...(body.username && { username: body.username }),
          ...(body.avatar && { avatar: body.avatar }),
          ...(body.preferences && { preferences: body.preferences })
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatar: true,
          preferences: true
        }
      });

      return user;
    } catch (error: any) {
      reply.status(400).send({
        error: {
          message: error.message,
          code: 'UPDATE_FAILED'
        }
      });
    }
  });

  // Get user stats
  fastify.get('/me/stats', {
    onRequest: [authenticate]
  }, async (request, reply) => {
    const req = request as any;

    const [noteCount, categoryCount, aiConversationCount] = await Promise.all([
      prisma.note.count({ where: { userId: req.userId, isDeleted: false } }),
      prisma.category.count({ where: { userId: req.userId } }),
      prisma.aiConversation.count({ where: { userId: req.userId } })
    ]);

    return {
      notes: noteCount,
      categories: categoryCount,
      aiConversations: aiConversationCount
    };
  });
}

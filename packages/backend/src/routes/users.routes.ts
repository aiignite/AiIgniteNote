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

  // Get all users (admin only)
  fastify.get('/', {
    onRequest: [authenticate]
  }, async (request, reply) => {
    const query = request.query as {
      page?: string;
      limit?: string;
      search?: string;
    };

    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '50');
    const skip = (page - 1) * limit;

    const where: any = {};

    // 搜索功能
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { username: { contains: query.search, mode: 'insensitive' } },
        { displayName: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatar: true,
          isActive: true,
          emailVerified: true,
          requirePasswordChange: true,
          createdAt: true,
          _count: {
            select: {
              notes: { where: { isDeleted: false } },
              categories: true,
              aiConversations: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  });

  // Get user by ID (admin only)
  fastify.get('/:id', {
    onRequest: [authenticate]
  }, async (request, reply) => {
    const req = request as any;
    const { id } = request.params as { id: string };

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        isActive: true,
        emailVerified: true,
        requirePasswordChange: true,
        createdAt: true,
        _count: {
          select: {
            notes: { where: { isDeleted: false } },
            categories: true,
            aiConversations: true
          }
        }
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

  // Update user by ID (admin only)
  fastify.put('/:id', {
    onRequest: [authenticate]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      username?: string;
      displayName?: string;
      avatar?: string;
      emailVerified?: boolean;
      requirePasswordChange?: boolean;
      preferences?: any;
    };

    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(body.displayName !== undefined && { displayName: body.displayName }),
          ...(body.username !== undefined && { username: body.username }),
          ...(body.avatar !== undefined && { avatar: body.avatar }),
          ...(body.emailVerified !== undefined && { emailVerified: body.emailVerified }),
          ...(body.requirePasswordChange !== undefined && { requirePasswordChange: body.requirePasswordChange }),
          ...(body.preferences && { preferences: body.preferences })
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatar: true,
          isActive: true,
          emailVerified: true,
          requirePasswordChange: true,
          createdAt: true
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

  // Delete user by ID (admin only)
  fastify.delete('/:id', {
    onRequest: [authenticate]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await prisma.user.delete({
        where: { id }
      });

      return { success: true };
    } catch (error: any) {
      reply.status(400).send({
        error: {
          message: error.message,
          code: 'DELETE_FAILED'
        }
      });
    }
  });

  // Toggle user active status (admin only)
  fastify.patch('/:id/toggle-active', {
    onRequest: [authenticate]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      // 获取当前用户状态
      const user = await prisma.user.findUnique({
        where: { id },
        select: { isActive: true }
      });

      if (!user) {
        reply.status(404).send({
          error: { message: 'User not found', code: 'USER_NOT_FOUND' }
        });
        return;
      }

      // 切换状态
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isActive: !user.isActive },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatar: true,
          isActive: true,
          emailVerified: true,
          requirePasswordChange: true,
          createdAt: true
        }
      });

      return updatedUser;
    } catch (error: any) {
      reply.status(400).send({
        error: {
          message: error.message,
          code: 'TOGGLE_FAILED'
        }
      });
    }
  });

  // Reset user password (admin only)
  fastify.post('/:id/reset-password', {
    onRequest: [authenticate]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { newPassword: string };

    if (!body.newPassword || body.newPassword.length < 6) {
      reply.status(400).send({
        error: {
          message: 'Password must be at least 6 characters',
          code: 'INVALID_PASSWORD'
        }
      });
      return;
    }

    try {
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash(body.newPassword, 10);

      await prisma.user.update({
        where: { id },
        data: {
          passwordHash,
          requirePasswordChange: true // 要求用户在下次登录时修改密码
        }
      });

      return { success: true };
    } catch (error: any) {
      reply.status(400).send({
        error: {
          message: error.message,
          code: 'RESET_FAILED'
        }
      });
    }
  });

  // Create user (admin only)
  fastify.post('/', {
    onRequest: [authenticate]
  }, async (request, reply) => {
    const body = request.body as {
      email: string;
      password: string;
      username?: string;
      displayName: string;
      avatar?: string;
      emailVerified?: boolean;
    };

    if (!body.email || !body.password || !body.displayName) {
      reply.status(400).send({
        error: {
          message: 'Email, password, and displayName are required',
          code: 'MISSING_FIELDS'
        }
      });
      return;
    }

    try {
      // 检查邮箱是否已存在
      const existingUser = await prisma.user.findUnique({
        where: { email: body.email }
      });

      if (existingUser) {
        reply.status(400).send({
          error: {
            message: 'Email already exists',
            code: 'EMAIL_EXISTS'
          }
        });
        return;
      }

      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash(body.password, 10);

      const user = await prisma.user.create({
        data: {
          email: body.email,
          passwordHash,
          username: body.username,
          displayName: body.displayName,
          avatar: body.avatar,
          emailVerified: body.emailVerified ?? false,
          requirePasswordChange: true, // 新创建的用户要求修改密码
          preferences: JSON.stringify({
            theme: 'light',
            language: 'zh-CN'
          })
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatar: true,
          isActive: true,
          emailVerified: true,
          requirePasswordChange: true,
          createdAt: true
        }
      });

      return user;
    } catch (error: any) {
      reply.status(400).send({
        error: {
          message: error.message,
          code: 'CREATE_FAILED'
        }
      });
    }
  });
}

import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma.js';
import { generateTokens } from '../utils/jwt.js';
import { FastifyJWT } from '@fastify/jwt';

interface RegisterData {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  private jwt: FastifyJWT;

  constructor(jwt: FastifyJWT) {
    this.jwt = jwt;
  }

  async register(data: RegisterData) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('USER_ALREADY_EXISTS');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        username: data.username,
        displayName: data.displayName || data.username || data.email.split('@')[0]
      }
    });

    // Create default category
    await prisma.category.create({
      data: {
        name: '未分类',
        userId: user.id,
        sortOrder: 0
      }
    });

    // Generate tokens
    const tokens = await generateTokens(this.jwt, {
      userId: user.id,
      email: user.email
    });

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar
      },
      tokens
    };
  }

  async login(data: LoginData) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Verify password
    const isValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const tokens = await generateTokens(this.jwt, {
      userId: user.id,
      email: user.email
    });

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar
      },
      tokens
    };
  }

  async refresh(refreshToken: string) {
    // Verify token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!storedToken) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    // Check if expired
    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: { id: storedToken.id }
      });
      throw new Error('REFRESH_TOKEN_EXPIRED');
    }

    // Generate new tokens
    const tokens = await generateTokens(this.jwt, {
      userId: storedToken.user.id,
      email: storedToken.user.email
    });

    // Delete old refresh token and store new one
    await prisma.refreshToken.delete({
      where: { id: storedToken.id }
    });

    await this.storeRefreshToken(storedToken.user.id, tokens.refreshToken);

    return {
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        username: storedToken.user.username,
        displayName: storedToken.user.displayName,
        avatar: storedToken.user.avatar
      },
      tokens
    };
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken }
    });
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        preferences: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return user;
  }

  private async storeRefreshToken(userId: string, token: string) {
    // Calculate expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt
      }
    });
  }
}

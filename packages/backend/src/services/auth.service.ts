import bcrypt from "bcrypt";
import { prisma } from "../utils/prisma.js";
import { generateTokens } from "../utils/jwt.js";
import { FastifyJWT } from "@fastify/jwt";

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
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("USER_ALREADY_EXISTS");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        username: data.username,
        displayName:
          data.displayName || data.username || data.email.split("@")[0],
      },
    });

    // Create default categories
    await prisma.category.createMany({
      data: [
        { name: "未分类", userId: user.id, sortOrder: 0 },
        {
          name: "工作",
          userId: user.id,
          sortOrder: 1,
          icon: "💼",
          color: "#1890ff",
        },
        {
          name: "学习",
          userId: user.id,
          sortOrder: 2,
          icon: "📚",
          color: "#52c41a",
        },
        {
          name: "生活",
          userId: user.id,
          sortOrder: 3,
          icon: "🏠",
          color: "#faad14",
        },
        {
          name: "灵感",
          userId: user.id,
          sortOrder: 4,
          icon: "💡",
          color: "#722ed1",
        },
      ],
    });

    // Create built-in AI assistants
    await prisma.aiAssistant.createMany({
      data: [
        {
          id: `general_${user.id}`,
          name: "通用助手",
          description: "处理各种通用问答和任务",
          avatar: "🤖",
          model: "",
          systemPrompt:
            "你是一个有用的AI助手，可以帮助用户完成各种任务。请用简洁、准确的方式回答问题。",
          isBuiltIn: true,
          isActive: true,
          sortOrder: 0,
          userId: user.id,
        },
        {
          id: `translator_${user.id}`,
          name: "翻译专家",
          description: "专业的多语言翻译助手",
          avatar: "🌐",
          model: "",
          systemPrompt:
            "你是一个专业的翻译助手。当用户提供文本时，请将其翻译成目标语言。如果用户没有指定目标语言，默认翻译成中文。请保持原文的语气和格式。",
          isBuiltIn: true,
          isActive: true,
          sortOrder: 1,
          userId: user.id,
        },
        {
          id: `writer_${user.id}`,
          name: "写作助手",
          description: "帮助润色和改进文章",
          avatar: "✍️",
          model: "",
          systemPrompt:
            "你是一个专业的写作助手。你可以帮助用户润色文章、改进表达、调整语气。请保持原文的核心意思，同时让表达更加流畅和准确。",
          isBuiltIn: true,
          isActive: true,
          sortOrder: 2,
          userId: user.id,
        },
        {
          id: `coder_${user.id}`,
          name: "编程助手",
          description: "帮助编写和调试代码",
          avatar: "💻",
          model: "",
          systemPrompt:
            "你是一个专业的编程助手。你可以帮助用户编写代码、调试程序、解释技术概念。请提供清晰、可运行的代码示例，并附带必要的注释。",
          isBuiltIn: true,
          isActive: true,
          sortOrder: 3,
          userId: user.id,
        },
        {
          id: `summarizer_${user.id}`,
          name: "摘要助手",
          description: "快速总结文档内容",
          avatar: "📝",
          model: "",
          systemPrompt:
            "你是一个专业的摘要助手。请将用户提供的长文本总结成简洁的要点，保留关键信息和核心观点。",
          isBuiltIn: true,
          isActive: true,
          sortOrder: 4,
          userId: user.id,
        },
      ],
    });

    // Create default model config template (user needs to add their own API key)
    await prisma.modelConfig.create({
      data: {
        name: "默认模型",
        description: "请在设置中配置您的 API Key",
        apiType: "openai",
        model: "gpt-3.5-turbo",
        apiKey: "", // User needs to set this
        apiEndpoint: "https://api.openai.com/v1",
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.9,
        enabled: false, // Disabled until user sets API key
        isDefault: true,
        userId: user.id,
      },
    });

    // Generate tokens
    const tokens = await generateTokens(this.jwt, {
      userId: user.id,
      email: user.email,
    });

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
      },
      tokens,
    };
  }

  async login(data: LoginData) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // Verify password
    const isValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isValid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await generateTokens(this.jwt, {
      userId: user.id,
      email: user.email,
    });

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
      },
      tokens,
    };
  }

  async refresh(refreshToken: string) {
    // Verify token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new Error("INVALID_REFRESH_TOKEN");
    }

    // Check if expired
    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new Error("REFRESH_TOKEN_EXPIRED");
    }

    // Generate new tokens
    const tokens = await generateTokens(this.jwt, {
      userId: storedToken.user.id,
      email: storedToken.user.email,
    });

    // Delete old refresh token and store new one
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    await this.storeRefreshToken(storedToken.user.id, tokens.refreshToken);

    return {
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        username: storedToken.user.username,
        displayName: storedToken.user.displayName,
        avatar: storedToken.user.avatar,
      },
      tokens,
    };
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
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
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
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
        expiresAt,
      },
    });
  }
}

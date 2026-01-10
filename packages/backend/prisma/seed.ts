import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create demo user
  const passwordHash = await bcrypt.hash("demo123456", 10);

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@ainote.com" },
    update: {},
    create: {
      email: "demo@ainote.com",
      username: "demo",
      passwordHash,
      displayName: "Demo User",
      requirePasswordChange: true, // 标记为需要修改密码
      preferences: JSON.stringify({
        theme: "light",
        language: "zh-CN",
      }),
    },
  });

  console.log("✅ Created demo user:", demoUser.email);

  // Create default categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: {
        id: "default-category",
      },
      update: {},
      create: {
        id: "default-category",
        name: "未分类",
        icon: "📁",
        color: "#8b8b8b",
        sortOrder: 0,
        userId: demoUser.id,
      },
    }),
    prisma.category.upsert({
      where: {
        id: "work-category",
      },
      update: {},
      create: {
        id: "work-category",
        name: "工作",
        icon: "💼",
        color: "#1890ff",
        sortOrder: 1,
        userId: demoUser.id,
      },
    }),
    prisma.category.upsert({
      where: {
        id: "personal-category",
      },
      update: {},
      create: {
        id: "personal-category",
        name: "个人",
        icon: "👤",
        color: "#52c41a",
        sortOrder: 2,
        userId: demoUser.id,
      },
    }),
    prisma.category.upsert({
      where: {
        id: "study-category",
      },
      update: {},
      create: {
        id: "study-category",
        name: "学习",
        icon: "📚",
        color: "#fa8c16",
        sortOrder: 3,
        userId: demoUser.id,
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create default tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: {
        userId_name: {
          userId: demoUser.id,
          name: "欢迎",
        },
      },
      update: {},
      create: {
        name: "欢迎",
        color: "#52c41a",
        userId: demoUser.id,
      },
    }),
    prisma.tag.upsert({
      where: {
        userId_name: {
          userId: demoUser.id,
          name: "教程",
        },
      },
      update: {},
      create: {
        name: "教程",
        color: "#1890ff",
        userId: demoUser.id,
      },
    }),
    prisma.tag.upsert({
      where: {
        userId_name: {
          userId: demoUser.id,
          name: "AI",
        },
      },
      update: {},
      create: {
        name: "AI",
        color: "#722ed1",
        userId: demoUser.id,
      },
    }),
    prisma.tag.upsert({
      where: {
        userId_name: {
          userId: demoUser.id,
          name: "工作",
        },
      },
      update: {},
      create: {
        name: "工作",
        color: "#fa8c16",
        userId: demoUser.id,
      },
    }),
    prisma.tag.upsert({
      where: {
        userId_name: {
          userId: demoUser.id,
          name: "学习",
        },
      },
      update: {},
      create: {
        name: "学习",
        color: "#13c2c2",
        userId: demoUser.id,
      },
    }),
  ]);

  console.log(`✅ Created ${tags.length} tags`);

  // Create demo notes
  const notes = await Promise.all([
    prisma.note.upsert({
      where: {
        id: "demo-note-1",
      },
      update: {},
      create: {
        id: "demo-note-1",
        title: "欢迎使用 AiNote 🎉",
        content:
          "# 欢迎使用 AiNote\n\n这是一个功能强大的 AI 笔记应用，支持：\n\n- ✨ Markdown 编辑\n- 🤖 AI 辅助写作\n- 🗂️ 分类管理\n- 🏷️ 标签系统\n- 📱 多端同步\n\n开始你的笔记之旅吧！",
        htmlContent: "<h1>欢迎使用 AiNote</h1>",
        fileType: "markdown",
        categoryId: categories[0].id,
        userId: demoUser.id,
        isFavorite: true,
      },
    }),
    prisma.note.upsert({
      where: {
        id: "demo-note-2",
      },
      update: {},
      create: {
        id: "demo-note-2",
        title: "如何使用 AI 助手？",
        content:
          "# AI 助手使用指南\n\nAiNote 内置了多个 AI 助手，可以帮助你：\n\n1. **写作助手** - 帮助你写作和润色文章\n2. **总结助手** - 快速总结长文本\n3. **翻译助手** - 多语言翻译\n4. **代码助手** - 代码生成和解释\n\n选择一个助手开始对话吧！",
        htmlContent: "<h1>AI 助手使用指南</h1>",
        fileType: "markdown",
        categoryId: categories[0].id,
        userId: demoUser.id,
      },
    }),
  ]);

  console.log(`✅ Created ${notes.length} demo notes`);

  // Create note-tag associations
  await Promise.all([
    // demo-note-1: 欢迎, 教程
    prisma.noteTag.upsert({
      where: {
        noteId_tagId: {
          noteId: notes[0].id,
          tagId: tags[0].id, // 欢迎
        },
      },
      update: {},
      create: {
        noteId: notes[0].id,
        tagId: tags[0].id,
      },
    }),
    prisma.noteTag.upsert({
      where: {
        noteId_tagId: {
          noteId: notes[0].id,
          tagId: tags[1].id, // 教程
        },
      },
      update: {},
      create: {
        noteId: notes[0].id,
        tagId: tags[1].id,
      },
    }),
    // demo-note-2: AI, 教程
    prisma.noteTag.upsert({
      where: {
        noteId_tagId: {
          noteId: notes[1].id,
          tagId: tags[2].id, // AI
        },
      },
      update: {},
      create: {
        noteId: notes[1].id,
        tagId: tags[2].id,
      },
    }),
    prisma.noteTag.upsert({
      where: {
        noteId_tagId: {
          noteId: notes[1].id,
          tagId: tags[1].id, // 教程
        },
      },
      update: {},
      create: {
        noteId: notes[1].id,
        tagId: tags[1].id,
      },
    }),
  ]);

  console.log(`✅ Created note-tag associations`);

  // Create built-in AI assistants
  const assistants = await Promise.all([
    prisma.aiAssistant.upsert({
      where: {
        id: "writing-assistant",
      },
      update: {},
      create: {
        id: "writing-assistant",
        name: "写作助手",
        description: "帮助你进行写作和内容创作",
        systemPrompt:
          "你是一位专业的写作助手，擅长帮助用户进行文章创作、内容润色和修改。请用友好的语气回复，提供有价值的写作建议。",
        avatar: "✍️",
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        maxTokens: 2000,
        sortOrder: 0,
        isActive: true,
        userId: demoUser.id,
      },
    }),
    prisma.aiAssistant.upsert({
      where: {
        id: "summary-assistant",
      },
      update: {},
      create: {
        id: "summary-assistant",
        name: "总结助手",
        description: "快速总结和提炼文章要点",
        systemPrompt:
          "你是一位专业的总结助手，擅长提炼文章要点、生成摘要。请简洁明了地总结用户提供的内容。",
        avatar: "📝",
        model: "gpt-3.5-turbo",
        temperature: 0.5,
        maxTokens: 1000,
        sortOrder: 1,
        isActive: true,
        userId: demoUser.id,
      },
    }),
    prisma.aiAssistant.upsert({
      where: {
        id: "translation-assistant",
      },
      update: {},
      create: {
        id: "translation-assistant",
        name: "翻译助手",
        description: "多语言翻译助手",
        systemPrompt:
          "你是一位专业的翻译助手，擅长中英文互译以及其他语言的翻译。请提供准确、流畅的翻译结果。",
        avatar: "🌍",
        model: "gpt-3.5-turbo",
        temperature: 0.3,
        maxTokens: 2000,
        sortOrder: 2,
        isActive: true,
        userId: demoUser.id,
      },
    }),
    prisma.aiAssistant.upsert({
      where: {
        id: "code-assistant",
      },
      update: {},
      create: {
        id: "code-assistant",
        name: "代码助手",
        description: "代码生成、解释和调试",
        systemPrompt:
          "你是一位专业的编程助手，擅长多种编程语言的代码生成、代码解释和调试。请提供清晰、可运行的代码，并添加必要的注释。",
        avatar: "💻",
        model: "gpt-3.5-turbo",
        temperature: 0.2,
        maxTokens: 2000,
        sortOrder: 3,
        isActive: true,
        userId: demoUser.id,
      },
    }),
  ]);

  console.log(`✅ Created ${assistants.length} AI assistants`);

  // Create demo model configurations
  const modelConfigs = await Promise.all([
    // OpenAI 格式
    prisma.modelConfig.upsert({
      where: { id: "openai-gpt35" },
      update: {},
      create: {
        id: "openai-gpt35",
        name: "OpenAI GPT-3.5",
        description: "OpenAI GPT-3.5 Turbo 模型（OpenAI协议）",
        apiKey: "",
        apiEndpoint: "https://api.openai.com/v1/chat/completions",
        apiType: "openai",
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.9,
        enabled: false,
        isDefault: true,
        userId: demoUser.id,
      },
    }),
    prisma.modelConfig.upsert({
      where: { id: "openai-gpt4" },
      update: {},
      create: {
        id: "openai-gpt4",
        name: "OpenAI GPT-4",
        description: "OpenAI GPT-4 模型（OpenAI协议）",
        apiKey: "",
        apiEndpoint: "https://api.openai.com/v1/chat/completions",
        apiType: "openai",
        model: "gpt-4",
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.9,
        enabled: false,
        isDefault: false,
        userId: demoUser.id,
      },
    }),
    // Anthropic/Claude 格式
    prisma.modelConfig.upsert({
      where: { id: "anthropic-claude" },
      update: {},
      create: {
        id: "anthropic-claude",
        name: "Anthropic Claude",
        description: "Anthropic Claude 模型",
        apiKey: "",
        apiEndpoint: "https://api.anthropic.com/v1/messages",
        apiType: "anthropic",
        model: "claude-3-sonnet-20240229",
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.9,
        enabled: false,
        isDefault: false,
        userId: demoUser.id,
      },
    }),
    // Ollama 本地格式
    prisma.modelConfig.upsert({
      where: { id: "ollama-local" },
      update: {},
      create: {
        id: "ollama-local",
        name: "Ollama 本地模型",
        description: "Ollama 本地部署的开源模型（无需API密钥）",
        apiKey: "",
        apiEndpoint: "http://localhost:11434/api/chat",
        apiType: "ollama",
        model: "llama2",
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.9,
        enabled: false,
        isDefault: false,
        userId: demoUser.id,
      },
    }),
    // LM Studio 本地格式
    prisma.modelConfig.upsert({
      where: { id: "lmstudio-local" },
      update: {},
      create: {
        id: "lmstudio-local",
        name: "LM Studio 本地模型",
        description: "LM Studio 本地部署的模型（无需API密钥）",
        apiKey: "",
        apiEndpoint: "http://localhost:1234/v1/chat/completions",
        apiType: "lmstudio",
        model: "local-model",
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.9,
        enabled: false,
        isDefault: false,
        userId: demoUser.id,
      },
    }),
  ]);

  console.log(`✅ Created ${modelConfigs.length} model configurations`);
  console.log(
    "\n💡 提示: 请在设置 > AI管理 > 模型配置 中填入API密钥来启用模型",
  );
  console.log("\n📋 支持的API类型:");
  console.log(
    "   • OpenAI: OpenAI、Azure OpenAI、DeepSeek、Moonshot等兼容OpenAI格式的API",
  );
  console.log("   • Anthropic: Claude系列、智谱GLM等兼容Anthropic格式的API");
  console.log("   • Ollama: 本地Ollama部署的开源模型");
  console.log("   • LM Studio: 本地LM Studio部署的模型");

  console.log("🎉 Seed completed successfully!");
  console.log("\n📧 Demo account:");
  console.log("   Email: demo@ainote.com");
  console.log("   Password: demo123456");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

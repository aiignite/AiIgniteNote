import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SYSTEM_USER_ID = process.env.SYSTEM_USER_ID || 'system-user-default';

const publicAssistants = [
  {
    id: 'general_public',
    name: '通用助手',
    description: '处理各种通用问答和任务',
    systemPrompt: '你是一个有用的AI助手，可以帮助用户解决各种问题。请用简洁、准确的方式回答问题。',
    avatar: '🤖',
    model: '',
    isActive: true,
    sortOrder: 0,
    isPublic: true,
  },
  {
    id: 'writing_public',
    name: '写作助手',
    description: '帮助你进行写作和内容创作',
    systemPrompt: '你是一个专业的写作助手，擅长帮助用户创作和改进文案。你可以帮助润色文章、改进表达、调整语气，同时保持原文的核心意思。',
    avatar: '✍️',
    model: '',
    isActive: true,
    sortOrder: 1,
    isPublic: true,
  },
  {
    id: 'summary_public',
    name: '总结助手',
    description: '帮你总结文章和内容',
    systemPrompt: '你是一个内容总结专家，能够准确提取核心信息和关键观点。请将用户提供的长文本总结成简洁的要点。',
    avatar: '📝',
    model: '',
    isActive: true,
    sortOrder: 2,
    isPublic: true,
  },
  {
    id: 'translation_public',
    name: '翻译助手',
    description: '帮你翻译各种语言',
    systemPrompt: '你是一个专业的翻译助手，支持多语言互译。当用户提供文本时，请将其翻译成目标语言。如果用户没有指定目标语言，默认翻译成中文。请保持原文的语气和格式。',
    avatar: '🌍',
    model: '',
    isActive: true,
    sortOrder: 3,
    isPublic: true,
  },
  {
    id: 'coding_public',
    name: '代码助手',
    description: '帮助你编写和调试代码',
    systemPrompt: '你是一个编程专家，擅长多种编程语言和开发问题。你可以帮助用户编写代码、调试程序、解释技术概念。请提供清晰、可运行的代码示例，并附带必要的注释。',
    avatar: '💻',
    model: '',
    isActive: true,
    sortOrder: 4,
    isPublic: true,
  },
];

export async function seedPublicAssistants() {
  console.log('开始创建系统公共助手...');

  try {
    // 确保系统用户存在（创建一个虚拟用户）
    await prisma.user.upsert({
      where: { id: SYSTEM_USER_ID },
      update: {},
      create: {
        id: SYSTEM_USER_ID,
        email: 'system@ainote.internal',
        passwordHash: 'unused', // 系统账号不用于登录
        displayName: '系统',
        isActive: false, // 禁用登录
      },
    });
    console.log('✅ 系统用户已就绪');

    // 创建公共助手
    for (const assistant of publicAssistants) {
      await prisma.aiAssistant.upsert({
        where: { id: assistant.id },
        update: {
          name: assistant.name,
          description: assistant.description,
          systemPrompt: assistant.systemPrompt,
          avatar: assistant.avatar,
          isActive: assistant.isActive,
          sortOrder: assistant.sortOrder,
          isPublic: assistant.isPublic,
        },
        create: {
          ...assistant,
          userId: SYSTEM_USER_ID,
        },
      });
      console.log(`✅ ${assistant.name}`);
    }

    console.log('系统公共助手创建完成！');
  } catch (error) {
    console.error('创建系统公共助手失败:', error);
    throw error;
  }
}

seedPublicAssistants()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

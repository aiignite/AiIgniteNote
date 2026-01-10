/**
 * 统一的 AI 助手种子脚本
 *
 * 这个脚本使用统一的助手配置 (assistants.config.ts) 来创建/更新数据库中的助手。
 * 确保数据库中的助手 ID 与前端代码保持一致。
 *
 * 运行方式:
 * npx ts-node prisma/seed-unified-assistants.ts
 */

import { PrismaClient } from "@prisma/client";
import {
  BUILT_IN_ASSISTANTS,
  type AssistantConfig,
} from "./assistants.config.js";

const prisma = new PrismaClient();

// 系统用户 ID（用于创建公有助手）
const SYSTEM_USER_ID = process.env.SYSTEM_USER_ID || "system-user-default";

async function seedUnifiedAssistants() {
  console.log("🌱 开始统一 AI 助手数据...");
  console.log("=" .repeat(60));

  try {
    // 1. 确保系统用户存在
    await ensureSystemUser();

    // 2. 同步所有内置助手
    let createdCount = 0;
    let updatedCount = 0;

    for (const config of BUILT_IN_ASSISTANTS) {
      const result = await syncAssistant(config);
      if (result === "created") createdCount++;
      if (result === "updated") updatedCount++;
    }

    console.log("=" .repeat(60));
    console.log(`✅ 助手数据同步完成！`);
    console.log(`   - 新创建: ${createdCount} 个`);
    console.log(`   - 已更新: ${updatedCount} 个`);
    console.log(`   - 总计: ${BUILT_IN_ASSISTANTS.length} 个内置助手`);

    // 3. 显示助手列表
    console.log("\n📋 当前内置助手列表:");
    console.log("-" .repeat(60));
    BUILT_IN_ASSISTANTS.forEach((assistant, index) => {
      console.log(
        `${index + 1}. ${assistant.avatar} ${assistant.name} (ID: ${assistant.id})`,
      );
    });
    console.log("-" .repeat(60));

  } catch (error) {
    console.error("❌ 种子数据失败:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 确保系统用户存在
 */
async function ensureSystemUser() {
  await prisma.user.upsert({
    where: { id: SYSTEM_USER_ID },
    update: {},
    create: {
      id: SYSTEM_USER_ID,
      email: "system@ainote.internal",
      passwordHash: "unused", // 系统账号不用于登录
      username: "system",
      displayName: "系统",
      isActive: false, // 禁用登录
    },
  });
  console.log(`✅ 系统用户已就绪 (ID: ${SYSTEM_USER_ID})`);
}

/**
 * 同步单个助手到数据库
 *
 * @returns "created" | "updated" | "skipped"
 */
async function syncAssistant(
  config: AssistantConfig,
): Promise<"created" | "updated" | "skipped"> {
  const existing = await prisma.aiAssistant.findUnique({
    where: { id: config.id },
  });

  if (!existing) {
    // 创建新助手
    await prisma.aiAssistant.create({
      data: {
        id: config.id,
        name: config.name,
        description: config.description,
        systemPrompt: config.systemPrompt,
        avatar: config.avatar,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        isActive: config.isActive,
        sortOrder: config.sortOrder,
        isPublic: config.isPublic,
        userId: SYSTEM_USER_ID,
      },
    });
    console.log(`  ✓ 创建: ${config.name} (${config.id})`);
    return "created";
  }

  // 检查是否需要更新
  const needsUpdate =
    existing.name !== config.name ||
    existing.description !== config.description ||
    existing.systemPrompt !== config.systemPrompt ||
    existing.avatar !== config.avatar ||
    existing.temperature !== config.temperature ||
    existing.maxTokens !== config.maxTokens ||
    existing.isActive !== config.isActive ||
    existing.sortOrder !== config.sortOrder ||
    existing.isPublic !== config.isPublic;

  if (needsUpdate) {
    await prisma.aiAssistant.update({
      where: { id: config.id },
      data: {
        name: config.name,
        description: config.description,
        systemPrompt: config.systemPrompt,
        avatar: config.avatar,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        isActive: config.isActive,
        sortOrder: config.sortOrder,
        isPublic: config.isPublic,
      },
    });
    console.log(`  ↻ 更新: ${config.name} (${config.id})`);
    return "updated";
  }

  console.log(`  ⊙ 跳过: ${config.name} (${config.id}) - 已是最新`);
  return "skipped";
}

// 运行种子脚本
seedUnifiedAssistants()
  .then(() => {
    console.log("\n🎉 统一种子数据完成！");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 失败:", error);
    process.exit(1);
  });

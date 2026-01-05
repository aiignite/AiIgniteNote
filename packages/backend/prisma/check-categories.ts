import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkCategories() {
  console.log("开始检查分类数据...\n");

  // 获取所有分类
  const allCategories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      userId: true,
      isPublic: true,
    },
  });

  console.log(`数据库中共有 ${allCategories.length} 个分类\n`);

  // 按用户分组统计
  const byUser: Record<string, any> = {};
  for (const cat of allCategories) {
    if (!byUser[cat.userId]) {
      byUser[cat.userId] = [];
    }
    byUser[cat.userId].push(cat);
  }

  // 显示每个用户的分类
  for (const [userId, categories] of Object.entries(byUser)) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, displayName: true },
    });

    const userEmail = user?.email || "未知用户";
    const publicCount = categories.filter((c) => c.isPublic).length;

    console.log(`用户: ${userEmail} (${userId})`);
    console.log(`  - 总分类数: ${categories.length}`);
    console.log(`  - 公开分类: ${publicCount}`);
    console.log(`  - 私有分类: ${categories.length - publicCount}`);
    console.log(`  - 分类列表: ${categories.map((c) => c.name).join(", ")}`);
    console.log("");
  }

  // 检查演示用户可以看到的分类
  const demoUser = await prisma.user.findFirst({
    where: { email: "demo@ainote.com" },
  });

  if (demoUser) {
    console.log(`========================================`);
    console.log(`演示用户 ${demoUser.email} 可以看到的分类:`);
    console.log(`========================================\n`);

    const visibleCategories = await prisma.category.findMany({
      where: {
        OR: [{ userId: demoUser.id }, { isPublic: true }],
      },
      select: {
        id: true,
        name: true,
        userId: true,
        isPublic: true,
      },
    });

    console.log(`总共 ${visibleCategories.length} 个分类:\n`);

    visibleCategories.forEach(async (cat) => {
      const isOwn = cat.userId === demoUser.id;
      const user = await prisma.user.findUnique({
        where: { id: cat.userId },
        select: { email: true },
      });
      console.log(`- ${cat.name}`);
      console.log(`  所有者: ${user?.email || cat.userId}`);
      console.log(`  类型: ${isOwn ? "自己的" : "公开的 (其他人)"}`);
      console.log("");
    });
  }
}

checkCategories()
  .then(() => {
    console.log("\n脚本执行完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("错误:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

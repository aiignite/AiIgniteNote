import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAndFixNotes() {
  console.log("开始检查笔记数据...");

  // 获取所有笔记
  const allNotes = await prisma.note.findMany({
    select: {
      id: true,
      title: true,
      userId: true,
      isPublic: true,
    },
  });

  console.log(`数据库中共有 ${allNotes.length} 个笔记`);

  // 统计信息
  const userNotes = allNotes.filter((n) => n.userId);
  const publicNotes = allNotes.filter((n) => n.isPublic);

  console.log(`- 有 userId 的笔记: ${userNotes.length}`);
  console.log(`- 公有笔记: ${publicNotes.length}`);
  console.log(`- 私有笔记: ${allNotes.length - publicNotes.length}`);

  // 获取演示用户
  const demoUser = await prisma.user.findFirst({
    where: {
      email: "demo@ainote.com",
    },
  });

  if (!demoUser) {
    console.error("❌ 找不到演示用户，请先创建用户");
    return;
  }

  console.log(`\n演示用户: ${demoUser.email} (${demoUser.id})`);

  // 检查每个笔记的 userId
  let needsFixCount = 0;
  for (const note of allNotes) {
    const user = await prisma.user.findUnique({
      where: { id: note.userId },
    });

    if (!user) {
      console.log(`⚠ 笔记 "${note.title}" 的 userId 无效: ${note.userId}`);
      needsFixCount++;
    }
  }

  if (needsFixCount > 0) {
    console.log(`\n发现 ${needsFixCount} 个笔记的 userId 无效`);
    console.log("需要修复这些笔记，将它们分配给演示用户");

    // 修复无效的笔记
    let fixedCount = 0;
    for (const note of allNotes) {
      const user = await prisma.user.findUnique({
        where: { id: note.userId },
      });

      if (!user) {
        await prisma.note.update({
          where: { id: note.id },
          data: {
            userId: demoUser.id,
          },
        });
        console.log(`✓ 已修复笔记: ${note.title}`);
        fixedCount++;
      }
    }

    console.log(`\n✓ 已修复 ${fixedCount} 个笔记`);
  } else {
    console.log("\n✓ 所有笔记的 userId 都有效");
  }

  // 最终验证：查询当前用户能看到的所有笔记
  const visibleNotes = await prisma.note.findMany({
    where: {
      OR: [{ userId: demoUser.id }, { isPublic: true }],
      isDeleted: false,
    },
  });

  console.log(
    `\n用户 ${demoUser.email} 可以看到 ${visibleNotes.length} 个笔记`,
  );
  console.log(`(包括自己的笔记和公有笔记)`);
}

checkAndFixNotes()
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

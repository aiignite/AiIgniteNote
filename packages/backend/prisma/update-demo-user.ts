import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Updating demo user...");

  // 更新 demo 用户，添加 requirePasswordChange 标记
  const demoUser = await prisma.user.update({
    where: { email: "demo@ainote.com" },
    data: {
      requirePasswordChange: true,
    },
  });

  console.log("✅ Demo user updated:", demoUser.email);
  console.log("   requirePasswordChange:", demoUser.requirePasswordChange);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

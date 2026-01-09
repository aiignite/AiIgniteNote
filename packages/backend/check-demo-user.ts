import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "demo@ainote.com" },
    select: {
      email: true,
      requirePasswordChange: true,
      passwordChangedAt: true,
    },
  });

  console.log("Demo User Status:");
  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

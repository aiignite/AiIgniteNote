const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const assistants = await prisma.ai_assistant.findMany({
    select: {
      id: true,
      name: true,
      isBuiltIn: true,
      sortOrder: true,
    },
    orderBy: {
      sortOrder: 'asc',
    },
  });

  console.log('AI 助手列表:');
  console.log('==============');
  assistants.forEach((a) => {
    console.log(`ID: ${a.id.padEnd(20)} | Name: ${a.name.padEnd(15)} | BuiltIn: ${a.isBuiltIn ? 'Yes' : 'No'.padEnd(3)} | Order: ${a.sortOrder}`);
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

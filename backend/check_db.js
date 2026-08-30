const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    console.log('--- USERS ---');
    console.log(JSON.stringify(users, null, 2));

    const reports = await prisma.report.findMany({
      select: {
        id: true,
        userId: true,
        status: true,
        damageType: true,
        imageUrl: true
      }
    });

    console.log('--- REPORTS ---');
    console.log(JSON.stringify(reports, null, 2));
  } catch (err) {
    console.error('Error reading database:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reports = await prisma.report.findMany({
    select: {
      id: true,
      imageUrl: true
    },
    orderBy: {
      id: 'desc'
    },
    take: 3
  });
  
  for (const r of reports) {
    console.log(`Report ID: ${r.id}`);
    console.log(`Image URL length: ${r.imageUrl.length}`);
    console.log(`Image URL snippet: ${r.imageUrl.substring(0, 100)}`);
    console.log('---');
  }
  process.exit(0);
}

main();

const { PrismaClient } = require('@prisma/client');

const urls = [
  'mysql://root:Madhu%402007@localhost:3306/road_damage_db',
  'mysql://root:Madhu@2007@localhost:3306/road_damage_db',
  'mysql://root:Madhu%402007@127.0.0.1:3306/road_damage_db',
  'mysql://root:Madhu@2007@127.0.0.1:3306/road_damage_db',
  'mysql://root:madhu%402007@localhost:3306/road_damage_db',
  'mysql://root:madhu@2007@localhost:3306/road_damage_db',
  'mysql://root:madhu%402007@127.0.0.1:3306/road_damage_db',
  'mysql://root:madhu@2007@127.0.0.1:3306/road_damage_db',
];

async function testConnection(url) {
  process.env.DATABASE_URL = url;
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
  });

  try {
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error(`Error for ${url.replace(/:([^:@]+)@/, ':****@')}:`, error.message);
    await prisma.$disconnect();
    return false;
  }
}

async function main() {
  console.log('Testing specific MySQL password combinations...');
  for (const url of urls) {
    const success = await testConnection(url);
    if (success) {
      console.log(`SUCCESS: Connected with URL: ${url}`);
      // Write the working URL to the .env file
      const fs = require('fs');
      const envPath = './.env';
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/DATABASE_URL=".*"/, `DATABASE_URL="${url}"`);
      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log('Updated .env with working DATABASE_URL');
      process.exit(0);
    }
  }
  console.log('FAILED: None of the URL forms worked.');
  process.exit(1);
}

main();

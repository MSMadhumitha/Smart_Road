const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

// Auto-run raw SQL to ensure reports table imageUrl is LONGTEXT in database
prisma.$connect()
  .then(async () => {
    console.log('Database connected successfully. Checking schema...');
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE reports MODIFY image_url LONGTEXT');
      console.log('Schema verified: image_url modified to LONGTEXT successfully.');
    } catch (err) {
      console.error('Failed to auto-modify schema (might already be LONGTEXT or custom DB):', err.message);
    }
  })
  .catch((err) => {
    console.warn('Could not connect to database on startup to verify schema (offline/no network):', err.message);
  });

module.exports = prisma;

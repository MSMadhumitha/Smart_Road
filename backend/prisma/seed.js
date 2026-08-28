const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@smartroad.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecurePassword123!';

  console.log(`Seeding admin user: ${adminEmail}`);

  // Hash the admin password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Upsert user to avoid duplicates if rerun
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      name: 'System Admin',
      role: 'admin',
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'System Admin',
      role: 'admin',
    },
  });

  console.log('Seeded Admin user:', admin.email);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

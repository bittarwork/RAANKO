/**
 * Seed a Super Admin user for local development.
 * Usage: pnpm --filter @raanko/api exec tsx prisma/seed-super-admin.ts
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@raanko.com').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMeAdmin123!';

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: ulid(),
        email,
        passwordHash: await bcrypt.hash(password, 12),
        firstName: 'Super',
        lastName: 'Admin',
        emailVerifiedAt: new Date(),
      },
    });
    console.log(`Created user ${email}`);
  } else {
    console.log(`User ${email} already exists`);
  }

  const existing = await prisma.platformRoleAssignment.findFirst({
    where: { userId: user.id, role: 'super_admin' },
  });
  if (!existing) {
    await prisma.platformRoleAssignment.create({
      data: {
        id: ulid(),
        userId: user.id,
        role: 'super_admin',
        isActive: true,
      },
    });
    console.log('Assigned super_admin role');
  }

  console.log('Done. Login via POST /api/v1/auth/platform/login');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

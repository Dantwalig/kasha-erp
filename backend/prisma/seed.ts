import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PERMISSIONS = [
  'users:read',
  'users:write',
  'roles:read',
  'roles:manage',
  'permissions:read',
  'permissions:manage',
  'inventory:read',
  'inventory:write',
  'procurement:read',
  'procurement:write',
  'procurement:approve',
  'warehouse:read',
  'warehouse:write',
  'finance:read',
  'finance:write',
  'crm:read',
  'crm:write',
  'hr:read',
  'hr:write',
  'hr:approve',
  'reporting:read',
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: PERMISSIONS, // admin gets everything
  manager: [
    'users:read',
    'roles:read',
    'permissions:read',
    'inventory:read',
    'inventory:write',
    'procurement:read',
    'procurement:write',
    'procurement:approve',
    'warehouse:read',
    'warehouse:write',
    'finance:read',
    'finance:write',
    'crm:read',
    'crm:write',
    'hr:read',
    'hr:write',
    'hr:approve',
    'reporting:read',
  ],
  employee: [
    'users:read',
    'inventory:read',
    'procurement:read',
    'procurement:write',
    'warehouse:read',
    'warehouse:write',
    'finance:read',
    'crm:read',
    'crm:write',
    'hr:read',
    'hr:write',
  ],
};

async function main() {
  console.log('Seeding permissions...');
  const permissionRecords = await Promise.all(
    PERMISSIONS.map((code) =>
      prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code },
      }),
    ),
  );
  const permissionByCode = Object.fromEntries(
    permissionRecords.map((p) => [p.code, p]),
  );

  console.log('Seeding roles...');
  for (const [roleName, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });

    for (const code of permCodes) {
      const permission = permissionByCode[code];
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  console.log('Seeding admin user...');
  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: 'admin' },
  });

  const passwordHash = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kasha.dev' },
    update: {},
    create: {
      email: 'admin@kasha.dev',
      passwordHash,
      firstName: 'Kasha',
      lastName: 'Admin',
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  console.log('Seed complete. Admin login: admin@kasha.dev / Admin123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

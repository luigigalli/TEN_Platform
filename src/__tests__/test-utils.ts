import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth';

const prisma = new PrismaClient();

export async function createTestRole(name: string, permissions: string[]) {
  return await prisma.role.create({
    data: {
      name,
      permissions: {
        create: permissions.map(name => ({ name }))
      }
    }
  });
}

export async function createTestUser(email: string, fname: string, lname: string, roleIds: string[]) {
  const hashedPassword = await hashPassword('Test123!@#');
  
  return await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fname,
      lname,
      roles: {
        create: roleIds.map(roleId => ({ roleId }))
      }
    }
  });
}

export async function cleanupTestData() {
  await prisma.userRole.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
}

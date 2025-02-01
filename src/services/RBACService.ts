import { PrismaClient, Permission, Role } from '@prisma/client';

export class RBACService {
  constructor(private prisma: PrismaClient) {}

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return false;
    }

    // Check direct permissions
    if (user.permissions.some((p: Permission) => p.name === permission)) {
      return true;
    }

    // Check role permissions
    return user.roles.some((userRole: any) => 
      userRole.role.permissions.some((p: Permission) => p.name === permission)
    );
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return [];
    }

    const directPermissions = user.permissions.map((p: Permission) => p.name);
    const rolePermissions = user.roles.flatMap((userRole: any) => 
      userRole.role.permissions.map((p: Permission) => p.name)
    );

    return [...new Set([...directPermissions, ...rolePermissions])];
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.create({
      data: {
        userId,
        roleId
      }
    });
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.deleteMany({
      where: {
        userId,
        roleId
      }
    });
  }

  async createRole(name: string, permissions: string[]): Promise<Role> {
    return await this.prisma.role.create({
      data: {
        name,
        permissions: {
          create: permissions.map(name => ({ name }))
        }
      }
    });
  }

  async updateRole(roleId: string, permissions: string[]): Promise<Role> {
    // First delete existing permissions
    await this.prisma.permission.deleteMany({
      where: {
        roleId
      }
    });

    // Then create new permissions
    return await this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          create: permissions.map(name => ({ name }))
        }
      },
      include: {
        permissions: true
      }
    });
  }

  async deleteRole(roleId: string): Promise<void> {
    await this.prisma.role.delete({
      where: { id: roleId }
    });
  }
}

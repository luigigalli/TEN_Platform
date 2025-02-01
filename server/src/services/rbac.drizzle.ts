import { db } from '../../../db';
import { roles, permissions, users, userRoles, rolePermissions } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

export class RBACService {
  async getRoles() {
    const rolesWithPermissions = await db.query.roles.findMany({
      with: {
        permissions: {
          with: {
            permission: true
          }
        }
      }
    });

    return rolesWithPermissions.map(role => ({
      ...role,
      permissions: role.permissions.map(rp => rp.permission)
    }));
  }

  async getRole(id: string) {
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, id),
      with: {
        permissions: {
          with: {
            permission: true
          }
        }
      }
    });

    if (!role) return null;

    return {
      ...role,
      permissions: role.permissions.map(rp => rp.permission)
    };
  }

  async createRole(name: string, description: string, permissionIds: string[]) {
    const [role] = await db.insert(roles)
      .values({
        name,
        description,
        isActive: true
      })
      .returning();

    if (permissionIds.length > 0) {
      await db.insert(rolePermissions)
        .values(
          permissionIds.map(permissionId => ({
            roleId: role.id,
            permissionId
          }))
        );
    }

    return this.getRole(role.id);
  }

  async updateRole(id: string, name: string, description: string, permissionIds: string[]) {
    const [role] = await db.update(roles)
      .set({
        name,
        description,
        updatedAt: new Date()
      })
      .where(eq(roles.id, id))
      .returning();

    // Remove existing permissions
    await db.delete(rolePermissions)
      .where(eq(rolePermissions.roleId, id));

    // Add new permissions
    if (permissionIds.length > 0) {
      await db.insert(rolePermissions)
        .values(
          permissionIds.map(permissionId => ({
            roleId: id,
            permissionId
          }))
        );
    }

    return this.getRole(role.id);
  }

  async deleteRole(id: string) {
    // First delete role permissions
    await db.delete(rolePermissions)
      .where(eq(rolePermissions.roleId, id));

    // Then delete user roles
    await db.delete(userRoles)
      .where(eq(userRoles.roleId, id));

    // Finally delete the role
    await db.delete(roles)
      .where(eq(roles.id, id));
  }

  async getRolePermissions(id: string) {
    const role = await this.getRole(id);
    return role?.permissions || [];
  }

  async getUserPermissions(userId: string) {
    console.log('Getting permissions for user:', userId);
    const userWithRoles = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        roles: {
          with: {
            role: {
              with: {
                permissions: {
                  with: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log('User with roles:', JSON.stringify(userWithRoles, null, 2));

    if (!userWithRoles) return [];

    const permissions = new Set<string>();
    userWithRoles.roles.forEach(ur => {
      console.log('Processing role:', ur.role.name);
      ur.role.permissions.forEach(rp => {
        console.log('Adding permission:', rp.permission.name);
        permissions.add(rp.permission.name);
      });
    });

    const permissionArray = Array.from(permissions);
    console.log('Final permissions:', permissionArray);
    return permissionArray;
  }

  async hasPermission(userId: string, permissionName: string) {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permissionName);
  }

  async assignRoleToUser(userId: string, roleId: string) {
    console.log('Assigning role to user:', { userId, roleId });
    const [userRole] = await db.insert(userRoles)
      .values({
        userId,
        roleId,
      })
      .returning();
    console.log('Role assigned successfully:', userRole);
    return userRole;
  }

  async removeRoleFromUser(userId: string, roleId: string) {
    await db.delete(userRoles)
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleId, roleId)
        )
      );
  }

  async getPermissions() {
    return db.select().from(permissions);
  }
}

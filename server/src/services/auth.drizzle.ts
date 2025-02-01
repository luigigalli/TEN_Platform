import { db } from '../../../db';
import { users, userRoles as userRolesTable, roles, permissions, rolePermissions } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

export class AuthService {
  async login(username: string, password: string) {
    try {
      // Find user by username
      const [user] = await db.select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Fetch user roles with permissions
      const userWithRoles = await db
        .select({
          user: users,
          role: roles,
          permission: permissions
        })
        .from(users)
        .where(eq(users.id, user.id))
        .leftJoin(userRolesTable, eq(userRolesTable.userId, users.id))
        .leftJoin(roles, eq(roles.id, userRolesTable.roleId))
        .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
        .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId));

      if (!userWithRoles.length) {
        throw new Error('User roles not found');
      }

      // Transform the results into a more usable format
      const userRolesMap = new Map();
      userWithRoles.forEach(ur => {
        if (!ur.role) return;

        if (!userRolesMap.has(ur.role.id)) {
          userRolesMap.set(ur.role.id, {
            id: ur.role.id,
            name: ur.role.name,
            description: ur.role.description,
            permissions: []
          });
        }

        if (ur.permission) {
          const role = userRolesMap.get(ur.role.id);
          role.permissions.push(ur.permission);
        }
      });

      const userRoles = Array.from(userRolesMap.values());

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          username: user.username,
          roles: userRoles.map(r => r.name)
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      const { password: _, ...userWithoutPassword } = user;
      return {
        user: {
          ...userWithoutPassword,
          roles: userRoles
        },
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout(token: string) {
    // Since we're using JWTs, we don't need to do anything server-side
    // The client will handle removing the token
    return true;
  }

  async getCurrentUser(userId: string) {
    const userWithRoles = await db
      .select({
        user: users,
        role: roles,
        permission: permissions
      })
      .from(users)
      .where(eq(users.id, userId))
      .leftJoin(userRolesTable, eq(userRolesTable.userId, users.id))
      .leftJoin(roles, eq(roles.id, userRolesTable.roleId))
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId));

    if (!userWithRoles.length) {
      throw new Error('User not found');
    }

    // Transform the results into a more usable format
    const userRolesMap = new Map();
    userWithRoles.forEach(ur => {
      if (!ur.role) return;

      if (!userRolesMap.has(ur.role.id)) {
        userRolesMap.set(ur.role.id, {
          id: ur.role.id,
          name: ur.role.name,
          description: ur.role.description,
          permissions: []
        });
      }

      if (ur.permission) {
        const role = userRolesMap.get(ur.role.id);
        role.permissions.push(ur.permission);
      }
    });

    const { password: _, ...userWithoutPassword } = userWithRoles[0].user;
    return {
      user: {
        ...userWithoutPassword,
        roles: Array.from(userRolesMap.values())
      }
    };
  }
}

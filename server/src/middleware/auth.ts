import { type Request, type Response, type NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { db } from '../../../db';
import { users, userRoles, roles, permissions, rolePermissions } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = StatusCodes.UNAUTHORIZED,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('No token provided', 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };

    // Fetch user with roles and permissions
    const userWithRoles = await db
      .select({
        user: users,
        role: roles,
        permission: permissions
      })
      .from(users)
      .where(eq(users.id, decoded.id))
      .leftJoin(userRoles, eq(userRoles.userId, users.id))
      .leftJoin(roles, eq(roles.id, userRoles.roleId))
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId));

    if (!userWithRoles.length) {
      throw new AuthError('User not found', 'USER_NOT_FOUND');
    }

    // Transform the results into a more usable format
    const userRolesMap = new Map();
    userWithRoles.forEach(ur => {
      if (!ur.role) return;

      if (!userRolesMap.has(ur.role.id)) {
        userRolesMap.set(ur.role.id, {
          ...ur.role,
          permissions: []
        });
      }

      if (ur.permission) {
        const role = userRolesMap.get(ur.role.id);
        role.permissions.push(ur.permission);
      }
    });

    const { password, ...userWithoutPassword } = userWithRoles[0].user;
    req.user = {
      ...userWithoutPassword,
      roles: Array.from(userRolesMap.values())
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthError('Invalid token', 'INVALID_TOKEN'));
    } else {
      next(error);
    }
  }
}
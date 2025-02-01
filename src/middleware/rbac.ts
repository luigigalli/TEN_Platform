import { Request, Response, NextFunction } from 'express';
import { RBACService } from '../services/rbac';
import { UnauthorizedError, ForbiddenError } from '../errors/types';
import { PrismaClient } from '@prisma/client';

interface RequestWithUser extends Request {
  user?: {
    id: string;
  };
}

export const rbacMiddleware = async (req: RequestWithUser, _res: Response, next: NextFunction) => {
  const prisma = new PrismaClient();
  try {
    // Check if route requires authentication
    if (req.path.startsWith('/api/')) {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const rbacService = new RBACService();
      let requiredPermission: string;

      // Determine required permission based on route
      if (req.path.startsWith('/api/admin')) {
        requiredPermission = 'admin:access';
      } else if (req.path.startsWith('/api/protected')) {
        requiredPermission = 'protected:access';
      } else {
        // No specific permission required for other routes
        return next();
      }

      const hasPermission = await rbacService.hasPermission(req.user.id, requiredPermission);
      if (!hasPermission) {
        throw new ForbiddenError('Insufficient permissions');
      }
    }

    next();
  } catch (error) {
    next(error);
  } finally {
    await prisma.$disconnect();
  }
};

export function requirePermission(permission: string) {
  return async (req: RequestWithUser, _res: Response, next: NextFunction) => {
    const prisma = new PrismaClient();
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const rbacService = new RBACService();
      const hasPermission = await rbacService.hasPermission(req.user.id, permission);

      if (!hasPermission) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    } finally {
      await prisma.$disconnect();
    }
  };
}

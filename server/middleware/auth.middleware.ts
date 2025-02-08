import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthError } from '../errors';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('[Auth] Authorization header:', authHeader ? 'present' : 'missing');
    
    if (!authHeader) {
      throw new AuthError('No authorization header');
    }

    const [type, token] = authHeader.split(' ');
    console.log('[Auth] Token type:', type);
    
    if (type !== 'Bearer' || !token) {
      throw new AuthError('Invalid authorization header');
    }

    const payload = AuthService.verifyToken(token);
    console.log('[Auth] Token payload:', payload);
    
    req.user = payload;
    next();
  } catch (error) {
    console.error('[Auth] Authentication error:', error);
    if (error instanceof AuthError) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    next();
  };
};

export const requirePermissions = (...requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      // Get user's permissions from database to ensure they're up to date
      const user = await req.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, req.user!.userId)
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const hasAllPermissions = requiredPermissions.every(
        permission => user.permissions.includes(permission)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

import { Request, Response, NextFunction } from 'express';
import { db } from '../../db';
import { users, permissions } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';

export function authorizeResource(resource: string, action: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user as any;
            if (!user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            // Check if user has required permission
            const permissionName = `${resource}:${action}`;

            // For admin role, grant all permissions
            if (user.role === 'admin') {
                return next();
            }

            // Check user roles and their permissions
            const hasPermission = user.roles?.some((role: any) => 
                role.permissions?.some((permission: any) => 
                    permission.name === permissionName
                )
            );

            if (hasPermission) {
                return next();
            }

            return res.status(403).json({ message: 'Forbidden' });
        } catch (error) {
            next(error);
        }
    };
}

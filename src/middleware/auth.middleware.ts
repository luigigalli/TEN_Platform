import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppDataSource } from '../data-source';
import { User } from '../models/User';
import { Role } from '../entities/Role';
import { Permission } from '../entities/Permission';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Check for access token
        const accessToken = req.headers.authorization?.split(' ')[1];
        if (!accessToken) {
            throw new UnauthorizedError('No token provided');
        }

        try {
            // Verify access token
            const decoded = verifyToken(accessToken);
            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOne({
                where: { id: decoded.userId },
                relations: ['roles', 'roles.permissions']
            });

            if (!user) {
                throw new UnauthorizedError('User not found');
            }

            if (user.status !== 'active') {
                throw new UnauthorizedError('Account is not active');
            }

            req.user = user;
            next();
        } catch (error) {
            // If access token is expired, try refresh token
            const refreshToken = req.cookies?.refreshToken;
            if (!refreshToken) {
                throw new UnauthorizedError('Session expired');
            }

            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOne({
                where: { refreshToken },
                relations: ['roles', 'roles.permissions']
            });

            if (!user) {
                throw new UnauthorizedError('Invalid refresh token');
            }

            // Generate new access token
            const newAccessToken = verifyToken({ userId: user.id });
            res.setHeader('Authorization', `Bearer ${newAccessToken}`);

            req.user = user;
            next();
        }
    } catch (error) {
        next(error);
    }
};

export const authorize = (requiredPermissions: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            throw new UnauthorizedError('User not authenticated');
        }

        // Get user's roles and permissions
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
            where: { id: req.user.id },
            relations: ['roles', 'roles.permissions']
        });

        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        // Check if user has required permissions
        const userPermissions = new Set<string>();
        for (const role of user.roles) {
            for (const permission of role.permissions) {
                userPermissions.add(`${permission.resource}:${permission.action}`);
            }
        }

        const hasAllPermissions = requiredPermissions.every(permission => 
            userPermissions.has(permission) || userPermissions.has(`${permission.split(':')[0]}:manage`)
        );

        if (!hasAllPermissions) {
            throw new ForbiddenError('Insufficient permissions');
        }

        next();
    };
};

export const authorizeResource = (resource: string, action: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            throw new UnauthorizedError('User not authenticated');
        }

        // Get user's roles and permissions
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
            where: { id: req.user.id },
            relations: ['roles', 'roles.permissions']
        });

        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        // Check if user has required permission
        const hasPermission = user.roles.some(role =>
            role.permissions.some(permission =>
                (permission.resource === resource && (permission.action === action || permission.action === 'manage'))
            )
        );

        if (!hasPermission) {
            throw new ForbiddenError(`Insufficient permissions for ${action} on ${resource}`);
        }

        next();
    };
};

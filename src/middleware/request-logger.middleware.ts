import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithId extends Request {
    id?: string;
}

export const requestLogger = (req: RequestWithId, res: Response, next: NextFunction) => {
    // Generate unique request ID
    req.id = uuidv4();

    // Get the start time
    const start = Date.now();

    // Log request
    logger.log({
        level: 'http',
        message: 'Incoming request',
        metadata: {
            id: req.id,
            method: req.method,
            url: req.url,
            path: req.path,
            params: req.params,
            query: req.query,
            headers: {
                ...req.headers,
                authorization: req.headers.authorization ? '[REDACTED]' : undefined,
                cookie: req.headers.cookie ? '[REDACTED]' : undefined,
            },
            ip: req.ip,
            userId: (req as any).user?.id,
        },
    });

    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        
        logger.log({
            level: 'http',
            message: 'Request completed',
            metadata: {
                id: req.id,
                method: req.method,
                url: req.url,
                status: res.statusCode,
                duration,
                userId: (req as any).user?.id,
            },
        });
    });

    next();
};

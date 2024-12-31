import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // For development, allow all requests
  if (req.path === '/api/user') {
    res.status(200).json(null);
    return;
  }
  next();
}

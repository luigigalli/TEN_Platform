import { type Request, type Response, type NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verifyToken } from '../utils/jwt';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token);

    const [user] = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role
    })
    .from(users)
    .where(eq(users.id, decoded.userId))
    .limit(1);

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'User not found' });
    }

    // Attach user to request
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Invalid token' });
  }
}

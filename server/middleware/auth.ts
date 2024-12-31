import { Request, Response, NextFunction } from 'express';

// Mock user data for testing
const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  created_at: new Date(),
  updated_at: new Date()
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Check for session cookie
  const sessionId = req.cookies.session;

  if (!sessionId) {
    return res.status(401).json({
      ok: false,
      message: 'Not authenticated'
    });
  }

  // In development, if there's any session cookie, consider them authenticated
  if (process.env.NODE_ENV === 'development' && sessionId === 'mock-session-id') {
    return next();
  }

  // For any other case, return unauthorized
  res.status(401).json({
    ok: false,
    message: 'Invalid session'
  });
}

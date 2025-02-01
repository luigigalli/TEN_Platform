import { Router, Request, Response, NextFunction } from 'express';
import { ValidationError, NotFoundError, UnauthorizedError } from '../errors';
import { wrapAsync } from '../middleware/error';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Example middleware that checks for authentication
 */
const requireAuth = (_req: Request, _res: Response, next: NextFunction) => {
  const authHeader = _req.headers.authorization;
  
  if (!authHeader) {
    throw new UnauthorizedError('No authorization header');
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Invalid authorization format');
  }
  
  // For demo purposes, we'll consider any non-empty token as valid
  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new UnauthorizedError('No token provided');
  }

  // Add user to request for logging
  (_req as any).user = { id: 'demo-user' };
  
  next();
};

/**
 * Example validation middleware
 */
const validateUser = (req: Request, _res: Response, next: NextFunction) => {
  const { name, email, age } = req.body;
  const errors: Record<string, string> = {};

  if (!name || typeof name !== 'string') {
    errors.name = 'Name is required and must be a string';
  }

  if (!email || !email.includes('@')) {
    errors.email = 'Valid email is required';
  }

  if (age !== undefined && (typeof age !== 'number' || age < 0)) {
    errors.age = 'Age must be a positive number';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Invalid user data', errors);
  }

  next();
};

// Example Routes

/**
 * GET /api/examples/error-types
 * Demonstrates different error types
 */
router.get('/error-types/:type', wrapAsync(async (_req: Request, _res: Response) => {
  const { type } = _req.params;

  switch (type) {
    case 'validation':
      throw new ValidationError('Example validation error', {
        field: 'test',
        reason: 'demonstration'
      });

    case 'auth':
      throw new UnauthorizedError('Example authentication error');

    case 'not-found':
      throw new NotFoundError('Example resource not found');

    case 'async':
      await new Promise(resolve => setTimeout(resolve, 100));
      throw new Error('Example async error');

    default:
      _res.json({ message: 'No error triggered' });
  }
}));

/**
 * POST /api/examples/users
 * Example protected route with validation
 */
router.post(
  '/users',
  requireAuth,
  validateUser,
  wrapAsync(async (_req: Request, _res: Response) => {
    const { name, email, age } = _req.body;

    logger.info('Creating user', { name, email, age });

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));

    _res.status(201).json({
      id: Math.floor(Math.random() * 1000),
      name,
      email,
      age,
      createdAt: new Date().toISOString()
    });
  })
);

/**
 * GET /api/examples/users/:id
 * Example route that demonstrates not found error
 */
router.get(
  '/users/:id',
  wrapAsync(async (_req: Request, _res: Response) => {
    const { id } = _req.params;

    // Simulate not found for odd IDs
    if (parseInt(id) % 2 === 1) {
      throw new NotFoundError(`User ${id} not found`);
    }

    _res.json({
      id: parseInt(id),
      name: 'Example User',
      email: 'user@example.com'
    });
  })
);

export default router;

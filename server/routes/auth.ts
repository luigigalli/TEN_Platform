import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/refresh-token', AuthController.refreshToken);

// Protected routes
router.get('/me', authenticate, AuthController.me);

export const setupAuthRoutes = (app: Express): void => {
  app.use('/api/auth', router);
};

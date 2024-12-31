import { Router } from 'express';
import { userRouter } from './user';

const router = Router();

// Register routes
router.use('/user', userRouter);

export function registerRoutes(app: Router) {
  app.use('/api', router);
}

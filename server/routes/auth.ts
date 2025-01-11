import { Router, type Express } from 'express';

const router = Router();

export function setupAuthRoutes(app: Express): void {
  app.use('/api/auth', router);
}

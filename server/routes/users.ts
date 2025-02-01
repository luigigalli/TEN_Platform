import { Router, type Express } from 'express';

const router = Router();

export function setupUserRoutes(app: Express): void {
  app.use('/api/users', router);
}

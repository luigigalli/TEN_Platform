import { type Express } from 'express';
import { setupHealthRoutes } from './health.js';
import { setupAuthRoutes } from './auth.js';

export const setupRoutes = (app: Express): void => {
  setupHealthRoutes(app);
  setupAuthRoutes(app);
}

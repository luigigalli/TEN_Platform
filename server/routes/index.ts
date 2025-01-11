import { type Express } from 'express';
import { setupHealthRoutes } from './health';

export function setupRoutes(app: Express): void {
  setupHealthRoutes(app);
}

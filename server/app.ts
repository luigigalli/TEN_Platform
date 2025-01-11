import express from 'express';
import { json } from 'express';
import routes from './routes';
import exampleRoutes from '../src/routes/examples';
import { setupErrorHandling } from '../src/middleware/error';
import { logger } from '../src/utils/logger';

export async function createApp() {
  const app = express();

  // Middleware
  app.use(json());

  // Routes
  app.use('/api', routes);
  app.use('/api/examples', exampleRoutes);

  // Error handling
  setupErrorHandling(app, {
    logErrors: true,
    includeStackTrace: process.env.NODE_ENV !== 'production'
  });

  // Start server
  const port = process.env.PORT || 3000;
  const server = app.listen(port, () => {
    logger.info(`Server is running on port ${port}`, { port });
  });

  return { app, server };
}

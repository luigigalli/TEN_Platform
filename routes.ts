import { Application, express } from 'express';
import path from 'path';

export function setupRoutes(app: Application) {
  // Serve static files from the client/dist directory
  app.use(express.static(path.join(__dirname, 'client/dist')));

  // Home route
  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
}

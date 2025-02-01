import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env, isReplit } from "../config/environment";
import { userRoutes } from "../routes/user";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger';

export async function initializeServer(app: express.Application) {
  // Create HTTP server
  const server = http.createServer(app);

  // Basic middleware setup
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // CORS configuration
  const corsOptions = {
    origin: isReplit ? true : 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
  };

  app.use(cors(corsOptions));

  // API Documentation setup
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Request logging middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (!req.path.includes('api-docs')) { // Don't log documentation requests
      console.log(`\n[BACKEND] ${req.method} ${req.url}`);
      console.log('[BACKEND] Headers:', JSON.stringify(req.headers, null, 2));
      if (req.body && Object.keys(req.body).length > 0) {
        console.log('[BACKEND] Body:', JSON.stringify(req.body, null, 2));
      }
    }
    next();
  });

  // Mount routes
  app.use('/api/user', userRoutes);

  // Error handling middleware
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[BACKEND] Error:', err);
    res.status(500).json({
      ok: false,
      message: 'Internal server error',
      details: err.message
    });
  });

  // Start server
  const port = env.PORT || 3000;
  const host = isReplit ? '0.0.0.0' : 'localhost';

  await new Promise<void>((resolve) => {
    server.listen(port, host, () => {
      console.log(`[BACKEND] Server running at http://${host}:${port}`);
      console.log(`[BACKEND] API Documentation available at http://${host}:${port}/api-docs`);
      resolve();
    });
  });

  return { app, server };
}
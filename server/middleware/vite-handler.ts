import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { type Server } from "http";
import { createServer as createViteServer, createLogger } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import viteConfig from "../../vite.config";
import { ServerError } from "../errors";
import { config } from "../config";
import { isReplit } from "../config/environment";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__dirname);

// Create a type-safe logger
const viteLogger = createLogger();

/**
 * Handle Vite middleware setup in development mode
 */
export async function handleViteMiddleware(app: Express, server: Server): Promise<void> {
  if (config.env !== 'development') {
    throw new ServerError(
      'Vite middleware should only be used in development mode',
      'INVALID_ENV',
      500
    );
  }

  try {
    // Resolve the client directory
    const clientDir = path.resolve(__dirname, '..', 'client');
    const indexPath = path.resolve(clientDir, 'index.html');

    // Create Vite server
    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: viteLogger,
      root: clientDir,
      server: {
        middlewareMode: true,
        hmr: {
          server,
          port: 5173,
          clientPort: isReplit ? 443 : 5173,
          protocol: isReplit ? 'wss' : 'ws'
        },
        // Important: When on Replit, allow connections from all hosts
        host: isReplit ? '0.0.0.0' : 'localhost',
        port: 5173, // Always use port 5173 internally
        strictPort: true,
      },
      appType: "custom",
    });

    // Use Vite's connect instance as middleware
    app.use(vite.middlewares);

    // Handle all other routes
    app.use("*", async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Skip Vite handling for API routes
        if (req.path.startsWith('/api')) {
          return next();
        }

        const url = req.originalUrl;

        // Read and transform index.html
        let template: string;
        try {
          template = await fs.promises.readFile(indexPath, 'utf-8');
        } catch (e) {
          console.error('Failed to read index.html:', e);
          throw new ServerError(
            'Failed to read index.html',
            'INDEX_READ_ERROR',
            500,
            { path: indexPath }
          );
        }

        // Transform the template
        let html: string;
        try {
          html = await vite.transformIndexHtml(url, template);
        } catch (e) {
          console.error('Failed to transform index.html:', e);
          throw new ServerError(
            'Failed to transform index.html',
            'INDEX_TRANSFORM_ERROR',
            500
          );
        }

        // Send the response
        res.status(200)
          .set({ 'Content-Type': 'text/html' })
          .end(html);

      } catch (e) {
        const error = e as Error;
        vite.ssrFixStacktrace(error);
        next(error);
      }
    });
  } catch (e) {
    const error = e as Error;
    console.error('Failed to initialize Vite server:', error);
    throw new ServerError(
      'Failed to initialize Vite server',
      'VITE_INIT_ERROR',
      500,
      { originalError: error.message }
    );
  }
}

/**
 * Handle static file serving in production
 */
export function handleStaticFiles(app: Express): void {
  if (config.env !== 'production') {
    throw new ServerError(
      'Static file handling should only be used in production mode',
      'INVALID_ENV',
      500
    );
  }

  const distPath = path.resolve(__dirname, '..', '..', 'dist', 'public');

  // Serve static files
  app.use(express.static(distPath));

  // Serve index.html for all other routes
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}
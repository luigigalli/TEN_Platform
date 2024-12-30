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
const __dirname = path.dirname(__filename);

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
    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: viteLogger,
      server: {
        middlewareMode: true,
        hmr: { server },
        // Important: When on Replit, allow connections from all hosts
        host: isReplit ? '0.0.0.0' : 'localhost',
        port: 5173, // Always use port 5173 internally
        strictPort: true,
        // Configure HMR for Replit
        hmr: {
          server,
          port: 5173,
          clientPort: isReplit ? 443 : 5173,
          protocol: isReplit ? 'wss' : 'ws'
        }
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
        const template = await fs.promises.readFile(
          path.resolve(__dirname, '..', '..', 'client', 'index.html'),
          'utf-8'
        );

        const transformedTemplate = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(transformedTemplate);
      } catch (e) {
        const error = e as Error;
        vite.ssrFixStacktrace(error);
        next(error);
      }
    });
  } catch (e) {
    const error = e as Error;
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

  // Serve static files from the dist directory
  app.use(express.static(distPath));

  // Serve index.html for all other routes (SPA)
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}
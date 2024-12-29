import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { type Server } from "http";
import { createServer as createViteServer, createLogger } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import viteConfig from "../../vite.config";
import { ServerError } from "../errors";
import { config } from "../config";

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

  if (!fs.existsSync(distPath)) {
    throw new ServerError(
      `Could not find the build directory: ${distPath}. Run 'npm run build' first.`,
      'BUILD_DIR_NOT_FOUND',
      500
    );
  }

  // Serve static files
  app.use(express.static(distPath));

  // Fall through to index.html for client-side routing
  app.use("*", (_req: Request, res: Response) => {
    const indexPath = path.resolve(distPath, "index.html");

    if (!fs.existsSync(indexPath)) {
      throw new ServerError(
        'Index file not found in production build',
        'INDEX_NOT_FOUND',
        500
      );
    }

    res.sendFile(indexPath);
  });
}
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { type Server } from "http";
import { createServer as createViteServer, createLogger } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import viteConfig from "../../vite.config";
import { ServerError } from "../errors";  // Updated import path

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a type-safe logger
const viteLogger = createLogger();

/**
 * Handle Vite middleware setup and static file serving
 */
export async function handleViteMiddleware(app: Express, server: Server): Promise<void> {
  try {
    const vite = await createViteServer({
      ...viteConfig,
      server: {
        middlewareMode: true,
        hmr: {
          server,
        },
      },
      appType: "custom",
    });

    // Use Vite's connect instance as middleware
    app.use(async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Skip Vite handling for API routes
        if (req.path.startsWith('/api')) {
          return next();
        }

        const url = req.originalUrl;

        // Send static files through Vite
        if (process.env.NODE_ENV === 'production') {
          // Serve static files in production
          const clientDist = path.resolve(__dirname, '..', '..', 'client', 'dist');
          if (fs.existsSync(clientDist)) {
            app.use(express.static(clientDist));
          }

          // Always serve index.html for client-side routing
          const indexPath = path.resolve(clientDist, 'index.html');
          if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
          } else {
            res.status(404).send('Not found');
          }
        } else {
          // Development mode - let Vite handle it
          await vite.middlewares(req, res, next);
        }
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
  const distPath = path.resolve(__dirname, "..", "..", "public");

  if (!fs.existsSync(distPath)) {
    throw new ServerError(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
      "BUILD_DIR_NOT_FOUND",
      500
    );
  }

  app.use(express.static(distPath));

  // Fall through to index.html if the file doesn't exist
  app.use("*", (_req: Request, res: Response) => {
    const indexPath = path.resolve(distPath, "index.html");

    if (!fs.existsSync(indexPath)) {
      throw new ServerError(
        "Index file not found",
        "INDEX_NOT_FOUND",
        500
      );
    }

    res.sendFile(indexPath);
  });
}
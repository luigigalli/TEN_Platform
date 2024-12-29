import express, { type Express, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger, type ViteDevServer, type LogLevel, type UserConfig } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { z } from "zod";
import { ServerError } from "./index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validation schemas
const timeFormatSchema = z.object({
  hour: z.enum(["numeric"]),
  minute: z.enum(["2-digit"]),
  second: z.enum(["2-digit"]),
  hour12: z.literal(true),
});

type TimeFormat = z.infer<typeof timeFormatSchema>;

// Create a type-safe logger
const viteLogger = createLogger();

interface LogOptions {
  timestamp?: boolean;
  clear?: boolean;
  customColors?: boolean;
}

/**
 * Log a message with proper formatting and validation
 * @param message - The message to log
 * @param source - The source of the log message
 * @throws {Error} If the message or source is invalid
 */
export function log(message: string, source = "express"): void {
  if (typeof message !== "string" || message.trim().length === 0) {
    throw new Error("Invalid log message");
  }

  if (typeof source !== "string" || source.trim().length === 0) {
    throw new Error("Invalid log source");
  }

  const timeFormat: TimeFormat = {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };

  const validatedFormat = timeFormatSchema.parse(timeFormat);

  const formattedTime = new Date().toLocaleTimeString("en-US", validatedFormat);
  console.log(`${formattedTime} [${source}] ${message}`);
}

interface ViteSetupOptions extends UserConfig {
  customLogger?: typeof viteLogger;
  server?: {
    middlewareMode?: boolean;
    hmr?: {
      server: Server;
    };
  };
  appType?: "custom";
}

/**
 * Set up Vite development server
 * @param app - Express application
 * @param server - HTTP server
 * @throws {ServerError} If Vite server setup fails
 */
export async function setupVite(app: Express, server: Server): Promise<void> {
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
          const clientDist = path.resolve(__dirname, '..', 'client', 'dist');
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
      error
    );
  }
}

/**
 * Serve static files in production
 * @param app - Express application
 * @throws {ServerError} If static file serving fails
 */
export function serveStatic(app: Express): void {
  const distPath = path.resolve(__dirname, "public");

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

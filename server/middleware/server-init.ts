import express, { type Express } from "express";
import cors from "cors";
import { config } from "../config";
import { ServerError } from "../errors";
import { type Server } from "http";
import { createServer } from "http";

/**
 * Initialize Express application with proper error handling and middleware
 */
export async function initializeServer(): Promise<{ app: Express; server: Server }> {
  try {
    const app = express();

    // Basic security headers
    app.use((_req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });

    // Configure CORS with environment-aware origins
    app.use(cors({
      origin: config.server.corsOrigins,
      credentials: true
    }));

    // Basic middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Request logging middleware
    app.use((req, res, next) => {
      const start = Date.now();
      const path = req.path;
      let capturedJsonResponse: Record<string, any> | undefined = undefined;

      const originalResJson = res.json;
      res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
      };

      res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
          let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
          if (capturedJsonResponse) {
            logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          }
          if (logLine.length > 80) {
            logLine = logLine.slice(0, 79) + "…";
          }
          const timeStr = new Date().toLocaleTimeString();
          console.log(`${timeStr} [express] ${logLine}`);
        }
      });

      next();
    });

    // Health check endpoint
    app.get("/api/health", (_req, res) => {
      res.json({ 
        status: "ok", 
        environment: config.env,
        timestamp: new Date().toISOString()
      });
    });

    // Create HTTP server instance
    const server = createServer(app);

    // Add error handling middleware
    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('Server error:', err);

      if (err instanceof ServerError) {
        res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          ...(config.env === 'development' ? { details: err.details } : {})
        });
      } else {
        res.status(500).json({
          error: 'Internal Server Error',
          ...(config.env === 'development' ? { stack: err.stack } : {})
        });
      }
    });

    return { app, server };
  } catch (error) {
    if (error instanceof ServerError) {
      throw error;
    }
    throw new ServerError(
      'Failed to initialize server',
      'SERVER_INIT_ERROR',
      500,
      { originalError: error }
    );
  }
}
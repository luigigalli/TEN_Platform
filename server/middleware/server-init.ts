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
    const maxRetries = 3;
    let currentRetry = 0;
    let lastError: Error | null = null;
    let server: Server | null = null;

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

    // Enhanced health check endpoint with environment info
    app.get("/api/health", (_req, res) => {
      try {
        const healthData = {
          status: "ok",
          environment: config.env,
          port: config.server.port,
          host: config.server.host,
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          retries: currentRetry
        };
        res.json(healthData);
      } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({ 
          status: "error",
          message: "Failed to retrieve health information"
        });
      }
    });

    // Create HTTP server instance with retry logic and cleanup
    const cleanupServer = () => {
      if (server) {
        try {
          server.close();
          server = null;
        } catch (err) {
          console.error('Error closing server:', err);
        }
      }
    };

    process.on('SIGTERM', cleanupServer);
    process.on('SIGINT', cleanupServer);

    while (currentRetry < maxRetries) {
      cleanupServer(); // Ensure any previous server is closed
      server = createServer(app);

      try {
        await new Promise<void>((resolve, reject) => {
          if (!server) {
            reject(new Error('Server not initialized'));
            return;
          }

          const onError = (err: Error) => {
            lastError = err;
            server?.removeListener('error', onError);
            server?.removeListener('listening', onListening);
            reject(err);
          };

          const onListening = () => {
            server?.removeListener('error', onError);
            server?.removeListener('listening', onListening);
            resolve();
          };

          server.on('error', onError);
          server.on('listening', onListening);

          server.listen(config.server.port, config.server.host);
        });

        // If we get here, the server started successfully
        return { app, server };

      } catch (error: any) {
        currentRetry++;
        const isPortInUse = error.code === 'EADDRINUSE';
        console.error(
          `Failed to start server (attempt ${currentRetry}/${maxRetries}):`,
          isPortInUse ? `Port ${config.server.port} is in use` : error
        );

        if (currentRetry === maxRetries) {
          throw new ServerError(
            `Failed to start server after ${maxRetries} attempts`,
            'SERVER_START_ERROR',
            500,
            { lastError, port: config.server.port }
          );
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // This should never be reached due to the throw above
    throw new Error('Unexpected server initialization state');

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
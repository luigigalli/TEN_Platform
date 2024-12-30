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

    // Enhanced health check endpoint with environment info
    app.get("/api/health", (_req, res) => {
      try {
        const healthData = {
          status: "ok",
          environment: config.env,
          port: config.server.port,
          host: config.server.host,
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
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

    // Create HTTP server instance
    const server = createServer(app);

    // Set up server with proper error handling
    return new Promise((resolve, reject) => {
      const onError = (error: NodeJS.ErrnoException) => {
        server.removeListener('error', onError);
        server.removeListener('listening', onListening);

        if (error.code === 'EADDRINUSE') {
          reject(new ServerError(
            `Port ${config.server.port} is already in use`,
            'PORT_IN_USE',
            500,
            { port: config.server.port }
          ));
        } else {
          reject(new ServerError(
            'Failed to start server',
            'SERVER_START_ERROR',
            500,
            { originalError: error }
          ));
        }
      };

      const onListening = () => {
        server.removeListener('error', onError);
        server.removeListener('listening', onListening);
        resolve({ app, server });
      };

      server.on('error', onError);
      server.on('listening', onListening);

      try {
        server.listen(config.server.port, config.server.host);
      } catch (error) {
        onError(error as NodeJS.ErrnoException);
      }
    });

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
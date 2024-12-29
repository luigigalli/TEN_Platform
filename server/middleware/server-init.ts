import express, { type Express } from "express";
import cors from "cors";
import { config } from "../config";
import { ServerError } from "../errors";
import { handleViteMiddleware, handleStaticFiles } from "./vite-handler";
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

    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Health check endpoint
    app.get("/api/health", (_req, res) => {
      res.json({ 
        status: "ok", 
        environment: config.env,
        timestamp: new Date().toISOString()
      });
    });

    // Create HTTP server instance without starting it
    const server = createServer(app);

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
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { config } from "./config";
import { ServerError } from "./errors";
import { initializeServer } from "./middleware/server-init";
import { handleViteMiddleware, handleStaticFiles } from "./middleware/vite-handler";

// Start the server with proper error handling
(async () => {
  try {
    // Initialize server with environment-aware configuration
    const { app, server } = await initializeServer();

    // Request logging middleware
    app.use((req: Request, res: Response, next: NextFunction) => {
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

          console.log(`${new Date().toLocaleTimeString()} [express] ${logLine}`);
        }
      });

      next();
    });

    // Register API routes
    registerRoutes(app);

    // Global error handler
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
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

    // Set up environment-specific middleware
    if (config.env === 'development') {
      await handleViteMiddleware(app, server);
    } else {
      handleStaticFiles(app);
    }

    // Start server with environment-aware configuration
    server.listen(config.server.port, config.server.host, () => {
      console.log(`${new Date().toLocaleTimeString()} [express] Server running in ${config.env} mode`);
      console.log(`${new Date().toLocaleTimeString()} [express] API available at http://${config.server.host}:${config.server.port}/api`);
      console.log(`${new Date().toLocaleTimeString()} [express] Client available at http://${config.server.host}:${config.server.port}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
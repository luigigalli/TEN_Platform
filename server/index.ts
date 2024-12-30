import express from "express";
import { registerRoutes } from "./routes";
import { config } from "./config";
import { ServerError } from "./errors";
import { initializeServer } from "./middleware/server-init";
import { handleViteMiddleware, handleStaticFiles } from "./middleware/vite-handler";
import { type Server } from "http";
import { env, isReplit, getExternalUrl } from "./config/environment";

// Type definition for server instance
type ServerInstance = {
  app: express.Express;
  server: Server;
};

// Global server instance for cleanup
let serverInstance: ServerInstance | null = null;

// Cleanup function
async function cleanup(): Promise<void> {
  if (serverInstance) {
    try {
      await new Promise<void>((resolve) => {
        serverInstance?.server.close(() => resolve());
      });
      console.log('Server closed successfully');
    } catch (error) {
      console.error('Error during server cleanup:', error);
    }
    serverInstance = null;
  }
}

// Handle cleanup signals
process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});

// Start the server with proper error handling
(async () => {
  try {
    // Ensure cleanup before starting
    await cleanup();

    // Initialize server with environment-aware configuration
    const instance = await initializeServer({
      maxRetries: 3,
      retryDelay: 1000,
      // Use port 3000 for Replit
      fallbackPorts: isReplit ? [3000] : [5000, 8080, 8000]
    });

    serverInstance = instance;
    const { app, server: httpServer } = instance;

    // Register API routes first to ensure they take precedence
    registerRoutes(app);

    // Add error handling middleware
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('Server error:', err);
      const status = err.statusCode || err.status || 500;
      const message = err.message || 'Internal Server Error';
      res.status(status).json({ 
        error: message,
        status,
        timestamp: new Date().toISOString()
      });
    });

    // Set up environment-specific middleware
    if (config.env === 'development') {
      await handleViteMiddleware(app, httpServer);
    } else {
      handleStaticFiles(app);
    }

    // Get the external URL based on environment
    const serverUrl = getExternalUrl(config.server.port);
    const timeStr = new Date().toLocaleTimeString();

    console.log(`
${timeStr} [express] Server Configuration:
- Environment: ${config.env}
- Platform: ${isReplit ? 'Replit' : env.WINDSURF_ENV ? 'Windsurf' : 'Local'}
- Internal Port: ${config.server.port}
- External URL: ${serverUrl}
- API Path: ${serverUrl}/api
- Routes:
  * API: ${serverUrl}/api
  * Health: ${serverUrl}/api/health
  * Client: ${serverUrl}
`);

  } catch (error) {
    console.error('Failed to start server:', error);
    await cleanup();
    process.exit(1);
  }
})();
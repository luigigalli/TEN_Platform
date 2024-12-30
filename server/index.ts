import express from "express";
import { registerRoutes } from "./routes";
import { config } from "./config";
import { ServerError } from "./errors";
import { initializeServer } from "./middleware/server-init";
import { handleViteMiddleware, handleStaticFiles } from "./middleware/vite-handler";
import { type Server } from "http";

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
    const instance = await initializeServer();
    serverInstance = instance;
    const { app, server: httpServer } = instance;

    // Register API routes first to ensure they take precedence
    registerRoutes(app);

    // Set up environment-specific middleware
    if (config.env === 'development') {
      await handleViteMiddleware(app, httpServer);
    } else {
      handleStaticFiles(app);
    }

    // Start server with environment-aware configuration
    httpServer.listen(config.server.port, config.server.host, () => {
      const timeStr = new Date().toLocaleTimeString();
      console.log(`${timeStr} [express] Server running in ${config.env} mode`);
      console.log(`${timeStr} [express] API available at http://${config.server.host}:${config.server.port}/api`);
      console.log(`${timeStr} [express] Client available at http://${config.server.host}:${config.server.port}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
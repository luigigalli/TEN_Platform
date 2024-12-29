import express from "express";
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

    // Register API routes first to ensure they take precedence
    registerRoutes(app);

    // Set up environment-specific middleware
    if (config.env === 'development') {
      await handleViteMiddleware(app, server);
    } else {
      handleStaticFiles(app);
    }

    // Start server with environment-aware configuration
    server.listen(config.server.port, config.server.host, () => {
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
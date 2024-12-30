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
    console.log('[config] Environment variables loaded successfully');
    console.log('[config] Platform:', isReplit ? 'Replit' : 'Local');
    
    if (isReplit) {
      console.log('[config] Replit URL:', env.REPL_URL);
      console.log('[config] Replit Dev URL:', getExternalUrl(env.EXTERNAL_PORT));
    }

    // Initialize the server with the correct port
    const serverPort = isReplit ? env.PORT : env.PORT;
    serverInstance = await initializeServer({
      port: serverPort,
      maxRetries: 3,
      retryDelay: 1000
    });
    const { app } = serverInstance;

    // Register routes
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
      await handleViteMiddleware(app, serverInstance.server);
    } else {
      handleStaticFiles(app);
    }

    // Log server configuration
    console.log('\nServer Configuration:');
    console.log('- Environment:', env.NODE_ENV);
    console.log('- Platform:', isReplit ? 'Replit' : 'Local');
    console.log('- Internal Port:', serverPort);
    console.log('- External Port:', isReplit ? env.EXTERNAL_PORT : serverPort);
    console.log('- Host:', env.HOST);
    console.log('- External URL:', getExternalUrl(serverPort));
    if (isReplit) {
      console.log('- Replit URL:', env.REPL_URL);
      console.log('- Client Port:', env.CLIENT_PORT);
      console.log('- External Client Port:', env.EXTERNAL_CLIENT_PORT);
    }

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
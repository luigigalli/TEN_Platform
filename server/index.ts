import express from "express";
import { registerRoutes } from "./routes";
import { config } from "./config";
import { ServerError } from "./errors";
import { initializeServer } from "./middleware/server-init";
import { handleViteMiddleware, handleStaticFiles } from "./middleware/vite-handler";
import { type Server } from "http";
import { env, isReplit, getExternalUrl } from "./config/environment";
import { validateDeploymentEnvironment } from "./config/deployment-validator";

// Type definition for server instance
interface ServerInstance {
  app: express.Application;
  server: Server;
}

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

// Start the server with proper error handling and validation
(async () => {
  try {
    // Ensure cleanup before starting
    await cleanup();

    // Validate deployment environment before proceeding
    await validateDeploymentEnvironment();

    console.log('[config] Environment variables loaded successfully');
    console.log('[config] Platform:', isReplit ? 'Replit' : 'Local');

    if (isReplit) {
      console.log('[config] Replit URL:', env.REPL_URL);
      console.log('[config] Replit Dev URL:', getExternalUrl(env.EXTERNAL_PORT));
    }

    const app = express();
    const { server } = await initializeServer(app);
    serverInstance = { app, server };

    // Register API routes first
    registerRoutes(app);

    // Set up environment-specific middleware after API routes
    if (config.env === 'development') {
      await handleViteMiddleware(app, server);
    } else {
      handleStaticFiles(app);
    }

    // Add error handling middleware last
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('[BACKEND] Unhandled error:', err);
      const status = err.statusCode || err.status || 500;
      const message = err.message || 'Internal Server Error';
      res.status(status).json({ 
        error: message,
        status,
        timestamp: new Date().toISOString()
      });
    });

    const address = server.address();
    if (!address) {
      throw new Error('Server failed to bind to address');
    }

    const port = typeof address === 'string' ? parseInt(address.split(':')[1], 10) : address.port;

    // Log server configuration
    console.log('\nServer Configuration:');
    console.log('- Environment:', env.NODE_ENV);
    console.log('- Platform:', isReplit ? 'Replit' : 'Local');
    console.log('- Internal Port:', port);
    console.log('- External Port:', isReplit ? env.EXTERNAL_PORT : port);
    console.log('- Host:', env.HOST);
    console.log('- URL:', env.REPL_URL || getExternalUrl(port));
    if (isReplit) {
      console.log('- Client Port:', env.CLIENT_PORT);
      console.log('- External Client Port:', env.EXTERNAL_CLIENT_PORT);
    }

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
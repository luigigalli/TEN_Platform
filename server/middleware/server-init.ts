import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { type Server } from "http";
import { createServer } from "http";
import { config } from "../config";
import { ServerError } from "../errors";
import cors from "cors";
import { getExternalUrl, env, isReplit } from "../config/environment";

interface ServerBindingOptions {
  maxRetries?: number;
  retryDelay?: number;
  fallbackPorts?: number[];
}

/**
 * Bind the server to a port with retry logic
 */
async function bindServer(
  server: Server,
  host: string,
  port: number,
  options: ServerBindingOptions = {},
  retryCount = 0
): Promise<{ boundPort: number }> {
  const { maxRetries = 3, retryDelay = 1000 } = options;

  return new Promise((resolve, reject) => {
    const onError = (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        if (retryCount < maxRetries) {
          console.log(`Port ${port} in use, retrying in ${retryDelay}ms...`);
          setTimeout(() => {
            // For Replit, we should always use port 5000
            const nextPort = isReplit ? 5000 : port + 1;
            bindServer(server, host, nextPort, options, retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, retryDelay);
        } else {
          reject(new ServerError(
            `Failed to bind to port ${port}`,
            'PORT_BINDING_ERROR',
            500,
            { attemptedPort: port }
          ));
        }
      } else {
        reject(new ServerError(
          'Failed to start server',
          'SERVER_START_ERROR',
          500,
          { originalError: error.message }
        ));
      }
    };

    const onListening = () => {
      const addr = server.address();
      const boundPort = typeof addr === 'string' ? parseInt(addr.split(':')[1], 10) : addr?.port;

      if (!boundPort) {
        reject(new ServerError('Failed to get bound port', 'PORT_BINDING_ERROR', 500));
        return;
      }

      // Log the port mapping
      const externalPort = isReplit ? 3000 : boundPort;
      console.log(`[server] Internal port ${boundPort} mapped to external port ${externalPort}`);

      resolve({ boundPort });
    };

    server.once('error', onError);
    server.once('listening', () => {
      server.removeListener('error', onError);
      onListening();
    });

    try {
      // Always bind to 0.0.0.0 on Replit with port 5000
      if (isReplit) {
        console.log('[server] Binding to internal port 5000 for Replit');
        server.listen(5000, '0.0.0.0');
      } else {
        server.listen(port, host);
      }
    } catch (error) {
      onError(error as NodeJS.ErrnoException);
    }
  });
}

/**
 * Initialize Express application with proper error handling and middleware
 */
export async function initializeServer(options: ServerBindingOptions = {}): Promise<{ app: Express; server: Server }> {
  let app: Express | null = null;
  let server: Server | null = null;

  try {
    app = express();

    // Security headers
    app.use((_req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });

    // Configure CORS with environment-aware origins
    const corsOptions = {
      origin: config.server.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    };

    // Log CORS configuration in development
    if (env.NODE_ENV === 'development') {
      console.log('[server] CORS configuration:', {
        origins: corsOptions.origin,
        credentials: corsOptions.credentials
      });
    }

    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Request logging
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
          console.log(`[${new Date().toLocaleTimeString()}] ${logLine}`);
        }
      });

      next();
    });

    // Health check endpoint with environment info
    app.get("/api/health", (_req, res) => {
      const serverUrl = getExternalUrl(isReplit ? 3000 : config.server.port);
      res.json({
        status: "ok",
        environment: config.env,
        platform: isReplit ? 'Replit' : env.WINDSURF_ENV ? 'Windsurf' : 'Local',
        internalHost: config.server.host,
        internalPort: config.server.port,
        externalPort: isReplit ? 3000 : config.server.port,
        externalUrl: serverUrl,
        replitUrl: env.REPL_URL || null,
        timestamp: new Date().toISOString()
      });
    });

    server = createServer(app);

    // For Replit, always try port 5000 first
    const initialPort = isReplit ? 5000 : config.server.port;

    const { boundPort } = await bindServer(
      server,
      config.server.host,
      initialPort,
      {
        maxRetries: 3,
        retryDelay: 1000
      }
    );

    const timeStr = new Date().toLocaleTimeString();
    const serverUrl = getExternalUrl(isReplit ? 3000 : boundPort);

    // Log server startup information
    console.log(`
Server Configuration:
- Environment: ${config.env}
- Platform: ${isReplit ? 'Replit' : env.WINDSURF_ENV ? 'Windsurf' : 'Local'}
- Internal Port: ${boundPort}
- External Port: ${isReplit ? 3000 : boundPort}
- Host: ${config.server.host}
- External URL: ${serverUrl}
- Replit URL: ${env.REPL_URL || 'N/A'}
`);

    return { app, server };

  } catch (error) {
    if (server) {
      server.close();
    }

    if (error instanceof ServerError) {
      throw error;
    }

    throw new ServerError(
      'Failed to initialize server',
      'SERVER_INIT_ERROR',
      500,
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}
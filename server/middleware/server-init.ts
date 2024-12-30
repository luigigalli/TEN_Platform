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
            bindServer(server, host, port, options, retryCount + 1)
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
      const externalPort = isReplit ? 3001 : boundPort;
      console.log(`[server] Internal port ${boundPort} mapped to external port ${externalPort}`);

      resolve({ boundPort });
    };

    server.once('error', onError);
    server.once('listening', () => {
      server.removeListener('error', onError);
      onListening();
    });

    try {
      server.listen(port, host);
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

    // Basic security middleware
    app.use(express.json());
    app.use(cors({
      origin: config.server.corsOrigins,
      credentials: true
    }));

    // Request logging middleware
    app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      const { method, url } = req;

      res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        let logLine = `${method} ${url} ${status} ${duration}ms`;

        // Truncate long lines
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }
        console.log(`[${new Date().toLocaleTimeString()}] ${logLine}`);
      });

      next();
    });

    // Health check endpoint with environment info
    app.get("/api/health", (_req, res) => {
      res.json({
        status: "ok",
        environment: config.env,
        platform: isReplit ? 'Replit' : env.WINDSURF_ENV ? 'Windsurf' : 'Local',
        internalHost: config.server.host,
        internalPort: 3000,
        externalPort: isReplit ? 3001 : 3000,
        externalUrl: getExternalUrl(3000),
        replitUrl: env.REPL_URL || null,
        timestamp: new Date().toISOString()
      });
    });

    server = createServer(app);

    const { boundPort } = await bindServer(
      server,
      config.server.host,
      3000, // Always use port 3000 internally
      {
        maxRetries: 3,
        retryDelay: 1000
      }
    );

    const timeStr = new Date().toLocaleTimeString();
    const serverUrl = getExternalUrl(boundPort);

    // Log server startup information
    console.log(`
Server Configuration:
- Environment: ${config.env}
- Platform: ${isReplit ? 'Replit' : env.WINDSURF_ENV ? 'Windsurf' : 'Local'}
- Internal Port: ${boundPort}
- External Port: ${isReplit ? 3001 : boundPort}
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
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import { setupVite, serveStatic, log } from "./vite";
import { z } from "zod";

// Custom error class for server-related errors
export class ServerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ServerError';
  }
}

// Validation schemas
const errorResponseSchema = z.object({
  ok: z.literal(false),
  message: z.string(),
  stack: z.string().optional(),
});

type ErrorResponse = z.infer<typeof errorResponseSchema>;

// Type-safe express application setup
const app = express();

// Configure middleware with proper types
app.use(express.json({
  limit: '10mb',
  strict: true,
  verify: (req: Request, _res: Response, buf: Buffer, encoding: string) => {
    try {
      if (buf.length > 0) {
        JSON.parse(buf.toString(encoding));
      }
    } catch (error) {
      throw new ServerError(
        "Invalid JSON payload",
        "INVALID_JSON",
        400,
        error
      );
    }
  }
}));

app.use(express.urlencoded({ 
  extended: false,
  limit: '10mb'
}));

// Set up authentication first, before request logging
setupAuth(app);

// Interface for response with json method
interface ResponseWithJson extends Response {
  json(body: unknown): this;
}

// Type for captured JSON response
type CapturedResponse = Record<string, unknown> | undefined;

// Add detailed request logging middleware with proper types
app.use((req: Request, res: ResponseWithJson, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: CapturedResponse;

  // Save original json method
  const originalResJson = res.json;

  // Override json method with type safety
  res.json = function (bodyJson: unknown, ...args: unknown[]): ResponseWithJson {
    capturedJsonResponse = bodyJson as CapturedResponse;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Log response on finish
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      if (capturedJsonResponse) {
        try {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        } catch (error) {
          logLine += ' :: [Error: Could not stringify response]';
          console.error('Error stringifying response:', error);
        }
      }

      // Truncate long log lines
      const MAX_LOG_LENGTH = 80;
      if (logLine.length > MAX_LOG_LENGTH) {
        logLine = `${logLine.slice(0, MAX_LOG_LENGTH - 1)}…`;
      }

      log(logLine);
    }
  });

  next();
});

/**
 * Initialize and start the server
 * @throws {ServerError} If server initialization fails
 */
async function initializeServer(): Promise<void> {
  try {
    const server = registerRoutes(app);

    // Global error handler with proper types
    app.use((err: Error | ServerError, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);

      let status = 500;
      let message = "Internal Server Error";

      if (err instanceof ServerError) {
        status = err.statusCode;
        message = err.message;
      } else if ('status' in err || 'statusCode' in err) {
        status = (err as { status?: number, statusCode?: number }).status || 
                (err as { status?: number, statusCode?: number }).statusCode || 
                500;
        message = err.message || "Internal Server Error";
      }

      const response: ErrorResponse = {
        ok: false,
        message,
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
      };

      const validationResult = errorResponseSchema.safeParse(response);
      if (!validationResult.success) {
        console.error('Error response validation failed:', validationResult.error);
        response.message = "Internal Server Error";
        delete response.stack;
      }

      res.status(status).json(response);
    });

    // Set up development or production environment
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
    if (isNaN(PORT)) {
      throw new ServerError(
        "Invalid PORT environment variable",
        "INVALID_PORT",
        500
      );
    }

    server.listen(PORT, "0.0.0.0", () => {
      log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server initialization error:', error);
    
    if (error instanceof ServerError) {
      throw error;
    }

    throw new ServerError(
      "Failed to initialize server",
      "INIT_FAILED",
      500,
      error
    );
  }
}

// Start server with proper error handling
initializeServer().catch((error) => {
  console.error('Fatal server error:', error);
  process.exit(1);
});
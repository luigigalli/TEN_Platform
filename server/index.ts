import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { z } from "zod";
import { setupServicesRoutes } from "./services";
import { setupBookingsRoutes } from "./bookings";
import { setupMessagesRoutes } from "./messages";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Configure CORS with proper origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://0.0.0.0:3000'
    ];

    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('.repl.co')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Configure middleware with proper types
app.use(express.json({
  limit: '10mb',
  strict: true
}));

app.use(express.urlencoded({ 
  extended: false,
  limit: '10mb'
}));


// Add request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Initialize and start the server
async function initializeServer(): Promise<void> {
  try {
    setupServicesRoutes(app);
    setupBookingsRoutes(app);
    setupMessagesRoutes(app);
    const server = registerRoutes(app);

    // Set up development or production environment
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Default port with fallback
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

    server.listen(PORT, "0.0.0.0", () => {
      log(`Server listening on port ${PORT}`);
      log(`API available at http://0.0.0.0:${PORT}/api`);
      log(`Client available at http://0.0.0.0:${PORT}`);
    });

  } catch (error) {
    console.error('Server initialization failed:', error);
    throw new ServerError(
      'Failed to initialize server',
      'INIT_ERROR',
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
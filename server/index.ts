import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";
import { config, isReplit } from "./config";

const app = express();

// Configure CORS with proper origins
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const isAllowed = config.server.corsOrigins.some(pattern => {
      return typeof pattern === 'string' 
        ? pattern === origin
        : pattern.test(origin);
    });

    if (isAllowed || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
    const server = registerRoutes(app);

    // Set up development or production environment
    if (config.env === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    server.listen(config.server.port, config.server.host, () => {
      log(`Server listening on port ${config.server.port}`);
      log(`API available at http://${config.server.host}:${config.server.port}/api`);
      log(`Client available at http://${config.server.host}:${config.server.port}`);
    });

  } catch (error) {
    console.error('Server initialization failed:', error);
    process.exit(1);
  }
}

// Start server with proper error handling
initializeServer().catch((error) => {
  console.error('Fatal server error:', error);
  process.exit(1);
});
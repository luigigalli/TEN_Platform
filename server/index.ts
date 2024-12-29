import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";
import { config } from "./config";
import { ServerError } from "./errors/index";

const app = express();

// Configure CORS with proper origins from config
app.use(cors({
  origin: config.server.corsOrigins,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
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

      log(logLine);
    }
  });

  next();
});

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Initialize routes
const server = registerRoutes(app);

// Set up development or production environment
if (config.env === "development") {
  setupVite(app, server).catch((error: Error) => {
    console.error('Failed to setup Vite:', error);
    process.exit(1);
  });
} else {
  serveStatic(app);
}

// Start the server with environment-aware configuration
server.listen(config.server.port, config.server.host, () => {
  log(`Server listening on port ${config.server.port}`);
  log(`API available at http://${config.server.host}:${config.server.port}/api`);
  log(`Client available at http://${config.server.host}:${config.server.port}`);
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  const status = err instanceof ServerError ? err.statusCode : 500;
  res.status(status).json({ 
    error: err.message || 'Internal Server Error'
  });
});

// Export ServerError for use in other modules
export { ServerError };
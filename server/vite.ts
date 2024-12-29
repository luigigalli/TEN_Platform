import express, { type Express, Request, Response, NextFunction } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger, type ViteDevServer, type LogLevel, type UserConfig } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { z } from "zod";
import { ServerError } from "./index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validation schemas
const timeFormatSchema = z.object({
  hour: z.enum(["numeric"]),
  minute: z.enum(["2-digit"]),
  second: z.enum(["2-digit"]),
  hour12: z.literal(true),
});

type TimeFormat = z.infer<typeof timeFormatSchema>;

// Create a type-safe logger
const viteLogger = createLogger();

interface LogOptions {
  timestamp?: boolean;
  clear?: boolean;
  customColors?: boolean;
}

/**
 * Log a message with proper formatting and validation
 * @param message - The message to log
 * @param source - The source of the log message
 * @throws {Error} If the message or source is invalid
 */
export function log(message: string, source = "express"): void {
  if (typeof message !== "string" || message.trim().length === 0) {
    throw new Error("Invalid log message");
  }

  if (typeof source !== "string" || source.trim().length === 0) {
    throw new Error("Invalid log source");
  }

  const timeFormat: TimeFormat = {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };

  const validatedFormat = timeFormatSchema.parse(timeFormat);

  const formattedTime = new Date().toLocaleTimeString("en-US", validatedFormat);
  console.log(`${formattedTime} [${source}] ${message}`);
}

interface ViteSetupOptions extends UserConfig {
  customLogger?: typeof viteLogger;
  server?: {
    middlewareMode?: boolean;
    hmr?: {
      server: Server;
    };
  };
  appType?: "custom";
}

/**
 * Set up Vite development server
 * @param app - Express application
 * @param server - HTTP server
 * @throws {ServerError} If Vite server setup fails
 */
export async function setupVite(app: Express, server: Server): Promise<void> {
  try {
    const viteOptions: ViteSetupOptions = {
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg: string, options?: LogOptions) => {
          if (typeof msg !== "string") {
            throw new Error("Invalid error message");
          }

          if (msg.includes("[TypeScript] Found 0 errors. Watching for file changes")) {
            log("no errors found", "tsc");
            return;
          }

          if (msg.includes("[TypeScript] ")) {
            const [errors, summary] = msg.split("[TypeScript] ", 2);
            log(`${summary} ${errors}\u001b[0m`, "tsc");
            return;
          }

          viteLogger.error(msg, options);
          process.exit(1);
        },
      },
      server: {
        middlewareMode: true,
        hmr: { server },
      },
      appType: "custom",
    };

    const vite: ViteDevServer = await createViteServer(viteOptions);

    app.use(vite.middlewares);

    // Type-safe request handler
    app.use("*", async (req: Request, res: Response, next: NextFunction) => {
      const url = req.originalUrl;

      if (typeof url !== "string") {
        throw new ServerError(
          "Invalid URL",
          "INVALID_URL",
          400
        );
      }

      try {
        const clientTemplate = path.resolve(
          __dirname,
          "..",
          "client",
          "index.html",
        );

        // Validate template file exists
        if (!fs.existsSync(clientTemplate)) {
          throw new ServerError(
            "Template file not found",
            "TEMPLATE_NOT_FOUND",
            500
          );
        }

        // Always reload the index.html file from disk in case it changes
        const template = await fs.promises.readFile(clientTemplate, "utf-8");
        
        if (typeof template !== "string") {
          throw new ServerError(
            "Invalid template content",
            "INVALID_TEMPLATE",
            500
          );
        }

        const page = await vite.transformIndexHtml(url, template);
        
        if (typeof page !== "string") {
          throw new ServerError(
            "Invalid transformed HTML",
            "INVALID_HTML",
            500
          );
        }

        res.status(200)
           .set({ "Content-Type": "text/html" })
           .end(page);
      } catch (error) {
        if (error instanceof Error) {
          vite.ssrFixStacktrace(error);
        }
        next(error);
      }
    });
  } catch (error) {
    throw new ServerError(
      "Failed to setup Vite server",
      "VITE_SETUP_FAILED",
      500,
      error
    );
  }
}

/**
 * Serve static files in production
 * @param app - Express application
 * @throws {ServerError} If static file serving fails
 */
export function serveStatic(app: Express): void {
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new ServerError(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
      "BUILD_DIR_NOT_FOUND",
      500
    );
  }

  app.use(express.static(distPath));

  // Fall through to index.html if the file doesn't exist
  app.use("*", (_req: Request, res: Response) => {
    const indexPath = path.resolve(distPath, "index.html");
    
    if (!fs.existsSync(indexPath)) {
      throw new ServerError(
        "Index file not found",
        "INDEX_NOT_FOUND",
        500
      );
    }

    res.sendFile(indexPath);
  });
}

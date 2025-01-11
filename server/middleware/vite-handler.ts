import { type Express } from "express";
import { join } from "path";
import { config } from "../config";
import express from "express";

/**
 * Vite development server handler
 */
export async function setupViteHandler(app: Express): Promise<void> {
  if (config.env === "development") {
    const vite = await import("vite");
    const viteServer = await vite.createServer({
      root: join(process.cwd(), "client"),
      logLevel: "info",
      server: {
        middlewareMode: true,
      },
    });
    app.use(viteServer.middlewares);
  } else {
    app.use(express.static(join(process.cwd(), "client/dist")));
  }
}

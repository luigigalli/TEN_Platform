import { type Express } from "express";
import { join } from "path";
import { config } from "../config";
import express from "express";
import { createProxyMiddleware } from 'http-proxy-middleware';

/**
 * Vite development server handler
 */
export async function setupViteHandler(app: Express): Promise<void> {
  if (config.env === "development") {
    // Proxy all non-API requests to Vite dev server
    app.use(
      '/',
      createProxyMiddleware({
        target: 'http://localhost:5176',
        changeOrigin: true,
        ws: true,
        logLevel: 'silent',
        pathFilter: (path) => !path.startsWith('/api')
      })
    );
  } else {
    app.use(express.static(join(process.cwd(), "client/dist")));
  }
}

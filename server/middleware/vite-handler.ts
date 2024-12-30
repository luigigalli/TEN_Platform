
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { type Server } from "http";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { ServerError } from "../errors";
import { config } from "../config";
import { isReplit } from "../config/environment";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function handleViteMiddleware(app: Express, server: Server): Promise<void> {
  if (config.env !== 'development') {
    throw new ServerError(
      'Vite middleware should only be used in development mode',
      'INVALID_ENV',
      500
    );
  }

  try {
    const clientDir = path.resolve(__dirname, '..', '..', 'client');
    
    const vite = await createViteServer({
      root: clientDir,
      base: '/',
      server: {
        middlewareMode: true,
        hmr: {
          server,
          port: 5173,
          host: isReplit ? process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co' : '0.0.0.0',
          protocol: isReplit ? 'wss' : 'ws',
          clientPort: isReplit ? 443 : 5173,
          timeout: 180000,
          overlay: false,
          path: '/@vite/client'
        }
      },
      appType: 'custom',
      optimizeDeps: {
        force: true
      }
    });

    app.use(vite.middlewares);

    app.use('*', async (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api')) return next();

      try {
        const indexPath = path.join(clientDir, 'index.html');
        let html = await fs.promises.readFile(indexPath, 'utf-8');
        html = await vite.transformIndexHtml(req.originalUrl, html);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } catch (e) {
    const error = e as Error;
    throw new ServerError(
      'Failed to initialize Vite server',
      'VITE_INIT_ERROR',
      500,
      { originalError: error.message }
    );
  }
}

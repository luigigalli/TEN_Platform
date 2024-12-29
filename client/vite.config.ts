/**
 * Vite Configuration
 * 
 * This configuration file implements environment-aware settings for the Vite development server.
 * It coordinates with the backend configuration to ensure consistent port usage and proper proxying
 * across different development environments.
 * 
 * Key Features:
 * - Matches backend port configuration
 * - Environment-specific proxy settings
 * - Consistent host binding
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Environment detection (matches server/config.ts)
const isReplit = Boolean(process.env.REPL_ID && process.env.REPL_OWNER);
const isWindsurf = !isReplit;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Port configuration (matches server/config.ts)
const WINDSURF_PORT = 3000;  // Standard development port for local environment
const REPLIT_PORT = 5000;    // Required port for Replit environment

/**
 * Determines the appropriate port based on the current environment
 * This function mirrors the logic in server/config.ts to ensure consistency
 */
function determinePort(): number {
  if (process.env.PORT) {
    return parseInt(process.env.PORT, 10);
  }
  return isReplit ? REPLIT_PORT : WINDSURF_PORT;
}

const port = determinePort();

// Vite configuration
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    host: '0.0.0.0',  // Bind to all network interfaces
    port: port,
    strictPort: true, // Fail if port is in use
    // Proxy configuration:
    // - In Windsurf: Enable proxy to handle API requests
    // - In Replit: No proxy needed (handled by Replit's infrastructure)
    proxy: isWindsurf ? {
      '/api': {
        target: `http://localhost:${port}`,
        changeOrigin: true
      }
    } : undefined
  }
})
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment detection
const isReplit = Boolean(process.env.REPL_URL);
const isWindsurf = Boolean(process.env.WINDSURF_ENV);

// Get appropriate API URL based on environment
const getApiUrl = () => {
  // Use explicitly configured API URL if available
  if (process.env.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }

  // For Replit, use the Replit URL with port 3001 (server port)
  if (isReplit && process.env.REPL_URL) {
    const url = new URL(process.env.REPL_URL);
    url.port = '3001';
    return url.toString();
  }

  if (isWindsurf) {
    return 'http://localhost:5000';
  }

  // Default development URL
  return 'http://localhost:5000';
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: getApiUrl(),
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    },
    // Important: When on Replit, allow connections from all hosts
    host: isReplit ? '0.0.0.0' : 'localhost',
    // Use port 5173 always (will be mapped to 3000 externally in Replit)
    port: 5173
  }
});
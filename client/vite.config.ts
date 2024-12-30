import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment detection
const isReplit = Boolean(process.env.REPL_ID && process.env.REPL_OWNER);
const isWindsurf = Boolean(process.env.WINDSURF_ENV);

// Get appropriate API URL based on environment
const getApiUrl = () => {
  if (process.env.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }

  if (isReplit) {
    return 'http://0.0.0.0:5000';
  }

  if (isWindsurf) {
    return 'http://localhost:5000';
  }

  return 'http://localhost:5000'; // Default development URL
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
        secure: false
      }
    }
  }
});
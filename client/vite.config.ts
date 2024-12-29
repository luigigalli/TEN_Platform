import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Environment detection
const isReplit = Boolean(process.env.REPL_ID && process.env.REPL_OWNER);
const isWindsurf = !isReplit;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Port configuration
const WINDSURF_PORT = 3000;
const REPLIT_PORT = 5000;

// Get port based on environment
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
    host: '0.0.0.0',
    port: port,
    strictPort: true,
    // Only use proxy in Windsurf environment
    proxy: isWindsurf ? {
      '/api': {
        target: `http://localhost:${port}`,
        changeOrigin: true
      }
    } : undefined
  }
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Environment-aware configuration
const isReplit = process.env.REPL_ID && process.env.REPL_OWNER;
const DEFAULT_PORT = 3000;
const REPLIT_PORT = 5000;

// Get the appropriate port based on environment
const port = process.env.PORT ? 
  parseInt(process.env.PORT, 10) : 
  isReplit ? REPLIT_PORT : DEFAULT_PORT;

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
    proxy: isReplit ? undefined : {
      '/api': {
        target: `http://0.0.0.0:${port}`,
        changeOrigin: true
      }
    }
  }
})
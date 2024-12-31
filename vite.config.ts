import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Environment detection
const isReplit = Boolean(process.env.REPL_ID)

// Port configuration
const serverPort = isReplit ? 3001 : 3000
const clientPort = 5176

export default defineConfig({
  plugins: [
    react({
      fastRefresh: process.env.NODE_ENV !== 'production',
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: clientPort,
    strictPort: true,
    hmr: {
      port: isReplit ? undefined : 24678,
    },
    proxy: {
      '/api': {
        target: `http://0.0.0.0:${serverPort}`,
        changeOrigin: true
      }
    }
  }
})
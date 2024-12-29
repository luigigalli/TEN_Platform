
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      // Prevent duplicate runtime injection
      include: '**/*.{jsx,tsx}',
      exclude: ['**/node_modules/**']
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  }
})

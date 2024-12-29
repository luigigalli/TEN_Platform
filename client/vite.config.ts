import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = 5000;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    host: '0.0.0.0',  // Bind to all network interfaces
    port: PORT,
    strictPort: true, // Fail if port is in use
    proxy: {
      '/api': {
        target: `http://localhost:${PORT}`,
        changeOrigin: true
      }
    }
  }
});
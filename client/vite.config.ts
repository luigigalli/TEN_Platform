import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const isReplit = Boolean(process.env.REPL_ID);

// Get the API URL based on environment
const getApiUrl = () => {
  if (isReplit) {
    // In Replit, we need to use the same domain but different port
    return 'http://0.0.0.0:3001';
  }
  return 'http://localhost:3000';
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: false, // Disable HMR as it causes issues in Replit
    watch: {
      usePolling: false // Disable file watching
    },
    websocket: false, // Explicitly disable WebSocket server
    proxy: {
      '/api': {
        target: getApiUrl(),
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
});

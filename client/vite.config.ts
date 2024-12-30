
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const isReplit = Boolean(process.env.REPL_ID);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    host: true,
    port: 5173,
    hmr: {
      port: isReplit ? 443 : undefined,
      clientPort: isReplit ? 443 : undefined,
      protocol: isReplit ? 'wss' : 'ws'
    },
    proxy: {
      '/api': {
        target: isReplit ? 'https://0.0.0.0:3001' : 'http://0.0.0.0:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});

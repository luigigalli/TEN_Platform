
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
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: isReplit ? 443 : 5173,
      host: isReplit ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : '0.0.0.0',
      protocol: isReplit ? 'wss' : 'ws'
    },
    watch: {
      usePolling: false
    },
    proxy: {
      '/api': {
        target: isReplit ? 'http://0.0.0.0:3001' : 'http://0.0.0.0:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});

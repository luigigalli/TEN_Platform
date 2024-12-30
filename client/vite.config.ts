
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isReplit = Boolean(process.env.REPL_ID);
const isWindsurf = Boolean(process.env.WINDSURF_ENV);

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: isReplit ? 443 : 5173,
      host: isReplit ? process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co' : '0.0.0.0',
      protocol: isReplit ? 'wss' : 'ws',
      timeout: 180000
    },
    watch: {
      usePolling: true,
      interval: 2000
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

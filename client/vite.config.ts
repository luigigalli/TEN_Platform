
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
    hmr: isReplit ? {
      clientPort: 443,
      protocol: 'wss',
      host: `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`,
      timeout: 120000
    } : true,
    proxy: {
      '/api': {
        target: isReplit ? 'http://0.0.0.0:3001' : 'http://0.0.0.0:3000',
        changeOrigin: true
      }
    }
  }
});

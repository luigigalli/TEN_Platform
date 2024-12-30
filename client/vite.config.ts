
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
    hmr: false,
    proxy: {
      '/api': {
        target: isReplit ? 'http://0.0.0.0:3001' : 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});

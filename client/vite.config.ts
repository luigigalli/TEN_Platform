import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { config as dotenv } from 'dotenv'

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  dotenv();
}

// Environment detection (same as server)
const isReplit = Boolean(process.env.REPL_ID);
const isDevelopment = process.env.NODE_ENV === 'development';

// Get default ports (same as server)
const getDefaultPort = () => isReplit ? 3001 : 5176;
const getDefaultHost = () => isReplit ? '0.0.0.0' : 'localhost';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  console.log(`[VITE] Configuring for ${isReplit ? 'Replit' : 'local'} environment`);
  console.log(`[VITE] Server will run on ${getDefaultHost()}:${getDefaultPort()}`);

  return {
    plugins: [react()],
    server: {
      host: getDefaultHost(),
      port: 5176,
      strictPort: true,
      proxy: isDevelopment ? undefined : {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.error('[VITE] Proxy error:', err.message);
            });
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
});

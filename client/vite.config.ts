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
const getDefaultPort = () => isReplit ? 3001 : 3000;
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
      port: 5173, // Default Vite port
      proxy: {
        '/api': {
          target: `http://${getDefaultHost()}:${getDefaultPort()}`,
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
              }
            });

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
})

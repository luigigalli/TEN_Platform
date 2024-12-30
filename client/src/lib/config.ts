// Environment detection
const isReplit = Boolean(import.meta.env.VITE_REPL_URL);
const isWindsurf = Boolean(import.meta.env.VITE_WINDSURF_ENV);

// Get appropriate API URL based on environment
export function getApiUrl(): string {
  // Use explicitly configured API URL if available
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // For Replit, use the Replit URL with port 3001 (server port)
  if (isReplit && import.meta.env.VITE_REPL_URL) {
    const baseUrl = import.meta.env.VITE_REPL_URL.replace(/\/$/, ''); // Remove trailing slash if present
    return `${baseUrl}:3001`;
  }

  // Default to port 3000 for local development
  return 'http://localhost:3000';
}

// Get base URL for client
export function getBaseUrl(): string {
  // Use explicitly configured base URL if available
  if (import.meta.env.VITE_BASE_URL) {
    return import.meta.env.VITE_BASE_URL;
  }

  // For Replit, use the Replit URL
  if (isReplit && import.meta.env.VITE_REPL_URL) {
    return import.meta.env.VITE_REPL_URL.replace(/\/$/, ''); // Remove trailing slash if present
  }

  // Default to port 3000 for local development
  return 'http://localhost:3000';
}

// Export configuration
export const config = {
  env: import.meta.env.MODE,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  isReplit,
  isWindsurf,
  apiUrl: getApiUrl(),
  baseUrl: getBaseUrl()
} as const;

import { config } from './config';

// API client configuration
const API_BASE_URL = `${config.apiUrl}/api`;

// Health check endpoint
export async function checkHealth(): Promise<{
  status: string;
  environment: string;
  platform: string;
  internalPort: number;
  externalPort: number;
  externalUrl: string;
}> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  return response.json();
}

// Export API client
export const api = {
  health: {
    check: checkHealth
  }
} as const;

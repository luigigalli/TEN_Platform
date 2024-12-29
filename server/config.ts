import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file in development
dotenv.config();

// Environment detection
export const isReplit = Boolean(process.env.REPL_ID && process.env.REPL_OWNER);
export const isDevelopment = process.env.NODE_ENV !== 'production';

// Port configuration
const DEFAULT_PORT = 3000;
const REPLIT_PORT = 5000;

// Environment configuration schema
const configSchema = z.object({
  database: z.object({
    url: z.string().min(1),
  }),
  server: z.object({
    port: z.number().int().positive(),
    host: z.string().default('0.0.0.0'),
    corsOrigins: z.array(z.string()),
  }),
  env: z.enum(['development', 'production']).default('development'),
});

// Get port based on environment
function determinePort(): number {
  if (process.env.PORT) {
    return parseInt(process.env.PORT, 10);
  }
  return isReplit ? REPLIT_PORT : DEFAULT_PORT;
}

// Configuration object
export const config = {
  database: {
    url: process.env.DATABASE_URL || '',
  },
  server: {
    port: determinePort(),
    host: '0.0.0.0',
    corsOrigins: [
      `http://localhost:${determinePort()}`,
      `http://127.0.0.1:${determinePort()}`,
      `http://0.0.0.0:${determinePort()}`,
      /\.repl\.co$/,
    ],
  },
  env: (process.env.NODE_ENV || 'development') as 'development' | 'production',
};

// Validate configuration
try {
  configSchema.parse(config);
} catch (error) {
  console.error('Invalid configuration:', error);
  process.exit(1);
}
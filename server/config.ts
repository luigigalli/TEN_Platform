import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Environment variable schema
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).default('3000'),
});

// Validate environment variables
export const env = envSchema.parse(process.env);

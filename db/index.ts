import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@db/schema";
import { DatabaseConfigError } from '../server/errors';

// Initialize database connection only if URL is provided
export const db = process.env.DATABASE_URL 
  ? drizzle(
      postgres(process.env.DATABASE_URL, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
      }), 
      { schema }
    )
  : null;
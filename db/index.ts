import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@db/schema";
import { config } from '../server/config';
import { ServerError } from '../server/errors';

/**
 * Database Connection Module
 * 
 * Initializes the database connection using environment-aware configuration.
 * Handles both Replit and Windsurf development environments through the centralized config.
 */

if (!config.database.url) {
  throw new ServerError(
    "DATABASE_URL must be set. Did you forget to provision a database?",
    "DATABASE_URL_MISSING",
    500
  );
}

// Create the database connection with environment-specific settings
const client = postgres(config.database.url, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle({
  client,
  schema,
});
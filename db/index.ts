import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@db/schema";
import { DatabaseConfigError } from '../server/errors/environment';

if (!process.env.DATABASE_URL) {
  throw new DatabaseConfigError(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Create the database connection with environment-aware configuration
const client = postgres(process.env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@db/schema";
import { config } from '../server/config';

if (!config.database.url) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create the database connection
const client = postgres(config.database.url);
export const db = drizzle({
  client,
  schema,
});
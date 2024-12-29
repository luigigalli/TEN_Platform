import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@db/schema";
import { env } from '../server/config';

if (!env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create the database connection
const client = postgres(env.DATABASE_URL);
export const db = drizzle({
  client,
  schema,
});

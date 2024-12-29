import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@db/schema";
import { ServerError } from '../server/errors';

if (!process.env.DATABASE_URL) {
  throw new ServerError(
    "DATABASE_URL must be set. Did you forget to provision a database?",
    "DATABASE_URL_MISSING",
    500
  );
}

// Create the database connection
const client = postgres(process.env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
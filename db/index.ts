
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@db/schema";
import { DatabaseConfigError } from '../server/errors';

const connectionOptions = {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: { rejectUnauthorized: false }
};

if (!process.env.REPLIT_DB_URL) {
  throw new DatabaseConfigError('Missing REPLIT_DB_URL environment variable');
}

export const db = drizzle(
  postgres(process.env.REPLIT_DB_URL, connectionOptions),
  { schema }
);

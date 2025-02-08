import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config as dotenv } from 'dotenv';

// Load environment variables
dotenv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('Running migrations...');
  
  const migrationClient = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    await migrate(db, {
      migrationsFolder: path.join(__dirname, '../db/migrations'),
    });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

main();

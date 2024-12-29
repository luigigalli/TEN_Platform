import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const fixSchema = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = postgres(connectionString, { max: 1 });
  
  try {
    // Add new columns
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS first_name TEXT,
      ADD COLUMN IF NOT EXISTS last_name TEXT,
      ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
    `;

    // Copy full_name data to first_name if it exists
    await sql`
      UPDATE users 
      SET first_name = full_name 
      WHERE full_name IS NOT NULL AND first_name IS NULL;
    `;

    // Drop full_name column if it exists
    await sql`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS full_name;
    `;

    console.log('Schema updated successfully');
  } catch (error) {
    console.error('Schema update failed:', error);
    process.exit(1);
  }

  await sql.end();
  process.exit(0);
};

fixSchema();

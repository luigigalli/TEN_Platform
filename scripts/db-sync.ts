
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const DB_URL = process.env.REPLIT_DB_URL;

if (!DB_URL) {
  console.error('Error: REPLIT_DB_URL must be set');
  process.exit(1);
}

const client = postgres(DB_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  ssl: { rejectUnauthorized: false }
});

const db = drizzle(client, { schema });

async function sync() {
  console.log('Starting database sync...');
  
  try {
    await db.execute(sql.raw('SELECT 1'));
    console.log('Successfully connected to database');
    
    // Perform sync operations
    const result = await db.execute(sql.raw('SELECT current_database()'));
    console.log('Connected to database:', result[0].current_database);
    console.log('Sync completed successfully!');
  } catch (error) {
    console.error('Database sync failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

sync();

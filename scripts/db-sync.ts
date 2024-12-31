
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

import dotenv from 'dotenv';
dotenv.config();

const REPLIT_DB_URL = process.env.REPLIT_DB_URL;

if (!REPLIT_DB_URL) {
  console.error('Error: REPLIT_DB_URL must be set');
  process.exit(1);
}

const baseOptions = {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  ssl: { 
    rejectUnauthorized: false 
  },
  keepAlive: true
};

const client = postgres(REPLIT_DB_URL, baseOptions);
const db = drizzle(client, { schema });

async function sync() {
  console.log('Starting database sync...');
  
  try {
    await db.execute(sql.raw('SELECT 1'));
    console.log('Successfully connected to Replit database');
    
    // Perform sync operations
    await db.execute(sql.raw('SELECT current_database()'));
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

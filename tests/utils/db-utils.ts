import { db } from '../setup';
import { users } from '../../server/db/schema';
import { sql } from 'drizzle-orm';

export async function clearDatabase() {
  // Add tables in order of dependencies
  const tables = [
    'users',
    'services',
    'bookings',
    // Add other tables as they are created
  ];

  for (const table of tables) {
    await db.execute(sql.raw(`TRUNCATE TABLE ${table} CASCADE`));
  }
}

export async function createTestUser(data: {
  email: string;
  password: string;
  name: string;
}) {
  return db.insert(users).values({
    email: data.email,
    password: data.password, // Note: In real app, this should be hashed
    name: data.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
}

// Add more test data helpers as needed

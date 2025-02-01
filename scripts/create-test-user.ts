import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import * as dotenv from 'dotenv';

dotenv.config();

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createTestUser() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = postgres(process.env.DATABASE_URL, { 
    max: 1,
    ssl: { rejectUnauthorized: false }
  });

  const db = drizzle(sql);

  try {
    // Check if test user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, "test_sync_user"))
      .limit(1);

    if (existingUser) {
      console.log('Test user already exists:', {
        id: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
        firstName: existingUser.firstName
      });
      return existingUser;
    }

    // Create new test user with proper field mapping
    const [newUser] = await db
      .insert(users)
      .values({
        username: "test_sync_user",
        email: "test_sync@example.com",
        password: await hashPassword("test_password"),
        firstName: "Test",  // Using proper camelCase as defined in schema
        lastName: "User",   // Using proper camelCase as defined in schema
        role: "user",
        profileCompleted: false,
        languages: []
      })
      .returning();

    console.log('Created new test user:', {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.firstName
    });

    return newUser;
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the script
createTestUser().catch(console.error);
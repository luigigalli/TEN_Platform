import { db } from '../db';
import { users } from '../db/schema';

async function checkUsers() {
  try {
    const allUsers = await db.select().from(users);
    console.log('Users in database:', allUsers);
  } catch (error) {
    console.error('Error querying users:', error);
  }
  process.exit(0);
}

checkUsers();

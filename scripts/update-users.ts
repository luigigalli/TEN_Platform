
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

async function updateUsers() {
  try {
    await db.update(users)
      .set({ firstName: 'Luigi' })
      .where(eq(users.username, 'gigigalli'));
    
    await db.update(users)
      .set({ firstName: 'Pippo' })
      .where(eq(users.username, 'pippo'));
    
    console.log('Users updated successfully');
  } catch (error) {
    console.error('Error updating users:', error);
  }
  process.exit(0);
}

updateUsers();

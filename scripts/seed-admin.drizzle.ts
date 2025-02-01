import { db } from '../db';
import { users, roles, permissions, rolePermissions, userRoles } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

async function seed() {
  try {
    console.log('Starting admin user seed...');

    // Create admin role if it doesn't exist
    const [existingRole] = await db.select()
      .from(roles)
      .where(eq(roles.name, 'ADMIN'))
      .limit(1);

    let adminRole = existingRole;
    if (!adminRole) {
      const [newRole] = await db.insert(roles)
        .values({
          name: 'ADMIN',
          description: 'Administrator role with full access',
          isActive: true
        })
        .returning();
      adminRole = newRole;
      console.log('Admin role created');
    } else {
      console.log('Admin role already exists');
    }

    // Create basic permissions if they don't exist
    const permissionData = [
      { name: 'user:read', description: 'Read user data', resource: 'user', action: 'read' },
      { name: 'user:write', description: 'Write user data', resource: 'user', action: 'write' },
      { name: 'role:manage', description: 'Manage roles', resource: 'role', action: 'manage' },
    ];

    for (const data of permissionData) {
      const [existingPermission] = await db.select()
        .from(permissions)
        .where(eq(permissions.name, data.name))
        .limit(1);

      if (!existingPermission) {
        const [permission] = await db.insert(permissions)
          .values({
            ...data,
            isActive: true
          })
          .returning();
        console.log(`Permission ${data.name} created`);

        // Assign permission to admin role
        await db.insert(rolePermissions)
          .values({
            roleId: adminRole.id,
            permissionId: permission.id
          });
      } else {
        console.log(`Permission ${data.name} already exists`);
      }
    }

    // Find or create admin user
    const [existingUser] = await db.select()
      .from(users)
      .where(eq(users.username, 'admin'))
      .limit(1);

    const password = ':-)Eco2024';
    console.log('Using password:', password);
    const salt = await bcrypt.genSalt(10);
    console.log('Generated salt:', salt);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Generated hashed password:', hashedPassword);

    let adminUser;
    if (!existingUser) {
      const [newUser] = await db.insert(users)
        .values({
          username: 'admin',
          email: 'admin@example.com',
          fname: 'Admin',
          lname: 'User',
          password: hashedPassword,
          status: 'active',
          type: 1,
          role: 'admin'
        })
        .returning();
      adminUser = newUser;
      console.log('Creating new admin user');
    } else {
      const [updatedUser] = await db.update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      adminUser = updatedUser;
      console.log('Updating existing admin user');
    }

    // Assign admin role to user if not already assigned
    const [existingUserRole] = await db.select()
      .from(userRoles)
      .where(
        eq(userRoles.userId, adminUser.id)
      )
      .limit(1);

    if (!existingUserRole) {
      await db.insert(userRoles)
        .values({
          userId: adminUser.id,
          roleId: adminRole.id
        });
      console.log('Admin role assigned to user');
    }

    console.log('Admin user saved');
    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();

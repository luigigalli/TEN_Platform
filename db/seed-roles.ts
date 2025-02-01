import { db } from "./db";
import { roles, permissions, rolePermissions } from "./schema";
import { v4 as uuidv4 } from "uuid";

async function seedRolesAndPermissions() {
  try {
    // Create roles
    const rolesList = [
      { id: uuidv4(), code: 'ADM', name: 'Admin', description: 'System administrator with full access' },
      { id: uuidv4(), code: 'EDT', name: 'Editor', description: 'Content editor' },
      { id: uuidv4(), code: 'AUT', name: 'Author', description: 'Content author' },
      { id: uuidv4(), code: 'ACC', name: 'Accountant', description: 'Financial management' },
      { id: uuidv4(), code: 'CSS', name: 'Customer Support', description: 'Customer support staff' },
      { id: uuidv4(), code: 'LEX', name: 'Local Expert', description: 'Local expert for specific regions' },
      { id: uuidv4(), code: 'ACT', name: 'Activity Supplier', description: 'Provider of activities' },
      { id: uuidv4(), code: 'ACM', name: 'Accommodation Supplier', description: 'Provider of accommodations' },
      { id: uuidv4(), code: 'CST', name: 'Customer', description: 'End user/customer' }
    ];

    console.log('Creating roles...');
    for (const role of rolesList) {
      await db.insert(roles).values(role).onConflictDoNothing();
    }

    // Define resources and actions for permissions
    const resources = [
      'users',
      'roles',
      'permissions',
      'trips',
      'bookings',
      'services',
      'messages',
      'posts'
    ];

    const actions = [
      'create',
      'read',
      'update',
      'delete',
      'manage'
    ];

    // Create permissions
    console.log('Creating permissions...');
    for (const resource of resources) {
      for (const action of actions) {
        const permission = {
          id: uuidv4(),
          name: `${resource}:${action}`,
          description: `Can ${action} ${resource}`,
          resource,
          action
        };
        await db.insert(permissions).values(permission).onConflictDoNothing();
      }
    }

    // Get created roles and permissions
    const createdRoles = await db.select().from(roles);
    const createdPermissions = await db.select().from(permissions);

    // Define role-permission mappings
    const rolePermissionMappings = {
      'ADM': createdPermissions.map(p => p.id), // Admin gets all permissions
      'EDT': createdPermissions.filter(p => 
        p.resource === 'posts' || 
        p.resource === 'trips' || 
        (p.resource === 'messages' && p.action !== 'delete')
      ).map(p => p.id),
      'AUT': createdPermissions.filter(p => 
        (p.resource === 'posts' && ['create', 'read', 'update'].includes(p.action)) ||
        (p.resource === 'messages' && ['create', 'read'].includes(p.action))
      ).map(p => p.id),
      'CST': createdPermissions.filter(p => 
        (p.resource === 'bookings' && ['create', 'read'].includes(p.action)) ||
        (p.resource === 'messages' && ['create', 'read'].includes(p.action)) ||
        (p.resource === 'services' && p.action === 'read')
      ).map(p => p.id)
    };

    // Assign permissions to roles
    console.log('Assigning permissions to roles...');
    for (const role of createdRoles) {
      const permissionIds = rolePermissionMappings[role.code];
      if (permissionIds) {
        for (const permissionId of permissionIds) {
          await db.insert(rolePermissions).values({
            id: uuidv4(),
            roleId: role.id,
            permissionId
          }).onConflictDoNothing();
        }
      }
    }

    console.log('Successfully seeded roles and permissions');
  } catch (error) {
    console.error('Error seeding roles and permissions:', error);
    throw error;
  }
}

seedRolesAndPermissions();

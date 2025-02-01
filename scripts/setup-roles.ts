import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupRolesAndPermissions() {
    try {
        // Create roles
        const roles = [
            { code: 'ADM', name: 'Admin', description: 'System administrator with full access' },
            { code: 'EDT', name: 'Editor', description: 'Content editor' },
            { code: 'AUT', name: 'Author', description: 'Content author' },
            { code: 'ACC', name: 'Accountant', description: 'Financial management' },
            { code: 'CSS', name: 'Customer Support', description: 'Customer support staff' },
            { code: 'LEX', name: 'Local Expert', description: 'Local expert for specific regions' },
            { code: 'ACT', name: 'Activity Supplier', description: 'Provider of activities' },
            { code: 'ACM', name: 'Accommodation Supplier', description: 'Provider of accommodations' },
            { code: 'CST', name: 'Customer', description: 'End user/customer' }
        ];

        for (const role of roles) {
            await prisma.role.upsert({
                where: { code: role.code },
                update: {
                    name: role.name,
                    description: role.description
                },
                create: {
                    code: role.code,
                    name: role.name,
                    description: role.description
                }
            });
        }

        console.log('✅ Roles created successfully');

        // Create permissions
        const resources = [
            'users',
            'roles',
            'permissions',
            'content',
            'activities',
            'accommodations',
            'bookings',
            'payments',
            'reports',
            'support',
            'users.financials'
        ];

        const actions = ['create', 'read', 'update', 'delete', 'manage'];

        for (const resource of resources) {
            for (const action of actions) {
                const name = `${resource}:${action}`;
                const description = `Can ${action} ${resource}`;

                await prisma.permission.upsert({
                    where: { name },
                    update: {
                        description,
                        resource,
                        action
                    },
                    create: {
                        name,
                        description,
                        resource,
                        action
                    }
                });
            }
        }

        console.log('✅ Permissions created successfully');

        // Define role permissions
        const rolePermissions = {
            'ADM': ['*:*'], // Admin gets all permissions
            'EDT': [
                'content:*',
                'users:read',
                'roles:read'
            ],
            'AUT': [
                'content:create',
                'content:read',
                'content:update'
            ],
            'ACC': [
                'payments:*',
                'reports:*',
                'bookings:read',
                'users.financials:read',
                'users.financials:update'
            ],
            'CSS': [
                'support:*',
                'users:read',
                'bookings:read',
                'activities:read',
                'accommodations:read'
            ],
            'LEX': [
                'activities:read',
                'accommodations:read',
                'content:read'
            ],
            'ACT': [
                'activities:*',
                'users.financials:read',
                'users.financials:update'
            ],
            'ACM': [
                'accommodations:*',
                'users.financials:read',
                'users.financials:update'
            ],
            'CST': [
                'activities:read',
                'accommodations:read',
                'bookings:create',
                'users.financials:read',
                'users.financials:update'
            ]
        };

        // For each role, assign its permissions
        for (const [roleCode, permissions] of Object.entries(rolePermissions)) {
            const role = await prisma.role.findUnique({
                where: { code: roleCode }
            });

            if (!role) continue;

            // If role has wildcard permission (*:*), assign all permissions
            if (permissions.includes('*:*')) {
                const allPermissions = await prisma.permission.findMany();
                await prisma.role.update({
                    where: { id: role.id },
                    data: {
                        permissions: {
                            connect: allPermissions.map(p => ({ id: p.id }))
                        }
                    }
                });
                continue;
            }

            // For each permission pattern
            for (const pattern of permissions) {
                const [resource, action] = pattern.split(':');

                // If action is wildcard (*), assign all actions for the resource
                const where = action === '*'
                    ? { resource }
                    : { AND: [{ resource }, { action }] };

                const perms = await prisma.permission.findMany({ where });

                if (perms.length > 0) {
                    await prisma.role.update({
                        where: { id: role.id },
                        data: {
                            permissions: {
                                connect: perms.map(p => ({ id: p.id }))
                            }
                        }
                    });
                }
            }
        }

        console.log('✅ Role permissions assigned successfully');

        // Assign admin role to first user
        const firstUser = await prisma.user.findFirst();
        if (firstUser) {
            console.log('Assigning admin role to first user:', firstUser.id);
            const adminRole = await prisma.role.findUnique({ where: { code: 'ADM' } });
            if (adminRole) {
                await prisma.user.update({
                    where: { id: firstUser.id },
                    data: {
                        roles: {
                            connect: { id: adminRole.id }
                        }
                    }
                });
            }
        }

    } catch (error) {
        console.error('Error setting up roles and permissions:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

setupRolesAndPermissions()
    .then(() => console.log('✅ Setup completed successfully'))
    .catch(error => {
        console.error('Setup failed:', error);
        process.exit(1);
    });

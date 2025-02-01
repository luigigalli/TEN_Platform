import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedRolesAndPermissions1706134000000 implements MigrationInterface {
    name = 'SeedRolesAndPermissions1706134000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
            await queryRunner.query(`
                INSERT INTO "roles" ("code", "name", "description")
                VALUES ($1, $2, $3)
                ON CONFLICT ("code") DO UPDATE
                SET name = EXCLUDED.name,
                    description = EXCLUDED.description
            `, [role.code, role.name, role.description]);
        }

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
            'support'
        ];

        const actions = ['create', 'read', 'update', 'delete', 'manage'];

        for (const resource of resources) {
            for (const action of actions) {
                const name = `${resource}:${action}`;
                const description = `Can ${action} ${resource}`;
                
                await queryRunner.query(`
                    INSERT INTO "permissions" ("name", "description", "resource", "action")
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT ("name") DO UPDATE
                    SET description = EXCLUDED.description,
                        resource = EXCLUDED.resource,
                        action = EXCLUDED.action
                `, [name, description, resource, action]);
            }
        }

        // Assign permissions to roles
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
                'bookings:read'
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
                'activities:*'
            ],
            'ACM': [
                'accommodations:*'
            ],
            'CST': [
                'activities:read',
                'accommodations:read',
                'bookings:create'
            ]
        };

        // For each role, assign its permissions
        for (const [roleCode, permissions] of Object.entries(rolePermissions)) {
            const role = await queryRunner.query(
                'SELECT id FROM roles WHERE code = $1',
                [roleCode]
            );

            if (role && role[0]) {
                const roleId = role[0].id;

                // If role has wildcard permission (*:*), assign all permissions
                if (permissions.includes('*:*')) {
                    await queryRunner.query(`
                        INSERT INTO "role_permissions" ("role_id", "permission_id")
                        SELECT $1, p.id
                        FROM permissions p
                    `, [roleId]);
                    continue;
                }

                // For each permission pattern
                for (const pattern of permissions) {
                    const [resource, action] = pattern.split(':');
                    
                    // If action is wildcard (*), assign all actions for the resource
                    if (action === '*') {
                        await queryRunner.query(`
                            INSERT INTO "role_permissions" ("role_id", "permission_id")
                            SELECT $1, p.id
                            FROM permissions p
                            WHERE p.resource = $2
                        `, [roleId, resource]);
                    } else {
                        await queryRunner.query(`
                            INSERT INTO "role_permissions" ("role_id", "permission_id")
                            SELECT $1, p.id
                            FROM permissions p
                            WHERE p.resource = $2 AND p.action = $3
                        `, [roleId, resource, action]);
                    }
                }
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove all role-permission assignments
        await queryRunner.query('DELETE FROM "role_permissions"');
        
        // Remove all permissions
        await queryRunner.query('DELETE FROM "permissions"');
        
        // Remove all roles
        await queryRunner.query('DELETE FROM "roles"');
    }
}

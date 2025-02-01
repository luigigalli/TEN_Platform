import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export default class CreateUserGroupCustomerTables1705861812000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable uuid-ossp extension for UUID generation
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create groups table
        await queryRunner.createTable(
            new Table({
                name: 'groups',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'permissions',
                        type: 'jsonb',
                        default: "'{}'"
                    },
                    {
                        name: 'active',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true
        );

        // Create customers table
        await queryRunner.createTable(
            new Table({
                name: 'customers',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'contact_email',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'contact_phone',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'address',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'settings',
                        type: 'jsonb',
                        default: "'{}'"
                    },
                    {
                        name: 'active',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true
        );

        // Create users table
        await queryRunner.createTable(
            new Table({
                name: 'users',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'prefix',
                        type: 'varchar',
                        length: '10',
                        isNullable: true,
                    },
                    {
                        name: 'fname',
                        type: 'varchar',
                    },
                    {
                        name: 'mname',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'lname',
                        type: 'varchar',
                    },
                    {
                        name: 'suffix',
                        type: 'varchar',
                        length: '10',
                        isNullable: true,
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        isUnique: true,
                    },
                    {
                        name: 'password',
                        type: 'varchar',
                    },
                    {
                        name: 'phone',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'phonecode',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'bday',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'gender',
                        type: 'enum',
                        enum: ['male', 'female', 'other', 'prefer_not_to_say'],
                        isNullable: true,
                    },
                    {
                        name: 'image_name',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'language',
                        type: 'enum',
                        enum: ['en', 'es', 'fr', 'it', 'de'],
                        default: "'en'",
                    },
                    {
                        name: 'others_lang_name',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'short_bio',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'role',
                        type: 'enum',
                        enum: ['user', 'provider', 'admin'],
                        default: "'user'",
                    },
                    {
                        name: 'permission',
                        type: 'jsonb',
                        default: "'{}'"
                    },
                    {
                        name: 'email_verified',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'email_verified_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'remember_token',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'group_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'customer_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'active',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true
        );

        // Add foreign key constraints
        await queryRunner.createForeignKey(
            'users',
            new TableForeignKey({
                columnNames: ['group_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'groups',
                onDelete: 'SET NULL',
            })
        );

        await queryRunner.createForeignKey(
            'users',
            new TableForeignKey({
                columnNames: ['customer_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'customers',
                onDelete: 'SET NULL',
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys first
        const userTable = await queryRunner.getTable('users');
        const groupForeignKey = userTable?.foreignKeys.find(
            (fk) => fk.columnNames.indexOf('group_id') !== -1
        );
        const customerForeignKey = userTable?.foreignKeys.find(
            (fk) => fk.columnNames.indexOf('customer_id') !== -1
        );

        if (groupForeignKey) {
            await queryRunner.dropForeignKey('users', groupForeignKey);
        }
        if (customerForeignKey) {
            await queryRunner.dropForeignKey('users', customerForeignKey);
        }

        // Drop tables
        await queryRunner.dropTable('users');
        await queryRunner.dropTable('customers');
        await queryRunner.dropTable('groups');

        // Drop extension
        await queryRunner.query('DROP EXTENSION IF EXISTS "uuid-ossp"');
    }
}

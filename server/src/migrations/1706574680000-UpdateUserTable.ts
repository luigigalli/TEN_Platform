import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class UpdateUserTable1706574680000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new columns to users table
        await queryRunner.addColumns("users", [
            new TableColumn({
                name: "fname",
                type: "varchar",
                length: "255",
                isNullable: false
            }),
            new TableColumn({
                name: "mname",
                type: "varchar",
                length: "255",
                isNullable: true
            }),
            new TableColumn({
                name: "lname",
                type: "varchar",
                length: "255",
                isNullable: false
            }),
            new TableColumn({
                name: "prefix",
                type: "varchar",
                length: "10",
                isNullable: true
            }),
            new TableColumn({
                name: "suffix",
                type: "varchar",
                length: "10",
                isNullable: true
            }),
            new TableColumn({
                name: "phone",
                type: "varchar",
                length: "50",
                isNullable: true
            }),
            new TableColumn({
                name: "phonecode",
                type: "varchar",
                length: "10",
                isNullable: true
            }),
            new TableColumn({
                name: "bday",
                type: "date",
                isNullable: true
            }),
            new TableColumn({
                name: "refresh_token",
                type: "varchar",
                length: "255",
                isNullable: true
            }),
            new TableColumn({
                name: "status",
                type: "enum",
                enum: ["active", "inactive", "pending"],
                default: "'active'",
                isNullable: false
            }),
            new TableColumn({
                name: "group_id",
                type: "uuid",
                isNullable: true
            }),
            new TableColumn({
                name: "customer_id",
                type: "uuid",
                isNullable: true
            }),
            new TableColumn({
                name: "permissions",
                type: "jsonb",
                default: "'{}'",
                isNullable: false
            }),
            new TableColumn({
                name: "created_at",
                type: "timestamp",
                default: "CURRENT_TIMESTAMP",
                isNullable: false
            }),
            new TableColumn({
                name: "updated_at",
                type: "timestamp",
                default: "CURRENT_TIMESTAMP",
                onUpdate: "CURRENT_TIMESTAMP",
                isNullable: false
            })
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove added columns from users table
        await queryRunner.dropColumns("users", [
            "fname",
            "mname",
            "lname",
            "prefix",
            "suffix",
            "phone",
            "phonecode",
            "bday",
            "refresh_token",
            "status",
            "group_id",
            "customer_id",
            "permissions",
            "created_at",
            "updated_at"
        ]);
    }
}

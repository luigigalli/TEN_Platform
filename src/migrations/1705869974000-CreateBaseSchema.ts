import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBaseSchema1705869974000 implements MigrationInterface {
    name = 'CreateBaseSchema1705869974000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "prefix" varchar,
                "firstName" varchar NOT NULL,
                "middleName" varchar,
                "lastName" varchar NOT NULL,
                "suffix" varchar,
                "email" varchar NOT NULL UNIQUE,
                "phone" varchar,
                "phoneCode" varchar,
                "birthday" date,
                "gender" varchar,
                "image" varchar,
                "bio" text,
                "language" varchar NOT NULL DEFAULT 'en',
                "password" varchar NOT NULL,
                "emailVerified" boolean NOT NULL DEFAULT false,
                "permissions" jsonb NOT NULL DEFAULT '{}',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "groups" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "name" varchar NOT NULL,
                "description" text,
                "permissions" jsonb NOT NULL DEFAULT '{}',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "user_groups" (
                "group_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                CONSTRAINT "PK_user_groups" PRIMARY KEY ("group_id", "user_id"),
                CONSTRAINT "FK_user_groups_group" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_user_groups_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_user_groups_group_id" ON "user_groups"("group_id");
            CREATE INDEX "IDX_user_groups_user_id" ON "user_groups"("user_id");
            CREATE INDEX "IDX_users_email" ON "users"("email");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_users_email"`);
        await queryRunner.query(`DROP INDEX "IDX_user_groups_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_user_groups_group_id"`);
        await queryRunner.query(`DROP TABLE "user_groups"`);
        await queryRunner.query(`DROP TABLE "groups"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}

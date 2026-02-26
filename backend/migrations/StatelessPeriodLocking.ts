import { MigrationInterface, QueryRunner } from 'typeorm';

export class StatelessPeriodLocking1740700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create new tables
    await queryRunner.query(`
      CREATE TABLE "admin_lock" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "entity_id" uuid NOT NULL,
        "lock_date" date NOT NULL,
        "locked_by" uuid NOT NULL,
        "locked_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admin_lock" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_admin_lock_entity" UNIQUE ("entity_id"),
        CONSTRAINT "FK_admin_lock_entity" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "period_exception" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "entity_id" uuid NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "reason" text,
        "granted_by" uuid NOT NULL,
        "granted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_period_exception" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_period_exception" UNIQUE ("user_id", "entity_id", "start_date", "end_date"),
        CONSTRAINT "FK_period_exception_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_period_exception_entity" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE
      )
    `);

    // 2. Migrate existing exceptions from old table
    await queryRunner.query(`
      INSERT INTO "period_exception" ("user_id", "entity_id", "start_date", "end_date", "reason", "granted_by")
      SELECT
        rpe."user_id",
        rp."entity_id",
        rpe."start_date",
        rpe."end_date",
        rpe."reason",
        rpe."granted_by"
      FROM "reporting_period_exception" rpe
      JOIN "reporting_period" rp ON rpe."reporting_period_id" = rp."id"
      ON CONFLICT DO NOTHING
    `);

    // 3. Drop FK and column from activity
    await queryRunner.query(
      `ALTER TABLE "activity" DROP CONSTRAINT IF EXISTS "FK_f2a69b1e4f922146ddd3fcd61ef"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_f2a69b1e4f922146ddd3fcd61e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity" DROP COLUMN IF EXISTS "reporting_period_id"`,
    );

    // 4. Drop old tables
    await queryRunner.query(`DROP TABLE IF EXISTS "reporting_period_exception"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reporting_period"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "reporting_period_status_enum"`);

    // 5. Drop reporting_period_days from entities
    await queryRunner.query(
      `ALTER TABLE "entities" DROP COLUMN IF EXISTS "reporting_period_days"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse migration - recreate old structure
    await queryRunner.query(
      `ALTER TABLE "entities" ADD COLUMN "reporting_period_days" integer`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."reporting_period_status_enum" AS ENUM('active','locked')`,
    );

    await queryRunner.query(`
      CREATE TABLE "reporting_period" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "entity_id" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" text,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "status" "public"."reporting_period_status_enum" NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" uuid NOT NULL,
        "updated_by" uuid NOT NULL,
        CONSTRAINT "PK_273d2b68dc1854618ec53e144d0" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "reporting_period" ADD CONSTRAINT "FK_a21ad30ae2e2a148af8e03ad29f" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "activity" ADD COLUMN "reporting_period_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity" ADD CONSTRAINT "FK_f2a69b1e4f922146ddd3fcd61ef" FOREIGN KEY ("reporting_period_id") REFERENCES "reporting_period"("id")`,
    );

    await queryRunner.query(`DROP TABLE IF EXISTS "period_exception"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_lock"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialBaseline1700000000000 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Skip if tables already exist (DB was created by synchronize before migrations existed)
    const tableExists = await queryRunner.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles'`,
    );
    if (tableExists.length > 0) {
      return;
    }

    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "citext"');

    await queryRunner.query(
      "CREATE TYPE \"public\".\"entities_type_enum\" AS ENUM('PLATFORM','UNION','ASSOCIATION','FIELD')",
    );
    await queryRunner.query(
      "CREATE TYPE \"public\".\"user_status_enum\" AS ENUM('active','suspended','archived')",
    );
    await queryRunner.query(
      'CREATE TYPE "public"."activity_status_enum" AS ENUM(\'active\',\'archived\')',
    );
    await queryRunner.query(
      'CREATE TYPE "public"."reporting_period_status_enum" AS ENUM(\'active\',\'locked\')',
    );
    await queryRunner.query(
      "CREATE TYPE \"public\".\"activity_type_growth_direction_enum\" AS ENUM('positive','negative','neutral')",
    );

    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(80) NOT NULL,
        "description" character varying(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "entities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(80) NOT NULL,
        "type" "public"."entities_type_enum" NOT NULL,
        "code" character varying(6),
        "description" character varying(500),
        "location" character varying(255),
        "currency_symbol" character varying(10),
        "is_active" boolean NOT NULL DEFAULT true,
        "term_length_years" integer NOT NULL DEFAULT 5,
        "reporting_period_days" integer,
        "parent_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_8640855ae82083455cbb806173d" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_a62fb12b8d3c963592566730add" UNIQUE ("name", "type"),
        CONSTRAINT "CHK_55dace5e6ec812ec2498b8fc67" CHECK (term_length_years >= 1 AND term_length_years <= 20)
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "entities"
      ADD CONSTRAINT "FK_f71464f7957c883c9675f80d2e2"
      FOREIGN KEY ("parent_id") REFERENCES "entities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" character varying NOT NULL,
        "email" character varying NOT NULL,
        "status" "public"."user_status_enum" NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "archived_at" TIMESTAMP WITH TIME ZONE,
        "full_name" text,
        "first_name" text,
        "family_name" text,
        "role_id" uuid NOT NULL,
        "entity_id" uuid NOT NULL,
        CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_a773bae6f95f48736f8e9fb973" CHECK (status IN ('active','suspended','archived'))
      )
    `);

    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_e12875dfb3b1d92d7d7c5377e2" ON "user" ("email")',
    );
    await queryRunner.query('CREATE INDEX "idx_user_role_id" ON "user" ("role_id")');
    await queryRunner.query('CREATE INDEX "idx_user_entity_id" ON "user" ("entity_id")');

    await queryRunner.query(`
      ALTER TABLE "user"
      ADD CONSTRAINT "FK_fb2e442d14add3cefbdf33c4561"
      FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD CONSTRAINT "FK_b54f8ea623b17094db7667d8206"
      FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "activity_type" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" text NOT NULL,
        "description" text NOT NULL,
        "growth_direction" "public"."activity_type_growth_direction_enum" NOT NULL DEFAULT 'positive',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fc087d79002cef578e27dd9fdab" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_af4a02cc6b439f59845112bfbc" CHECK (name <> ''),
        CONSTRAINT "CHK_db535f606a8ea1b2758fbe50b5" CHECK (description <> '')
      )
    `);

    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_71e01cca515ddd99750868b6e5" ON "activity_type" ("name")',
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
        CONSTRAINT "PK_273d2b68dc1854618ec53e144d0" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_ae3451c7ba4f05881802e91983" CHECK (status IN ('active','locked'))
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "IDX_d4550f1156c7037a8efe27cac2" ON "reporting_period" ("start_date", "end_date")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_31e45ff2a6777e603aaaa2c3ef" ON "reporting_period" ("entity_id", "status")',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "idx_one_active_per_entity" ON "reporting_period" ("entity_id", "status") WHERE status = \'active\'',
    );

    await queryRunner.query(`
      ALTER TABLE "reporting_period"
      ADD CONSTRAINT "FK_a21ad30ae2e2a148af8e03ad29f"
      FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "activity" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "activity_type_id" uuid NOT NULL,
        "activity_date" date NOT NULL,
        "description" text,
        "has_expense" boolean NOT NULL DEFAULT false,
        "expense_amount" numeric(10,2),
        "user_id" uuid NOT NULL,
        "reporting_period_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" uuid NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" uuid NOT NULL,
        "status" "public"."activity_status_enum" NOT NULL DEFAULT 'active',
        "archived_at" TIMESTAMP WITH TIME ZONE,
        "archived_by" uuid,
        CONSTRAINT "PK_24625a1d6b1b089c8ae206fe467" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "IDX_2f0858b012f495fa3dd60da6d2" ON "activity" ("activity_type_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_10bf0c2dd4736190070e847511" ON "activity" ("user_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_f2a69b1e4f922146ddd3fcd61e" ON "activity" ("reporting_period_id")',
    );

    await queryRunner.query(`
      ALTER TABLE "activity"
      ADD CONSTRAINT "FK_2f0858b012f495fa3dd60da6d25"
      FOREIGN KEY ("activity_type_id") REFERENCES "activity_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "activity"
      ADD CONSTRAINT "FK_10bf0c2dd4736190070e8475119"
      FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "activity"
      ADD CONSTRAINT "FK_f2a69b1e4f922146ddd3fcd61ef"
      FOREIGN KEY ("reporting_period_id") REFERENCES "reporting_period"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "reporting_period_exception" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "reporting_period_id" uuid NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "reason" text,
        "granted_by" uuid NOT NULL,
        "granted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4d9aa2700d5b97e9f033fd5d874" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_f83d19e1750042f5223219a119b" UNIQUE ("user_id", "reporting_period_id")
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "IDX_b89ec0a5cee451dff1d1167365" ON "reporting_period_exception" ("user_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_b004d9e38b7192d71352416099" ON "reporting_period_exception" ("reporting_period_id")',
    );

    await queryRunner.query(`
      ALTER TABLE "reporting_period_exception"
      ADD CONSTRAINT "FK_b89ec0a5cee451dff1d11673659"
      FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "reporting_period_exception"
      ADD CONSTRAINT "FK_b004d9e38b7192d713524160997"
      FOREIGN KEY ("reporting_period_id") REFERENCES "reporting_period"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "reporting_period_exception"
      ADD CONSTRAINT "FK_c3592e10191f9e0edb7dfe01a81"
      FOREIGN KEY ("granted_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "idp_identity" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "provider" text NOT NULL,
        "issuer" text NOT NULL,
        "subject" text NOT NULL,
        "audience" text,
        "email" citext,
        "email_verified" boolean,
        "name" text,
        "last_seen_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_719b1e0b2aa6d5f5ea20953f9d7" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      'CREATE UNIQUE INDEX "uq_idp_identity_iss_sub" ON "idp_identity" ("issuer", "subject")',
    );
    await queryRunner.query(
      'CREATE INDEX "idx_idp_identity_user_id" ON "idp_identity" ("user_id")',
    );

    await queryRunner.query(`
      ALTER TABLE "idp_identity"
      ADD CONSTRAINT "FK_e769ab427b04165eebde121a608"
      FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "role_id" uuid NOT NULL,
        "permission" character varying(100) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_84059017c90bfcb701b8fa42297" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_0167acb6e0ccfcf0c6c140cec4a" UNIQUE ("role_id", "permission")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "role_permissions"
      ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec"
      FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "user_role_assignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        "entity_id" uuid NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "created_by" character varying(120),
        "updated_by" character varying(120),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ac634a3aa59d70bf0fb7b423b47" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "IDX_e84cef29b68c56e6be58fed99c" ON "user_role_assignments" ("user_id", "end_date")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_b56ea4afad4ac0f580107f484b" ON "user_role_assignments" ("entity_id", "end_date")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_a81fcd91511447c82bd49a5596" ON "user_role_assignments" ("user_id", "role_id", "entity_id", "start_date", "end_date")',
    );

    await queryRunner.query(`
      ALTER TABLE "user_role_assignments"
      ADD CONSTRAINT "FK_03eb0e6d5ebfdb266edecb67c7a"
      FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "user_role_assignments"
      ADD CONSTRAINT "FK_daf3517bf1fd13552a06b78dc91"
      FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "user_role_assignments"
      ADD CONSTRAINT "FK_fc3a424d4af86173129a89f1d7a"
      FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "activity_type_role" (
        "activity_type_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        CONSTRAINT "PK_bda51fa96e8fd9f9882f446173a" PRIMARY KEY ("activity_type_id", "role_id")
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "IDX_a2746ff4fb85e58e27be3ff99e" ON "activity_type_role" ("activity_type_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_72961e1799328ba05a39c46785" ON "activity_type_role" ("role_id")',
    );

    await queryRunner.query(`
      ALTER TABLE "activity_type_role"
      ADD CONSTRAINT "FK_a2746ff4fb85e58e27be3ff99e9"
      FOREIGN KEY ("activity_type_id") REFERENCES "activity_type"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "activity_type_role"
      ADD CONSTRAINT "FK_72961e1799328ba05a39c46785e"
      FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "activity_type_role" DROP CONSTRAINT "FK_72961e1799328ba05a39c46785e"',
    );
    await queryRunner.query(
      'ALTER TABLE "activity_type_role" DROP CONSTRAINT "FK_a2746ff4fb85e58e27be3ff99e9"',
    );
    await queryRunner.query('DROP TABLE "activity_type_role"');

    await queryRunner.query(
      'ALTER TABLE "user_role_assignments" DROP CONSTRAINT "FK_fc3a424d4af86173129a89f1d7a"',
    );
    await queryRunner.query(
      'ALTER TABLE "user_role_assignments" DROP CONSTRAINT "FK_daf3517bf1fd13552a06b78dc91"',
    );
    await queryRunner.query(
      'ALTER TABLE "user_role_assignments" DROP CONSTRAINT "FK_03eb0e6d5ebfdb266edecb67c7a"',
    );
    await queryRunner.query('DROP TABLE "user_role_assignments"');

    await queryRunner.query(
      'ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"',
    );
    await queryRunner.query('DROP TABLE "role_permissions"');

    await queryRunner.query(
      'ALTER TABLE "idp_identity" DROP CONSTRAINT "FK_e769ab427b04165eebde121a608"',
    );
    await queryRunner.query('DROP TABLE "idp_identity"');

    await queryRunner.query(
      'ALTER TABLE "reporting_period_exception" DROP CONSTRAINT "FK_c3592e10191f9e0edb7dfe01a81"',
    );
    await queryRunner.query(
      'ALTER TABLE "reporting_period_exception" DROP CONSTRAINT "FK_b004d9e38b7192d713524160997"',
    );
    await queryRunner.query(
      'ALTER TABLE "reporting_period_exception" DROP CONSTRAINT "FK_b89ec0a5cee451dff1d11673659"',
    );
    await queryRunner.query('DROP TABLE "reporting_period_exception"');

    await queryRunner.query(
      'ALTER TABLE "activity" DROP CONSTRAINT "FK_f2a69b1e4f922146ddd3fcd61ef"',
    );
    await queryRunner.query(
      'ALTER TABLE "activity" DROP CONSTRAINT "FK_10bf0c2dd4736190070e8475119"',
    );
    await queryRunner.query(
      'ALTER TABLE "activity" DROP CONSTRAINT "FK_2f0858b012f495fa3dd60da6d25"',
    );
    await queryRunner.query('DROP TABLE "activity"');

    await queryRunner.query(
      'ALTER TABLE "reporting_period" DROP CONSTRAINT "FK_a21ad30ae2e2a148af8e03ad29f"',
    );
    await queryRunner.query('DROP TABLE "reporting_period"');

    await queryRunner.query('DROP INDEX "IDX_71e01cca515ddd99750868b6e5"');
    await queryRunner.query('DROP TABLE "activity_type"');

    await queryRunner.query('ALTER TABLE "user" DROP CONSTRAINT "FK_b54f8ea623b17094db7667d8206"');
    await queryRunner.query('ALTER TABLE "user" DROP CONSTRAINT "FK_fb2e442d14add3cefbdf33c4561"');
    await queryRunner.query('DROP TABLE "user"');

    await queryRunner.query(
      'ALTER TABLE "entities" DROP CONSTRAINT "FK_f71464f7957c883c9675f80d2e2"',
    );
    await queryRunner.query('DROP TABLE "entities"');

    await queryRunner.query('DROP TABLE "roles"');

    await queryRunner.query('DROP TYPE "public"."activity_type_growth_direction_enum"');
    await queryRunner.query('DROP TYPE "public"."reporting_period_status_enum"');
    await queryRunner.query('DROP TYPE "public"."activity_status_enum"');
    await queryRunner.query('DROP TYPE "public"."user_status_enum"');
    await queryRunner.query('DROP TYPE "public"."entities_type_enum"');

    await queryRunner.query('DROP EXTENSION IF EXISTS "citext"');
    await queryRunner.query('DROP EXTENSION IF EXISTS "uuid-ossp"');
  }
}

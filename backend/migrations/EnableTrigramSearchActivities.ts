import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableTrigramSearchActivities implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS activity_description_trgm_idx ON activity USING gin (description gin_trgm_ops)',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS activity_type_name_trgm_idx ON activity_type USING gin (name gin_trgm_ops)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS activity_description_trgm_idx');
    await queryRunner.query('DROP INDEX IF EXISTS activity_type_name_trgm_idx');
    await queryRunner.query('DROP EXTENSION IF EXISTS pg_trgm');
  }
}

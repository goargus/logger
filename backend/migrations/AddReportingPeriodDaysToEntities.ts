import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddReportingPeriodDaysToEntities1739923200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('entities');
    const reportingPeriodDaysColumn = table?.findColumnByName('reporting_period_days');

    if (!reportingPeriodDaysColumn) {
      await queryRunner.addColumn(
        'entities',
        new TableColumn({
          name: 'reporting_period_days',
          type: 'int',
          isNullable: true,
          comment:
            'Custom reporting period duration in days. If null, uses environment variable or default (14).',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('entities', 'reporting_period_days');
  }
}

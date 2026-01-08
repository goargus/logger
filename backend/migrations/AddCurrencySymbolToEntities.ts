import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCurrencySymbolToEntities1736287200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('entities');
    const currencySymbolColumn = table?.findColumnByName('currency_symbol');

    if (!currencySymbolColumn) {
      await queryRunner.addColumn(
        'entities',
        new TableColumn({
          name: 'currency_symbol',
          type: 'varchar',
          length: '10',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('entities', 'currency_symbol');
  }
}

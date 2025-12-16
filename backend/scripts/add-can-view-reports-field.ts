import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { LEADERSHIP_ROLES } from '../src/roles/role.constants';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function addCanViewReportsField() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'secretary',
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    await dataSource.query(`
      ALTER TABLE roles 
      ADD COLUMN IF NOT EXISTS can_view_reports BOOLEAN DEFAULT FALSE;
    `);
    console.log('Added can_view_reports column');

    for (const roleName of LEADERSHIP_ROLES) {
      const result = await dataSource.query(
        `UPDATE roles SET can_view_reports = TRUE WHERE name = $1`,
        [roleName],
      );
      console.log(`Updated ${roleName}: ${result[1]} rows affected`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

addCanViewReportsField()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

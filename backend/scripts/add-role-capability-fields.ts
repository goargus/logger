import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import {
  MISSIONARY_ROLES,
  EXECUTIVE_ROLES,
  SECRETARY_ROLES,
  SYSTEM_ADMIN_ROLE,
} from '../src/roles/role.constants';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function addRoleCapabilityFields() {
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

    console.log('Adding role capability columns...');
    await dataSource.query(`
      ALTER TABLE roles 
      ADD COLUMN IF NOT EXISTS can_manage_own_activities BOOLEAN DEFAULT FALSE;
    `);
    console.log('Added can_manage_own_activities column');

    await dataSource.query(`
      ALTER TABLE roles 
      ADD COLUMN IF NOT EXISTS can_manage_hierarchy_activities BOOLEAN DEFAULT FALSE;
    `);
    console.log('Added can_manage_hierarchy_activities column');

    await dataSource.query(`
      ALTER TABLE roles 
      ADD COLUMN IF NOT EXISTS can_manage_entities BOOLEAN DEFAULT FALSE;
    `);
    console.log('Added can_manage_entities column');

    await dataSource.query(`
      ALTER TABLE roles 
      ADD COLUMN IF NOT EXISTS is_system_admin BOOLEAN DEFAULT FALSE;
    `);
    console.log('Added is_system_admin column');

    console.log('Setting System Admin flag...');
    await dataSource.query(`UPDATE roles SET is_system_admin = TRUE WHERE name = $1`, [
      SYSTEM_ADMIN_ROLE,
    ]);

    console.log('Setting can_manage_own_activities for Missionary roles...');
    for (const roleName of MISSIONARY_ROLES) {
      const result = await dataSource.query(
        `UPDATE roles SET can_manage_own_activities = TRUE WHERE name = $1`,
        [roleName],
      );
      console.log(`Updated ${roleName}: ${result[1]} rows affected`);
    }

    console.log('Setting can_manage_hierarchy_activities for Secretary roles...');
    for (const roleName of SECRETARY_ROLES) {
      const result = await dataSource.query(
        `UPDATE roles SET can_manage_hierarchy_activities = TRUE WHERE name = $1`,
        [roleName],
      );
      console.log(`Updated ${roleName}: ${result[1]} rows affected`);
    }

    console.log('Setting can_manage_entities for Executive roles...');
    for (const roleName of EXECUTIVE_ROLES) {
      const result = await dataSource.query(
        `UPDATE roles SET can_manage_entities = TRUE WHERE name = $1`,
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

addRoleCapabilityFields()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

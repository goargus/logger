import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

async function migrateRoleAssignments() {
  console.log('Starting role assignment migration...');
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const dataSource = app.get(DataSource);
    const users = await dataSource.query(`
      SELECT id, role_id, entity_id
      FROM "user"
      WHERE id IS NOT NULL
    `);
    console.log(`Found ${users.length} users to process`);
    const today = new Date().toISOString().split('T')[0];
    const farFuture = '9999-12-31';
    let created = 0;
    let skipped = 0;
    for (const user of users) {
      const existing = await dataSource.query(`
        SELECT id FROM user_role_assignments
        WHERE user_id = $1 AND role_id = $2 AND entity_id = $3
      `,
        [user.id, user.role_id, user.entity_id],
      
      if (existing.length > 0) {
        console.log(`Role assignment already exists for user ${user.id}, skipping...`);
        skipped++;
        continue;
      }
      await dataSource.query(
        `
        INSERT INTO user_role_assignments (user_id, role_id, entity_id, start_date, end_date, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `,
        [user.id, user.role_id, user.entity_id, today, farFuture],
      );

      console.log(`Created role assignment for user ${user.id}`);
      created++;
    }
    const updateResult = await dataSource.query(`
      UPDATE user_role_assignments
      SET 
        start_date = COALESCE(start_date, $1),
        end_date = COALESCE(end_date, $2),
        updated_at = NOW()
      WHERE start_date IS NULL OR end_date IS NULL
    `, [today, farFuture]);
    console.log('\n=== Migration Complete ===');
    console.log(`Role assignments created: ${created}`);
    console.log(`Users skipped (already have assignment): ${skipped}`);
    console.log(`Existing assignments updated with dates: ${updateResult[1] || 0}`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  migrateRoleAssignments().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { migrateRoleAssignments };

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from '../src/roles/role.entity';

async function updateRoles() {
  console.log('Updating role permissions...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const roleRepo = app.get<Repository<Role>>(getRepositoryToken(Role));

  const leadershipRoles = [
    'Union President',
    'Association President',
    'Field Director',
    'Union Secretary',
    'Association Secretary',
    'Field Secretary',
    'System Admin',
  ];

  for (const roleName of leadershipRoles) {
    const role = await roleRepo.findOne({ where: { name: roleName } });
    if (role) {
      role.canViewReports = true;
      role.canManageHierarchyActivities = true;
      await roleRepo.save(role);
      console.log(`Updated role: ${roleName}`);
    } else {
      console.log(`Role not found: ${roleName}`);
    }
  }

  console.log('\nAll leadership roles now have can_view_reports = true');

  await app.close();
}

updateRoles()
  .then(() => {
    console.log('\nRole permissions updated successfully');
    process.exit(0);
  })
  .catch((e) => {
    console.error('\nError:', e);
    process.exit(1);
  });

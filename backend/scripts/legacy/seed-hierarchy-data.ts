/**
 * Seed script for hierarchy reports test data
 *
 * This script:
 * 1. Ensures the admin role has canViewReports enabled
 * 2. Creates users across multiple entity levels (Union, Association, Field)
 * 3. Creates reporting periods for those entities
 * 4. Creates activities for those users
 *
 * Usage: npm run db:seed-hierarchy
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/user.entity';
import { Role } from '../src/roles/role.entity';
import { Entity as OrgEntity, EntityType } from '../src/entities/entity.entity';
import { Activity } from '../src/activity/activity.entity';
import { ActivityType } from '../src/activities-type/activity-type.entity';
import { ReportingPeriod } from '../src/reporting-periods/reporting-period.entity';
import { ReportingPeriodStatus } from '../src/reporting-periods/reporting-period-status.enum';
import { UserRoleAssignment } from '../src/roles/user-role-assignment.entity';
import { UserStatus } from '../src/users/user-status.enum';
import { ActivityStatus } from '../src/activity/activity-status.enum';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

interface TestUserConfig {
  email: string;
  username: string;
  fullName: string;
  firstName: string;
  familyName: string;
  roleName: string;
  entityName: string;
  entityType: EntityType;
}

async function seedHierarchyData() {
  console.log('Starting hierarchy data seed...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const roleRepo = app.get<Repository<Role>>(getRepositoryToken(Role));
    const entityRepo = app.get<Repository<OrgEntity>>(getRepositoryToken(OrgEntity));
    const activityRepo = app.get<Repository<Activity>>(getRepositoryToken(Activity));
    const activityTypeRepo = app.get<Repository<ActivityType>>(getRepositoryToken(ActivityType));
    const periodRepo = app.get<Repository<ReportingPeriod>>(getRepositoryToken(ReportingPeriod));
    const roleAssignmentRepo = app.get<Repository<UserRoleAssignment>>(getRepositoryToken(UserRoleAssignment));

    // Step 1: Fix admin role canViewReports
    console.log('=== Step 1: Ensuring admin role has canViewReports ===');
    await fixAdminRolePermissions(roleRepo);

    // Step 2: Get existing entities
    console.log('\n=== Step 2: Loading existing entity hierarchy ===');
    const entities = await loadEntityHierarchy(entityRepo);

    if (!entities.platform || entities.unions.length === 0) {
      console.error('No entity hierarchy found. Please run npm run db:init first.');
      process.exit(1);
    }

    // Step 3: Get or create roles
    console.log('\n=== Step 3: Loading roles ===');
    const roles = await loadRoles(roleRepo);

    // Step 4: Create test users at different hierarchy levels
    console.log('\n=== Step 4: Creating test users across hierarchy ===');
    const testUsers = await createTestUsers(
      userRepo,
      roleRepo,
      entityRepo,
      roleAssignmentRepo,
      entities,
      roles
    );

    // Step 5: Get activity types
    console.log('\n=== Step 5: Loading activity types ===');
    const activityTypes = await activityTypeRepo.find();
    if (activityTypes.length === 0) {
      console.error('No activity types found. Please run npm run db:init first.');
      process.exit(1);
    }

    // Step 6: Create reporting periods for entities
    console.log('\n=== Step 6: Creating reporting periods ===');
    const periods = await createReportingPeriods(periodRepo, entities);

    // Step 7: Create activities for users
    console.log('\n=== Step 7: Creating activities across hierarchy ===');
    await createActivities(activityRepo, testUsers, activityTypes, periods);

    // Summary
    console.log('\n=== Seed Complete ===');
    console.log('You can now test the hierarchy reports feature.');
    console.log('Login as your admin user to see aggregated reports from all entities.');

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

async function fixAdminRolePermissions(roleRepo: Repository<Role>): Promise<void> {
  // Find admin role (could be 'admin' or 'System Admin')
  const adminRole = await roleRepo.findOne({
    where: [{ name: 'admin' }, { name: 'System Admin' }],
  });

  if (!adminRole) {
    console.log('No admin role found, skipping...');
    return;
  }

  if (!adminRole.canViewReports) {
    adminRole.canViewReports = true;
    adminRole.canManageOwnActivities = true;
    adminRole.canManageHierarchyActivities = true;
    adminRole.canManageEntities = true;
    adminRole.isSystemAdmin = true;
    await roleRepo.save(adminRole);
    console.log(`Updated admin role "${adminRole.name}" with full permissions`);
  } else {
    console.log(`Admin role "${adminRole.name}" already has canViewReports enabled`);
  }

  // Also update president role for testing
  const presidentRole = await roleRepo.findOne({ where: { name: 'president' } });
  if (presidentRole && !presidentRole.canViewReports) {
    presidentRole.canViewReports = true;
    presidentRole.canManageOwnActivities = true;
    await roleRepo.save(presidentRole);
    console.log('Updated president role with canViewReports');
  }

  // Update missionary and pastor roles for activity creation
  for (const roleName of ['missionary', 'pastor']) {
    const role = await roleRepo.findOne({ where: { name: roleName } });
    if (role && !role.canManageOwnActivities) {
      role.canManageOwnActivities = true;
      await roleRepo.save(role);
      console.log(`Updated ${roleName} role with canManageOwnActivities`);
    }
  }
}

interface EntityHierarchy {
  platform: OrgEntity | null;
  unions: OrgEntity[];
  associations: OrgEntity[];
  fields: OrgEntity[];
}

async function loadEntityHierarchy(entityRepo: Repository<OrgEntity>): Promise<EntityHierarchy> {
  const platform = await entityRepo.findOne({ where: { type: EntityType.PLATFORM } });
  const unions = await entityRepo.find({ where: { type: EntityType.UNION } });
  const associations = await entityRepo.find({ where: { type: EntityType.ASSOCIATION } });
  const fields = await entityRepo.find({ where: { type: EntityType.FIELD } });

  console.log(`Found: Platform=${platform?.name || 'none'}, Unions=${unions.length}, Associations=${associations.length}, Fields=${fields.length}`);

  return { platform, unions, associations, fields };
}

async function loadRoles(roleRepo: Repository<Role>): Promise<Map<string, Role>> {
  const roles = await roleRepo.find();
  const roleMap = new Map<string, Role>();

  for (const role of roles) {
    roleMap.set(role.name, role);
    console.log(`Loaded role: ${role.name} (canViewReports: ${role.canViewReports})`);
  }

  return roleMap;
}

async function createTestUsers(
  userRepo: Repository<User>,
  roleRepo: Repository<Role>,
  entityRepo: Repository<OrgEntity>,
  roleAssignmentRepo: Repository<UserRoleAssignment>,
  entities: EntityHierarchy,
  roles: Map<string, Role>,
): Promise<User[]> {
  const testUsers: User[] = [];

  // Create users for each union
  for (const union of entities.unions) {
    // Create union-level user (missionary)
    const missionaryRole = roles.get('missionary');
    if (missionaryRole) {
      const user = await ensureUser(
        userRepo,
        roleAssignmentRepo,
        {
          email: `missionary.${union.name.toLowerCase().replace(/\s+/g, '_')}@test.local`,
          username: `missionary_${union.name.toLowerCase().replace(/\s+/g, '_')}`,
          fullName: `Test Missionary ${union.name}`,
          firstName: 'Test',
          familyName: `Missionary ${union.name}`,
        },
        missionaryRole,
        union,
      );
      if (user) testUsers.push(user);
    }
  }

  // Create users for some associations
  const associationsToUse = entities.associations.slice(0, 3);
  for (const association of associationsToUse) {
    const missionaryRole = roles.get('missionary');
    if (missionaryRole) {
      const user = await ensureUser(
        userRepo,
        roleAssignmentRepo,
        {
          email: `missionary.${association.name.toLowerCase().replace(/\s+/g, '_').substring(0, 20)}@test.local`,
          username: `missionary_assoc_${association.id.substring(0, 8)}`,
          fullName: `Test Missionary ${association.name.substring(0, 30)}`,
          firstName: 'Test',
          familyName: `Assoc Missionary`,
        },
        missionaryRole,
        association,
      );
      if (user) testUsers.push(user);
    }
  }

  // Create users for some fields
  const fieldsToUse = entities.fields.slice(0, 4);
  for (const field of fieldsToUse) {
    const pastorRole = roles.get('pastor');
    if (pastorRole) {
      const user = await ensureUser(
        userRepo,
        roleAssignmentRepo,
        {
          email: `pastor.${field.name.toLowerCase().replace(/\s+/g, '_').substring(0, 20)}@test.local`,
          username: `pastor_field_${field.id.substring(0, 8)}`,
          fullName: `Test Pastor ${field.name.substring(0, 30)}`,
          firstName: 'Test',
          familyName: `Field Pastor`,
        },
        pastorRole,
        field,
      );
      if (user) testUsers.push(user);
    }
  }

  console.log(`Created/verified ${testUsers.length} test users`);
  return testUsers;
}

async function ensureUser(
  userRepo: Repository<User>,
  roleAssignmentRepo: Repository<UserRoleAssignment>,
  config: { email: string; username: string; fullName: string; firstName: string; familyName: string },
  role: Role,
  entity: OrgEntity,
): Promise<User | null> {
  let user = await userRepo.findOne({ where: { email: config.email } });

  if (!user) {
    user = userRepo.create({
      username: config.username,
      email: config.email,
      status: UserStatus.ACTIVE,
      full_name: config.fullName,
      first_name: config.firstName,
      family_name: config.familyName,
      role_id: role.id,
      entity_id: entity.id,
    });
    user = await userRepo.save(user);
    console.log(`Created user: ${config.fullName} at ${entity.name}`);

    // Create role assignment
    const today = new Date().toISOString().split('T')[0];
    const roleAssignment = roleAssignmentRepo.create({
      user: user,
      role: role,
      entity: entity,
      start_date: today,
      end_date: '9999-12-31',
    });
    await roleAssignmentRepo.save(roleAssignment);
  } else {
    console.log(`User ${config.email} already exists`);
  }

  return user;
}

async function createReportingPeriods(
  periodRepo: Repository<ReportingPeriod>,
  entities: EntityHierarchy,
): Promise<Map<string, ReportingPeriod>> {
  const periods = new Map<string, ReportingPeriod>();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Create periods for current month
  const periodStart = new Date(currentYear, currentMonth, 1);
  const periodEnd = new Date(currentYear, currentMonth + 1, 0);
  const startStr = periodStart.toISOString().split('T')[0];
  const endStr = periodEnd.toISOString().split('T')[0];
  const periodName = `${periodStart.toLocaleString('es', { month: 'long' })} ${currentYear}`;

  // Create period for each entity type
  const allEntities = [
    ...(entities.platform ? [entities.platform] : []),
    ...entities.unions,
    ...entities.associations,
    ...entities.fields,
  ];

  for (const entity of allEntities) {
    let period = await periodRepo.findOne({
      where: { entityId: entity.id, status: ReportingPeriodStatus.ACTIVE },
    });

    if (!period) {
      // Check for any existing period for this entity in the current month
      period = await periodRepo.findOne({
        where: { entityId: entity.id, startDate: startStr },
      });

      if (!period) {
        period = periodRepo.create({
          entityId: entity.id,
          name: periodName,
          description: `Período de reporte para ${entity.name}`,
          startDate: startStr,
          endDate: endStr,
          status: ReportingPeriodStatus.ACTIVE,
          createdBy: SYSTEM_USER_ID,
          updatedBy: SYSTEM_USER_ID,
        });
        period = await periodRepo.save(period);
        console.log(`Created reporting period for ${entity.name}`);
      }
    }

    periods.set(entity.id, period);
  }

  console.log(`Created/verified ${periods.size} reporting periods`);
  return periods;
}

async function createActivities(
  activityRepo: Repository<Activity>,
  users: User[],
  activityTypes: ActivityType[],
  periods: Map<string, ReportingPeriod>,
): Promise<void> {
  const now = new Date();
  let activitiesCreated = 0;

  for (const user of users) {
    const period = periods.get(user.entity_id);
    if (!period) {
      console.log(`No period found for user ${user.email}'s entity, skipping...`);
      continue;
    }

    // Get activity types available to this user's role
    const userActivityTypes = activityTypes.filter(
      (at) => !at.allowed_roles || at.allowed_roles.length === 0 ||
              at.allowed_roles.some((r) => r.id === user.role_id)
    );

    if (userActivityTypes.length === 0) {
      // Use any activity type if none are specifically allowed
      userActivityTypes.push(activityTypes[0]);
    }

    // Create 2-5 activities per user
    const numActivities = Math.floor(Math.random() * 4) + 2;

    for (let i = 0; i < numActivities; i++) {
      const activityType = userActivityTypes[Math.floor(Math.random() * userActivityTypes.length)];
      const dayOffset = Math.floor(Math.random() * 14); // Random day in the period
      const activityDate = new Date(now.getFullYear(), now.getMonth(), dayOffset + 1);
      const hasExpense = Math.random() > 0.5;
      const expenseAmount = hasExpense ? (Math.floor(Math.random() * 500) + 50).toFixed(2) : null;

      const activity = activityRepo.create({
        activityTypeId: activityType.id,
        activityDate: activityDate.toISOString().split('T')[0],
        description: `Actividad de prueba ${i + 1} para ${user.full_name}`,
        hasExpense,
        expenseAmount,
        userId: user.id,
        reportingPeriodId: period.id,
        status: ActivityStatus.ACTIVE,
        createdBy: user.id,
        updatedBy: user.id,
      });

      await activityRepo.save(activity);
      activitiesCreated++;
    }

    console.log(`Created ${numActivities} activities for ${user.full_name}`);
  }

  console.log(`Total activities created: ${activitiesCreated}`);
}

// Run the seed
seedHierarchyData()
  .then(() => {
    console.log('\nSeed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  });

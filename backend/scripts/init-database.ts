import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/user.entity';
import { Role } from '../src/roles/role.entity';
import { Entity as OrgEntity, EntityType } from '../src/entities/entity.entity';
import { IdpIdentitiesService } from '../src/idp-identities/idp-identities.service';
import { UserStatus } from '../src/users/user-status.enum';

interface StaffConfig {
  email: string;
  username: string;
  fullName: string;
  firstName: string;
  familyName: string;
  idpIssuer: string;
  idpSubject: string;
  roleName: string;
  entityName: string;
  entityType: EntityType;
}

interface DatabaseInitConfig {
  adminEmail: string;
  adminUsername: string;
  adminFullName: string;
  adminIdpIssuer: string;
  adminIdpSubject: string;
  staffMembers: StaffConfig[];
}

async function getDatabaseInitConfig(): Promise<DatabaseInitConfig> {
  const config = {
    adminEmail: process.env.ADMIN_EMAIL,
    adminUsername: process.env.ADMIN_USERNAME,
    adminFullName: process.env.ADMIN_FULL_NAME || 'System Administrator',
    adminIdpIssuer: process.env.ADMIN_IDP_ISSUER,
    adminIdpSubject: process.env.ADMIN_IDP_SUBJECT,
    staffMembers: [
      {
        email: 'president.mexicana@church.org',
        username: 'president_mexicana',
        fullName: 'Carlos Rodriguez',
        firstName: 'Carlos',
        familyName: 'Rodriguez',
        idpIssuer: process.env.ADMIN_IDP_ISSUER,
        idpSubject: 'auth0|president_mexicana',
        roleName: 'president',
        entityName: 'Union Mexicana',
        entityType: EntityType.UNION,
      },
      {
        email: 'president.brasilena@church.org',
        username: 'president_brasilena',
        fullName: 'Ana Silva',
        firstName: 'Ana',
        familyName: 'Silva',
        idpIssuer: process.env.ADMIN_IDP_ISSUER,
        idpSubject: 'auth0|president_brasilena',
        roleName: 'president',
        entityName: 'Union Brasileña',
        entityType: EntityType.UNION,
      },
      {
        email: 'missionary.mexicana@church.org',
        username: 'missionary_mexicana',
        fullName: 'Miguel Hernandez',
        firstName: 'Miguel',
        familyName: 'Hernandez',
        idpIssuer: process.env.ADMIN_IDP_ISSUER,
        idpSubject: 'auth0|missionary_mexicana',
        roleName: 'missionary',
        entityName: 'Union Mexicana',
        entityType: EntityType.UNION,
      },
      {
        email: 'missionary.brasilena@church.org',
        username: 'missionary_brasilena',
        fullName: 'Paulo Santos',
        firstName: 'Paulo',
        familyName: 'Santos',
        idpIssuer: process.env.ADMIN_IDP_ISSUER,
        idpSubject: 'auth0|missionary_brasilena',
        roleName: 'missionary',
        entityName: 'Union Brasileña',
        entityType: EntityType.UNION,
      },
    ],
  };

  if (
    !config.adminEmail ||
    !config.adminUsername ||
    !config.adminIdpIssuer ||
    !config.adminIdpSubject
  ) {
    console.error('Missing required environment variables:');
    console.error('- ADMIN_EMAIL');
    console.error('- ADMIN_USERNAME');
    console.error('- ADMIN_IDP_ISSUER');
    console.error('- ADMIN_IDP_SUBJECT');
    console.error('\nOptional variables:');
    console.error('- ADMIN_FULL_NAME (default: System Administrator)');
    process.exit(1);
  }

  return config as DatabaseInitConfig;
}

async function ensurePlatform(entityRepo: Repository<OrgEntity>): Promise<OrgEntity> {
  let platform = await entityRepo.findOne({ where: { type: EntityType.PLATFORM } });
  if (!platform) {
    console.log('Creating platform entity...');
    platform = entityRepo.create({
      name: 'Seventh-day Adventist Church',
      type: EntityType.PLATFORM,
      code: 'SDA',
      description: 'Global Seventh-day Adventist Church Platform',
      location: 'Worldwide',
      is_active: true,
    });
    platform = await entityRepo.save(platform);
    console.log('Platform created');
  }
  return platform;
}

async function ensureUnions(
  entityRepo: Repository<OrgEntity>,
  platform: OrgEntity,
): Promise<OrgEntity[]> {
  const unionNames = ['Union Mexicana', 'Union Brasileña'];
  const unions: OrgEntity[] = [];

  for (const unionName of unionNames) {
    let union = await entityRepo.findOne({
      where: { name: unionName, type: EntityType.UNION },
    });

    if (!union) {
      console.log(`Creating ${unionName}...`);
      union = entityRepo.create({
        name: unionName,
        type: EntityType.UNION,
        code: unionName
          .split(' ')
          .map((word) => word[0])
          .join(''),
        description: `${unionName} of the Seventh-day Adventist Church`,
        location: unionName.includes('Mexicana') ? 'Mexico' : 'Brazil',
        is_active: true,
        parent_id: platform.id,
      });
      union = await entityRepo.save(union);
      console.log(`${unionName} created`);
    }
    unions.push(union);
  }

  return unions;
}

async function ensureAssociations(
  entityRepo: Repository<OrgEntity>,
  unions: OrgEntity[],
): Promise<OrgEntity[]> {
  const associationData = [
    { name: 'North Association', union: 'Union Mexicana', location: 'Northern Mexico' },
    { name: 'Central Association', union: 'Union Mexicana', location: 'Central Mexico' },
    { name: 'South Association', union: 'Union Mexicana', location: 'Southern Mexico' },
    { name: 'North Association', union: 'Union Brasileña', location: 'Northern Brazil' },
    { name: 'Central Association', union: 'Union Brasileña', location: 'Central Brazil' },
    { name: 'South Association', union: 'Union Brasileña', location: 'Southern Brazil' },
  ];

  const associations: OrgEntity[] = [];

  for (const assocData of associationData) {
    const parentUnion = unions.find((u) => u.name === assocData.union);
    if (!parentUnion) continue;

    const uniqueName = `${assocData.name} - ${assocData.union}`;
    let association = await entityRepo.findOne({
      where: { name: uniqueName, type: EntityType.ASSOCIATION },
    });

    if (!association) {
      console.log(`Creating ${uniqueName}...`);
      association = entityRepo.create({
        name: uniqueName,
        type: EntityType.ASSOCIATION,
        code: assocData.name
          .split(' ')
          .map((word) => word[0])
          .join(''),
        description: `${assocData.name} under ${assocData.union}`,
        location: assocData.location,
        is_active: true,
        parent_id: parentUnion.id,
      });
      association = await entityRepo.save(association);
      console.log(`${uniqueName} created`);
    }
    associations.push(association);
  }

  return associations;
}

async function ensureFields(
  entityRepo: Repository<OrgEntity>,
  associations: OrgEntity[],
): Promise<OrgEntity[]> {
  const fieldData = [
    {
      name: 'Mexico City Field',
      association: 'North Association - Union Mexicana',
      location: 'Mexico City',
    },
    {
      name: 'Guadalajara Field',
      association: 'Central Association - Union Mexicana',
      location: 'Guadalajara',
    },
    { name: 'Cancun Field', association: 'South Association - Union Mexicana', location: 'Cancun' },
    {
      name: 'São Paulo Field',
      association: 'North Association - Union Brasileña',
      location: 'São Paulo',
    },
    {
      name: 'Rio de Janeiro Field',
      association: 'Central Association - Union Brasileña',
      location: 'Rio de Janeiro',
    },
    {
      name: 'Brasília Field',
      association: 'South Association - Union Brasileña',
      location: 'Brasília',
    },
  ];

  const fields: OrgEntity[] = [];

  for (const fieldDataItem of fieldData) {
    const parentAssociation = associations.find((a) => a.name === fieldDataItem.association);
    if (!parentAssociation) continue;

    let field = await entityRepo.findOne({
      where: { name: fieldDataItem.name, type: EntityType.FIELD },
    });

    if (!field) {
      console.log(`Creating ${fieldDataItem.name}...`);
      field = entityRepo.create({
        name: fieldDataItem.name,
        type: EntityType.FIELD,
        code: fieldDataItem.name
          .split(' ')
          .map((word) => word[0])
          .join(''),
        description: `${fieldDataItem.name} under ${fieldDataItem.association}`,
        location: fieldDataItem.location,
        is_active: true,
        parent_id: parentAssociation.id,
      });
      field = await entityRepo.save(field);
      console.log(`${fieldDataItem.name} created`);
    }
    fields.push(field);
  }

  return fields;
}

async function ensureRoles(roleRepo: Repository<Role>): Promise<Map<string, Role>> {
  const roleData = [
    { name: 'admin', description: 'System Administrator with full access' },
    { name: 'president', description: 'President with administrative privileges' },
    { name: 'missionary', description: 'Missionary with evangelistic and outreach privileges' },
  ];

  const roleMap = new Map<string, Role>();

  for (const roleInfo of roleData) {
    let role = await roleRepo.findOne({ where: { name: roleInfo.name } });
    if (!role) {
      console.log(`Creating ${roleInfo.name} role...`);
      role = roleRepo.create({
        name: roleInfo.name,
        description: roleInfo.description,
      });
      role = await roleRepo.save(role);
      console.log(`${roleInfo.name} role created`);
    }
    roleMap.set(roleInfo.name, role);
  }

  return roleMap;
}

async function createUser(
  userRepo: Repository<User>,
  idpService: IdpIdentitiesService,
  staffConfig: StaffConfig,
  roleMap: Map<string, Role>,
  entityRepo: Repository<OrgEntity>,
): Promise<void> {
  const existingUser = await userRepo.findOne({ where: { email: staffConfig.email } });
  if (existingUser) {
    console.log(`User ${staffConfig.email} already exists, skipping...`);
    return;
  }

  const role = roleMap.get(staffConfig.roleName);
  if (!role) {
    console.error(`Role ${staffConfig.roleName} not found`);
    return;
  }

  const entity = await entityRepo.findOne({
    where: { name: staffConfig.entityName, type: staffConfig.entityType },
  });
  if (!entity) {
    console.error(`Entity ${staffConfig.entityName} of type ${staffConfig.entityType} not found`);
    return;
  }

  console.log(`Creating user ${staffConfig.fullName}...`);
  const user = userRepo.create({
    username: staffConfig.username,
    email: staffConfig.email,
    status: UserStatus.ACTIVE,
    full_name: staffConfig.fullName,
    first_name: staffConfig.firstName,
    family_name: staffConfig.familyName,
    role_id: role.id,
    entity_id: entity.id,
  });

  const savedUser = await userRepo.save(user);
  console.log(`User ${staffConfig.fullName} created with ID: ${savedUser.id}`);

  await idpService.create({
    user_id: savedUser.id,
    provider: 'auth0',
    issuer: staffConfig.idpIssuer,
    subject: staffConfig.idpSubject,
    audience: null,
    email: staffConfig.email,
    email_verified: true,
    name: staffConfig.fullName,
    last_seen_at: new Date(),
  });

  console.log(`IdP identity created for ${staffConfig.fullName}`);
}

async function createAdminUser(
  userRepo: Repository<User>,
  idpService: IdpIdentitiesService,
  config: DatabaseInitConfig,
  roleMap: Map<string, Role>,
  platform: OrgEntity,
): Promise<void> {
  const existingUser = await userRepo.findOne({ where: { email: config.adminEmail } });
  if (existingUser) {
    console.log(`Admin user ${config.adminEmail} already exists, skipping...`);
    return;
  }

  const adminRole = roleMap.get('admin');
  if (!adminRole) {
    console.error('Admin role not found');
    return;
  }

  console.log('Creating admin user...');
  const adminUser = userRepo.create({
    username: config.adminUsername,
    email: config.adminEmail,
    status: UserStatus.ACTIVE,
    full_name: config.adminFullName,
    role_id: adminRole.id,
    entity_id: platform.id,
  });

  const savedUser = await userRepo.save(adminUser);
  console.log(`Admin user created with ID: ${savedUser.id}`);
  await idpService.create({
    user_id: savedUser.id,
    provider: 'auth0',
    issuer: config.adminIdpIssuer,
    subject: config.adminIdpSubject,
    audience: null,
    email: config.adminEmail,
    email_verified: true,
    name: config.adminFullName,
    last_seen_at: new Date(),
  });

  console.log('Admin IdP identity created');
}

async function initializeDatabase() {
  console.log('Starting comprehensive database initialization...');

  const config = await getDatabaseInitConfig();
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const roleRepo = app.get<Repository<Role>>(getRepositoryToken(Role));
    const entityRepo = app.get<Repository<OrgEntity>>(getRepositoryToken(OrgEntity));
    const idpService = app.get<IdpIdentitiesService>(IdpIdentitiesService);

    console.log('\n=== Creating Organizational Hierarchy ===');
    const platform = await ensurePlatform(entityRepo);
    const unions = await ensureUnions(entityRepo, platform);
    const associations = await ensureAssociations(entityRepo, unions);
    const fields = await ensureFields(entityRepo, associations);

    console.log('\n=== Creating Roles ===');
    const roleMap = await ensureRoles(roleRepo);

    console.log('\n=== Creating Admin User ===');
    await createAdminUser(userRepo, idpService, config, roleMap, platform);

    console.log('\n=== Creating Staff Users ===');
    for (const staffConfig of config.staffMembers) {
      await createUser(userRepo, idpService, staffConfig, roleMap, entityRepo);
    }

    console.log('\n=== Database Initialization Complete ===');
    console.log(`Platform: ${platform.name}`);
    console.log(`Unions: ${unions.length}`);
    console.log(`Associations: ${associations.length}`);
    console.log(`Fields: ${fields.length}`);
    console.log(`Roles: ${roleMap.size}`);
    console.log(`Total Users: ${config.staffMembers.length + 1} (including admin)`);
    console.log('\nOrganizational Structure:');
    console.log('Platform (Seventh-day Adventist Church)');
    unions.forEach((union) => {
      console.log(`  └── ${union.name}`);
      const unionAssociations = associations.filter((a) => a.parent_id === union.id);
      unionAssociations.forEach((association) => {
        console.log(`      └── ${association.name}`);
        const associationFields = fields.filter((f) => f.parent_id === association.id);
        associationFields.forEach((field) => {
          console.log(`          └── ${field.name}`);
        });
      });
    });

    console.log('\nUsers Created:');
    console.log('Presidents:');
    console.log('  - Carlos Rodriguez (Union Mexicana)');
    console.log('  - Ana Silva (Union Brasileña)');
    console.log('Missionaries:');
    console.log('  - Miguel Hernandez (Union Mexicana)');
    console.log('  - Paulo Santos (Union Brasileña)');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  initializeDatabase().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { initializeDatabase };

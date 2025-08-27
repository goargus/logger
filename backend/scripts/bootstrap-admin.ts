#!/usr/bin/env ts-node
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/user.entity';
import { Role } from '../src/roles/role.entity';
import { Entity as OrgEntity, EntityType } from '../src/entities/entity.entity';
import { IdpIdentitiesService } from '../src/idp-identities/idp-identities.service';
import { UserStatus } from '../src/users/user-status.enum';

interface AdminConfig {
  email: string;
  username: string;
  fullName?: string;
  idpIssuer: string;
  idpSubject: string;
  idpProvider?: string;
  roleId?: string;
  entityId?: string;
}

async function getAdminConfig(): Promise<AdminConfig> {
  const config = {
    email: process.env.ADMIN_EMAIL,
    username: process.env.ADMIN_USERNAME,
    fullName: process.env.ADMIN_FULL_NAME || undefined,
    idpIssuer: process.env.ADMIN_IDP_ISSUER,
    idpSubject: process.env.ADMIN_IDP_SUBJECT,
    idpProvider: process.env.ADMIN_IDP_PROVIDER || 'auth0',
    roleId: process.env.ADMIN_ROLE_ID || undefined,
    entityId: process.env.ADMIN_ENTITY_ID || undefined,
  };

  if (!config.email || !config.username || !config.idpIssuer || !config.idpSubject) {
    console.error('Missing required environment variables:');
    console.error('- ADMIN_EMAIL');
    console.error('- ADMIN_USERNAME');
    console.error('- ADMIN_IDP_ISSUER');
    console.error('- ADMIN_IDP_SUBJECT');
    console.error('\nOptional variables:');
    console.error('- ADMIN_FULL_NAME');
    console.error('- ADMIN_IDP_PROVIDER (default: auth0)');
    console.error('- ADMIN_ROLE_ID (will create admin role if not specified)');
    console.error('- ADMIN_ENTITY_ID (will create default union if not specified)');
    process.exit(1);
  }

  return config as AdminConfig;
}

async function ensureAdminRole(roleRepo: Repository<Role>, roleId?: string): Promise<Role> {
  if (roleId) {
    const role = await roleRepo.findOne({ where: { id: roleId } });
    if (!role) {
      console.error(`Role with ID ${roleId} not found`);
      process.exit(1);
    }
    return role;
  }

  let role = await roleRepo.findOne({ where: { name: 'admin' } });
  if (!role) {
    console.log('Creating default admin role...');
    role = roleRepo.create({
      name: 'admin',
      description: 'System Administrator',
    });
    role = await roleRepo.save(role);
    console.log('Admin role created');
  }
  
  return role;
}

async function ensureDefaultUnion(entityRepo: Repository<OrgEntity>, entityId?: string): Promise<OrgEntity> {
  if (entityId) {
    const entity = await entityRepo.findOne({ where: { id: entityId } });
    if (!entity) {
      console.error(`Entity with ID ${entityId} not found`);
      process.exit(1);
    }
    return entity;
  }

  let entity = await entityRepo.findOne({ where: { name: 'Default Union', type: EntityType.UNION } });
  if (!entity) {
    console.log('Creating default union for admin user...');
    entity = entityRepo.create({
      name: 'Default Union',
      type: EntityType.UNION,
      description: 'Default union for administrative users',
    });
    entity = await entityRepo.save(entity);
    console.log('Default union created');
  }
  
  return entity;
}

async function bootstrapAdmin() {
  console.log('Starting admin bootstrap process...');
  
  const config = await getAdminConfig();
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const roleRepo = app.get<Repository<Role>>(getRepositoryToken(Role));
    const entityRepo = app.get<Repository<OrgEntity>>(getRepositoryToken(OrgEntity));
    const idpService = app.get<IdpIdentitiesService>(IdpIdentitiesService);

    const existingUser = await userRepo.findOne({ 
      where: { email: config.email } 
    });
    
    const existingIdp = await idpService.findByIssuerAndSubject(
      config.idpIssuer, 
      config.idpSubject
    );

    if (existingUser) {
      console.log(`User with email ${config.email} already exists.`);
      if (existingIdp) {
        console.log('IdP identity is already linked.');
        console.log('Bootstrap completed - no changes needed.');
      } else {
        console.log('Linking existing user to IdP identity...');
        await idpService.create({
          user_id: existingUser.id,
          provider: config.idpProvider,
          issuer: config.idpIssuer,
          subject: config.idpSubject,
          audience: null,
          email: config.email,
          email_verified: true,
          name: config.fullName || null,
          last_seen_at: new Date(),
        });
        console.log('IdP identity linked successfully.');
      }
      return;
    }

    if (existingIdp) {
      console.error('ERROR: IdP identity already exists but linked to different user.');
      console.error('Cannot proceed with bootstrap.');
      process.exit(1);
    }

    const role = await ensureAdminRole(roleRepo, config.roleId);
    const entity = await ensureDefaultUnion(entityRepo, config.entityId);

    console.log('Creating admin user...');
    const adminUser = userRepo.create({
      username: config.username,
      email: config.email,
      status: UserStatus.ACTIVE,
      full_name: config.fullName || null,
      role_id: role.id,
      entity_id: entity.id,
    });

    const savedUser = await userRepo.save(adminUser);
    console.log(`Admin user created with ID: ${savedUser.id}`);

    console.log('Creating IdP identity...');
    await idpService.create({
      user_id: savedUser.id,
      provider: config.idpProvider,
      issuer: config.idpIssuer,
      subject: config.idpSubject,
      audience: null,
      email: config.email,
      email_verified: true,
      name: config.fullName || null,
      last_seen_at: new Date(),
    });

    console.log('IdP identity created and linked.');
    console.log('Admin bootstrap completed successfully.');
    console.log(`Admin email: ${config.email}`);
    console.log(`Admin username: ${config.username}`);
    console.log(`Entity: ${entity.name}`);
    console.log(`Role: ${role.name}`);

  } catch (error) {
    console.error('Bootstrap failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  bootstrapAdmin().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { bootstrapAdmin };
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/user.entity';
import { UserStatus } from '../src/users/user-status.enum';
import { IdpIdentity } from '../src/idp-identities/idp-identity.entity';
import { Role } from '../src/roles/role.entity';
import { Entity } from '../src/entities/entity.entity';
import { UserRoleAssignment } from '../src/roles/user-role-assignment.entity';

const ISSUER = 'https://dev-ohuspam6fnmh4tgt.us.auth0.com/';

const USERS = [
  {
    email: 'daniel.contreras@uhn.test',
    full_name: 'Daniel Contreras',
    sub: 'auth0|69583d736ccfb90819e2300c',
    roles: ['Presidente de Unión'],
    entity: 'Unión Hondureña',
  },
  {
    email: 'admin.central@uhn.test',
    full_name: 'Admin Asociación Central',
    sub: 'auth0|69583e476d2265af6faf2db8',
    roles: ['Presidente de Asociación'],
    entity: 'Asociación Central',
  },
  {
    email: 'admin.noroccidental@uhn.test',
    full_name: 'Admin Asociación Nor-occidental',
    sub: 'auth0|69583e5e6ccfb90819e23085',
    roles: ['Presidente de Asociación'],
    entity: 'Asociación Nor-occidental',
  },
  {
    email: 'admin.nororiental@uhn.test',
    full_name: 'Admin Asociación Nor-oriental',
    sub: 'auth0|69583e8889bb367a376574dd',
    roles: ['Presidente de Asociación'],
    entity: 'Asociación Nor-oriental',
  },
  {
    email: 'obrero.copan@uhn.test',
    full_name: 'Obrero Campo Copán',
    sub: 'auth0|69583ec26d2265af6faf2deb',
    roles: ['Misionero', 'Anciano'],
    entity: 'Campo Copán',
  },
  {
    email: 'obrero.tegucigalpa@uhn.test',
    full_name: 'Obrero Campo Tegucigalpa',
    sub: 'auth0|69583ed7292a80e2ca479bda',
    roles: ['Misionero', 'Director de Jóvenes'],
    entity: 'Campo Tegucigalpa',
  },
  {
    email: 'obrero.sps@uhn.test',
    full_name: 'Obrero Campo San Pedro Sula',
    sub: 'auth0|69583eec89bb367a37657519',
    roles: ['Misionero', 'Director de Obra Misionera'],
    entity: 'Campo San Pedro Sula',
  },
];

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const userRepo = dataSource.getRepository(User);
  const idpRepo = dataSource.getRepository(IdpIdentity);
  const roleRepo = dataSource.getRepository(Role);
  const entityRepo = dataSource.getRepository(Entity);
  const assignmentRepo = dataSource.getRepository(UserRoleAssignment);

  for (const u of USERS) {
    const entity = await entityRepo.findOne({ where: { name: u.entity } });
    if (!entity) throw new Error(`Entidad no encontrada: ${u.entity}`);

    // Get all roles for this user
    const userRoles: Role[] = [];
    for (const roleName of u.roles) {
      const role = await roleRepo.findOne({ where: { name: roleName } });
      if (!role) throw new Error(`Rol no encontrado: ${roleName}`);
      userRoles.push(role);
    }

    // Use first role as primary
    const primaryRole = userRoles[0];

    let user = await userRepo.findOneBy({ email: u.email });

    if (!user) {
      user = new User();

      user.email = u.email;
      user.username = u.email;
      user.full_name = u.full_name;
      user.status = UserStatus.ACTIVE;
      user.role = primaryRole;
      user.entity = entity;

      await userRepo.save(user);
    } else {
      // Update existing user's primary role and entity
      user.role = primaryRole;
      user.entity = entity;
      await userRepo.save(user);
    }

    let idp = await idpRepo.findOne({
      where: { issuer: ISSUER, subject: u.sub },
    });

    if (!idp) {
      idp = idpRepo.create({
        issuer: ISSUER,
        subject: u.sub,
        provider: 'auth0',
        email: u.email,
        email_verified: true,
        user: user,
      });
      await idpRepo.save(idp);
    }

    // Create assignments for all roles
    for (const role of userRoles) {
      const existingAssignment = await assignmentRepo.findOne({
        where: {
          user: { id: user.id },
          role: { id: role.id },
          entity: { id: entity.id },
        },
        relations: ['user', 'role', 'entity'],
      });

      if (!existingAssignment) {
        const startDate = new Date().toISOString().split('T')[0];
        // Calculate end date based on entity's term length (default 5 years)
        const endYear = new Date().getFullYear() + (entity.term_length_years || 5);
        const endDate = `${endYear}-12-31`;
        
        const assignment = assignmentRepo.create({
          user,
          role,
          entity,
          start_date: startDate,
          end_date: endDate,
          created_by: user.id,
          updated_by: user.id,
        });
        await assignmentRepo.save(assignment);
        console.log(`  ✓ Asignado rol: ${role.name}`);
      }
    }

    console.log(`Usuario listo: ${u.email} (${u.roles.length} roles)`);
  }

  console.log('🎉 Seed de usuarios Honduras COMPLETADO');
  await app.close();
}

run().catch((err) => {
  console.error('Error en seed de usuarios:', err);
  process.exit(1);
});

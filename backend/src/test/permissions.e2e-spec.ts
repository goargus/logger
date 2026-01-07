import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Role } from '../roles/role.entity';
import { RolePermission } from '../roles/role-permission.entity';
import { UserRoleAssignment } from '../roles/user-role-assignment.entity';
import { User } from '../users/user.entity';
import { Entity as OrgEntity } from '../entities/entity.entity';
import { Permission } from '../auth/permissions/permission.enum';
import { PermissionsService } from '../auth/permissions/permissions.service';
import { CaslAbilityFactory, UserWithRoles } from '../casl/casl-ability.factory';
import { Action } from '../casl/types';
import { Activity } from '../activity/activity.entity';
import * as request from 'supertest';

describe('Permissions System (e2e)', () => {
  describe('Phase 1.1: Permission Enum', () => {
    it('should have Permission enum with activity permissions', () => {
      expect(Permission.ACTIVITY_CREATE_OWN).toBe('activity:create:own');
      expect(Permission.ACTIVITY_READ_OWN).toBe('activity:read:own');
      expect(Permission.ACTIVITY_UPDATE_OWN).toBe('activity:update:own');
      expect(Permission.ACTIVITY_DELETE_OWN).toBe('activity:delete:own');
      expect(Permission.ACTIVITY_READ_HIERARCHY).toBe('activity:read:hierarchy');
      expect(Permission.ACTIVITY_MANAGE_HIERARCHY).toBe('activity:manage:hierarchy');
    });

    it('should have Permission enum with report permissions', () => {
      expect(Permission.REPORT_VIEW_HIERARCHY).toBe('report:view:hierarchy');
    });

    it('should have Permission enum with entity permissions', () => {
      expect(Permission.ENTITY_READ).toBe('entity:read');
      expect(Permission.ENTITY_READ_HIERARCHY).toBe('entity:read:hierarchy');
      expect(Permission.ENTITY_UPDATE_OWN).toBe('entity:update:own');
    });

    it('should have Permission enum with user permissions', () => {
      expect(Permission.USER_READ_OWN).toBe('user:read:own');
      expect(Permission.USER_READ_HIERARCHY).toBe('user:read:hierarchy');
      expect(Permission.USER_UPDATE_HIERARCHY).toBe('user:update:hierarchy');
    });

    it('should have Permission enum with role permissions', () => {
      expect(Permission.ROLE_READ).toBe('role:read');
    });

    it('should have Permission enum with activity-type permissions', () => {
      expect(Permission.ACTIVITY_TYPE_READ).toBe('activity-type:read');
    });

    it('should have Permission enum with reporting-period permissions', () => {
      expect(Permission.REPORTING_PERIOD_READ).toBe('reporting-period:read');
      expect(Permission.REPORTING_PERIOD_READ_HIERARCHY).toBe('reporting-period:read:hierarchy');
    });

    it('should have Permission enum with system admin permission', () => {
      expect(Permission.SYSTEM_ADMIN).toBe('system:admin');
    });
  });

  describe('Phase 1.2: RolePermission Entity', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let roleRepo: Repository<Role>;
    let rolePermissionRepo: Repository<RolePermission>;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();

      dataSource = moduleFixture.get(DataSource);
      roleRepo = moduleFixture.get(getRepositoryToken(Role));
      rolePermissionRepo = moduleFixture.get(getRepositoryToken(RolePermission));
    });

    afterAll(async () => {
      await app.close();
    });

    it('should create role with permissions via RolePermission entity', async () => {
      // Create a test role
      const role = await roleRepo.save({
        name: `Test Role ${Date.now()}`,
        description: 'A test role for e2e testing',
      });

      // Create a role permission
      await rolePermissionRepo.save({
        role,
        permission: Permission.ACTIVITY_CREATE_OWN,
      });

      // Fetch the role with permissions
      const found = await roleRepo.findOne({
        where: { id: role.id },
        relations: ['rolePermissions'],
      });

      expect(found).toBeDefined();
      expect(found!.rolePermissions).toHaveLength(1);
      expect(found!.rolePermissions[0].permission).toBe(Permission.ACTIVITY_CREATE_OWN);

      // Clean up
      await rolePermissionRepo.delete({ role: { id: role.id } });
      await roleRepo.delete(role.id);
    });

    it('should support multiple permissions per role', async () => {
      const role = await roleRepo.save({
        name: `Multi-Perm Role ${Date.now()}`,
      });

      await rolePermissionRepo.save([
        { role, permission: Permission.ACTIVITY_CREATE_OWN },
        { role, permission: Permission.ACTIVITY_READ_OWN },
        { role, permission: Permission.ENTITY_READ },
      ]);

      const found = await roleRepo.findOne({
        where: { id: role.id },
        relations: ['rolePermissions'],
      });

      expect(found!.rolePermissions).toHaveLength(3);
      expect(found!.permissions).toContain(Permission.ACTIVITY_CREATE_OWN);
      expect(found!.permissions).toContain(Permission.ACTIVITY_READ_OWN);
      expect(found!.permissions).toContain(Permission.ENTITY_READ);

      // Clean up
      await rolePermissionRepo.delete({ role: { id: role.id } });
      await roleRepo.delete(role.id);
    });

    it('should cascade delete permissions when role is deleted', async () => {
      const role = await roleRepo.save({
        name: `Cascade Test Role ${Date.now()}`,
      });

      const rp = await rolePermissionRepo.save({
        role,
        permission: Permission.SYSTEM_ADMIN,
      });

      // Delete the role
      await roleRepo.delete(role.id);

      // Verify permission was cascade deleted
      const orphanedPermission = await rolePermissionRepo.findOne({
        where: { id: rp.id },
      });

      expect(orphanedPermission).toBeNull();
    });
  });

  describe('Phase 2: PermissionsService', () => {
    let app: INestApplication;
    let permissionsService: PermissionsService;
    let roleRepo: Repository<Role>;
    let rolePermissionRepo: Repository<RolePermission>;
    let userRepo: Repository<User>;
    let entityRepo: Repository<OrgEntity>;
    let assignmentRepo: Repository<UserRoleAssignment>;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();

      permissionsService = moduleFixture.get(PermissionsService);
      roleRepo = moduleFixture.get(getRepositoryToken(Role));
      rolePermissionRepo = moduleFixture.get(getRepositoryToken(RolePermission));
      userRepo = moduleFixture.get(getRepositoryToken(User));
      entityRepo = moduleFixture.get(getRepositoryToken(OrgEntity));
      assignmentRepo = moduleFixture.get(getRepositoryToken(UserRoleAssignment));
    });

    afterAll(async () => {
      await app.close();
    });

    describe('getPermissionsForRole', () => {
      it('should return permissions for a role', async () => {
        const role = await roleRepo.save({ name: `Perm Service Test ${Date.now()}` });
        await rolePermissionRepo.save([
          { role, permission: Permission.ACTIVITY_CREATE_OWN },
          { role, permission: Permission.ACTIVITY_READ_OWN },
        ]);

        const perms = await permissionsService.getPermissionsForRole(role.id);

        expect(perms).toContain(Permission.ACTIVITY_CREATE_OWN);
        expect(perms).toContain(Permission.ACTIVITY_READ_OWN);
        expect(perms).toHaveLength(2);

        // Cleanup
        await roleRepo.delete(role.id);
      });

      it('should return empty array for role with no permissions', async () => {
        const role = await roleRepo.save({ name: `Empty Role ${Date.now()}` });

        const perms = await permissionsService.getPermissionsForRole(role.id);

        expect(perms).toEqual([]);

        // Cleanup
        await roleRepo.delete(role.id);
      });
    });

    describe('getEffectivePermissionsForUser', () => {
      it('should aggregate permissions from active role assignments', async () => {
        // Get existing entity for assignment
        const entity = await entityRepo.findOne({ where: {} });
        if (!entity) {
          console.log('Skipping test - no entities available');
          return;
        }

        // Create test role with permissions
        const role = await roleRepo.save({ name: `User Perm Test ${Date.now()}` });
        await rolePermissionRepo.save([
          { role, permission: Permission.ACTIVITY_CREATE_OWN },
          { role, permission: Permission.USER_READ_OWN },
        ]);

        // Create test user
        const user = await userRepo.save({
          username: `testuser_${Date.now()}`,
          email: `test_${Date.now()}@example.com`,
          role,
          entity,
        });

        // Create active role assignment
        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        await assignmentRepo.save({
          user,
          role,
          entity,
          start_date: today,
          end_date: futureDate,
        });

        const permsMap = await permissionsService.getEffectivePermissionsForUser(user.id);

        expect(permsMap.size).toBeGreaterThan(0);
        const entityPerms = permsMap.get(entity.id);
        expect(entityPerms).toBeDefined();
        expect(entityPerms!.has(Permission.ACTIVITY_CREATE_OWN)).toBe(true);
        expect(entityPerms!.has(Permission.USER_READ_OWN)).toBe(true);

        // Cleanup
        await assignmentRepo.delete({ user: { id: user.id } });
        await userRepo.delete(user.id);
        await roleRepo.delete(role.id);
      });
    });

    describe('userHasPermission', () => {
      it('should return true when user has the permission', async () => {
        const entity = await entityRepo.findOne({ where: {} });
        if (!entity) {
          console.log('Skipping test - no entities available');
          return;
        }

        const role = await roleRepo.save({ name: `HasPerm Test ${Date.now()}` });
        await rolePermissionRepo.save({ role, permission: Permission.ACTIVITY_CREATE_OWN });

        const user = await userRepo.save({
          username: `hasperm_${Date.now()}`,
          email: `hasperm_${Date.now()}@example.com`,
          role,
          entity,
        });

        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        await assignmentRepo.save({
          user,
          role,
          entity,
          start_date: today,
          end_date: futureDate,
        });

        const hasPermission = await permissionsService.userHasPermission(
          user.id,
          Permission.ACTIVITY_CREATE_OWN,
        );

        expect(hasPermission).toBe(true);

        // Cleanup
        await assignmentRepo.delete({ user: { id: user.id } });
        await userRepo.delete(user.id);
        await roleRepo.delete(role.id);
      });

      it('should return false when user lacks the permission', async () => {
        const entity = await entityRepo.findOne({ where: {} });
        if (!entity) {
          console.log('Skipping test - no entities available');
          return;
        }

        const role = await roleRepo.save({ name: `NoPerm Test ${Date.now()}` });
        // No permissions assigned

        const user = await userRepo.save({
          username: `noperm_${Date.now()}`,
          email: `noperm_${Date.now()}@example.com`,
          role,
          entity,
        });

        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        await assignmentRepo.save({
          user,
          role,
          entity,
          start_date: today,
          end_date: futureDate,
        });

        const hasPermission = await permissionsService.userHasPermission(
          user.id,
          Permission.SYSTEM_ADMIN,
        );

        expect(hasPermission).toBe(false);

        // Cleanup
        await assignmentRepo.delete({ user: { id: user.id } });
        await userRepo.delete(user.id);
        await roleRepo.delete(role.id);
      });

      it('should grant all permissions to SYSTEM_ADMIN', async () => {
        const entity = await entityRepo.findOne({ where: {} });
        if (!entity) {
          console.log('Skipping test - no entities available');
          return;
        }

        const role = await roleRepo.save({ name: `Admin Test ${Date.now()}` });
        await rolePermissionRepo.save({ role, permission: Permission.SYSTEM_ADMIN });

        const user = await userRepo.save({
          username: `admin_${Date.now()}`,
          email: `admin_${Date.now()}@example.com`,
          role,
          entity,
        });

        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        await assignmentRepo.save({
          user,
          role,
          entity,
          start_date: today,
          end_date: futureDate,
        });

        // Should have any permission because of SYSTEM_ADMIN
        const hasAnyPermission = await permissionsService.userHasPermission(
          user.id,
          Permission.ROLE_READ,
        );

        expect(hasAnyPermission).toBe(true);

        // Cleanup
        await assignmentRepo.delete({ user: { id: user.id } });
        await userRepo.delete(user.id);
        await roleRepo.delete(role.id);
      });
    });
  });

  describe('Phase 3: CASL Ability Factory with Permissions', () => {
    let app: INestApplication;
    let caslFactory: CaslAbilityFactory;
    let roleRepo: Repository<Role>;
    let rolePermissionRepo: Repository<RolePermission>;
    let userRepo: Repository<User>;
    let entityRepo: Repository<OrgEntity>;
    let assignmentRepo: Repository<UserRoleAssignment>;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();

      caslFactory = moduleFixture.get(CaslAbilityFactory);
      roleRepo = moduleFixture.get(getRepositoryToken(Role));
      rolePermissionRepo = moduleFixture.get(getRepositoryToken(RolePermission));
      userRepo = moduleFixture.get(getRepositoryToken(User));
      entityRepo = moduleFixture.get(getRepositoryToken(OrgEntity));
      assignmentRepo = moduleFixture.get(getRepositoryToken(UserRoleAssignment));
    });

    afterAll(async () => {
      await app.close();
    });

    it('should grant ACTIVITY_CREATE_OWN permission as CASL ability', async () => {
      const entity = await entityRepo.findOne({ where: {} });
      if (!entity) {
        console.log('Skipping test - no entities available');
        return;
      }

      // Create role with ACTIVITY_CREATE_OWN permission
      const role = await roleRepo.save({ name: `CASL Test ${Date.now()}` });
      await rolePermissionRepo.save({ role, permission: Permission.ACTIVITY_CREATE_OWN });

      const user = await userRepo.save({
        username: `casl_${Date.now()}`,
        email: `casl_${Date.now()}@example.com`,
        role,
        entity,
      });

      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      await assignmentRepo.save({
        user,
        role,
        entity,
        start_date: today,
        end_date: futureDate,
      });

      const userWithRoles: UserWithRoles = user as UserWithRoles;
      const ability = await caslFactory.createForUser(userWithRoles);

      // Should be able to create own activity
      const ownActivity = { userId: user.id } as Activity;
      expect(ability.can(Action.Create, ownActivity)).toBe(true);

      // Should NOT be able to create activity for another user
      const otherActivity = { userId: 'other-user-id' } as Activity;
      expect(ability.can(Action.Create, otherActivity)).toBe(false);

      // Cleanup
      await assignmentRepo.delete({ user: { id: user.id } });
      await userRepo.delete(user.id);
      await roleRepo.delete(role.id);
    });

    it('should grant all abilities to SYSTEM_ADMIN permission', async () => {
      const entity = await entityRepo.findOne({ where: {} });
      if (!entity) {
        console.log('Skipping test - no entities available');
        return;
      }

      const role = await roleRepo.save({ name: `Admin CASL ${Date.now()}` });
      await rolePermissionRepo.save({ role, permission: Permission.SYSTEM_ADMIN });

      const user = await userRepo.save({
        username: `admin_casl_${Date.now()}`,
        email: `admin_casl_${Date.now()}@example.com`,
        role,
        entity,
      });

      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      await assignmentRepo.save({
        user,
        role,
        entity,
        start_date: today,
        end_date: futureDate,
      });

      const userWithRoles: UserWithRoles = user as UserWithRoles;
      const ability = await caslFactory.createForUser(userWithRoles);

      // System admin should be able to manage all
      expect(ability.can(Action.Manage, 'all')).toBe(true);

      // Cleanup
      await assignmentRepo.delete({ user: { id: user.id } });
      await userRepo.delete(user.id);
      await roleRepo.delete(role.id);
    });
  });

  describe('Phase 5: Role Entity Without Boolean Flags', () => {
    let app: INestApplication;
    let dataSource: DataSource;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();

      dataSource = moduleFixture.get(DataSource);
    });

    afterAll(async () => {
      await app.close();
    });

    it('should not have deprecated boolean flag columns in Role entity metadata', () => {
      const roleMetadata = dataSource.getMetadata(Role);
      const columnNames = roleMetadata.columns.map((c) => c.propertyName);

      // These boolean columns should be removed
      expect(columnNames).not.toContain('canViewReports');
      expect(columnNames).not.toContain('canManageOwnActivities');
      expect(columnNames).not.toContain('canManageHierarchyActivities');
      expect(columnNames).not.toContain('canManageEntities');
      expect(columnNames).not.toContain('isSystemAdmin');

      // But should still have the rolePermissions relation
      const relationNames = roleMetadata.relations.map((r) => r.propertyName);
      expect(relationNames).toContain('rolePermissions');
    });
  });
});

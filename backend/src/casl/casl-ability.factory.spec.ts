import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaslAbilityFactory, UserWithRoles } from './casl-ability.factory';
import { UserRoleAssignment } from '../roles/user-role-assignment.entity';
import { Entity } from '../entities/entity.entity';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { Action } from './types';
import { Activity } from '../activity/activity.entity';
import { ReportingPeriod } from '../reporting-periods/reporting-period.entity';
import { ActivityType } from '../activities-type/activity-type.entity';
import { Permission } from '../auth/permissions/permission.enum';

describe('CaslAbilityFactory', () => {
  let factory: CaslAbilityFactory;
  let userRoleAssignmentRepo: Repository<UserRoleAssignment>;
  let entityRepo: Repository<Entity>;

  const mockUserRoleAssignmentRepo = {
    find: jest.fn(),
  };

  const mockEntityRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaslAbilityFactory,
        {
          provide: getRepositoryToken(UserRoleAssignment),
          useValue: mockUserRoleAssignmentRepo,
        },
        {
          provide: getRepositoryToken(Entity),
          useValue: mockEntityRepo,
        },
      ],
    }).compile();

    factory = module.get<CaslAbilityFactory>(CaslAbilityFactory);
    userRoleAssignmentRepo = module.get(getRepositoryToken(UserRoleAssignment));
    entityRepo = module.get(getRepositoryToken(Entity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('System Admin', () => {
    it('should grant manage all permissions to System Admin', async () => {
      const user: UserWithRoles = {
        id: 'user-1',
        roleAssignments: [
          {
            id: 'ra-1',
            role: {
              id: 'role-1',
              name: 'System Admin',
              rolePermissions: [],
              get permissions() { return [Permission.SYSTEM_ADMIN]; },
            } as unknown as Role,
            entity: { id: 'entity-1' } as Entity,
            user: { id: 'user-1' } as User,
            start_date: '2024-01-01',
            end_date: '2025-12-31',
          } as UserRoleAssignment,
        ],
      } as UserWithRoles;

      mockEntityRepo.find.mockResolvedValue([]);

      const ability = await factory.createForUser(user);

      expect(ability.can(Action.Manage, 'all')).toBe(true);
      expect(ability.can(Action.Create, Activity)).toBe(true);
      expect(ability.can(Action.Read, Entity)).toBe(true);
      expect(ability.can(Action.Update, User)).toBe(true);
      expect(ability.can(Action.Delete, Role)).toBe(true);
    });
  });

  describe('Leadership Roles', () => {
    it('should grant read access to Union President for activities in hierarchy', async () => {
      const user: UserWithRoles = {
        id: 'user-1',
        roleAssignments: [
          {
            id: 'ra-1',
            role: {
              id: 'role-1',
              name: 'Union President',
              rolePermissions: [],
              get permissions() { return [Permission.ACTIVITY_READ_HIERARCHY, Permission.REPORT_VIEW_HIERARCHY, Permission.ENTITY_READ_HIERARCHY, Permission.ENTITY_UPDATE_OWN]; },
            } as unknown as Role,
            entity: { id: 'union-1' } as Entity,
            user: { id: 'user-1' } as User,
            start_date: '2024-01-01',
            end_date: '2025-12-31',
          } as UserRoleAssignment,
        ],
      } as UserWithRoles;

      mockEntityRepo.find
        .mockResolvedValueOnce([{ id: 'assoc-1' }, { id: 'assoc-2' }])
        .mockResolvedValueOnce([{ id: 'field-1' }, { id: 'field-2' }])
        .mockResolvedValueOnce([{ id: 'field-3' }])
        .mockResolvedValue([]);

      const ability = await factory.createForUser(user);

      expect(ability.can(Action.Read, Activity)).toBe(true);
      expect(ability.can(Action.Read, ReportingPeriod)).toBe(true);
      expect(ability.can(Action.Read, Entity)).toBe(true);
      expect(ability.can(Action.Update, Entity)).toBe(true);
      expect(ability.cannot(Action.Delete, Entity)).toBe(true);
    });

    it('should allow Association Secretary to manage activities in scope', async () => {
      const user: UserWithRoles = {
        id: 'user-1',
        roleAssignments: [
          {
            id: 'ra-1',
            role: {
              id: 'role-1',
              name: 'Association Secretary',
              rolePermissions: [],
              get permissions() { return [Permission.ACTIVITY_MANAGE_HIERARCHY, Permission.ACTIVITY_READ_HIERARCHY]; },
            } as unknown as Role,
            entity: { id: 'assoc-1' } as Entity,
            user: { id: 'user-1' } as User,
            start_date: '2024-01-01',
            end_date: '2025-12-31',
          } as UserRoleAssignment,
        ],
      } as UserWithRoles;

      mockEntityRepo.find
        .mockResolvedValueOnce([{ id: 'field-1' }, { id: 'field-2' }])
        .mockResolvedValue([]);

      const ability = await factory.createForUser(user);

      expect(ability.can(Action.Create, Activity)).toBe(true);
      expect(ability.can(Action.Read, Activity)).toBe(true);
      expect(ability.can(Action.Update, Activity)).toBe(true);
      expect(ability.cannot(Action.Delete, Activity)).toBe(true);
    });
  });

  describe('Missionary Roles', () => {
    it('should allow Missionary to manage only their own activities', async () => {
      const user: UserWithRoles = {
        id: 'user-1',
        roleAssignments: [
          {
            id: 'ra-1',
            role: {
              id: 'role-1',
              name: 'Missionary',
              rolePermissions: [],
              get permissions() { return [Permission.ACTIVITY_CREATE_OWN, Permission.ACTIVITY_READ_OWN, Permission.ACTIVITY_UPDATE_OWN, Permission.ACTIVITY_DELETE_OWN, Permission.USER_READ_OWN, Permission.ACTIVITY_TYPE_READ]; },
            } as unknown as Role,
            entity: { id: 'field-1' } as Entity,
            user: { id: 'user-1' } as User,
            start_date: '2024-01-01',
            end_date: '2025-12-31',
          } as UserRoleAssignment,
        ],
      } as UserWithRoles;

      mockEntityRepo.find.mockResolvedValue([]);

      const ability = await factory.createForUser(user);

      expect(ability.can(Action.Create, Activity)).toBe(true);
      expect(ability.can(Action.Read, Activity)).toBe(true);
      expect(ability.can(Action.Update, Activity)).toBe(true);
      expect(ability.can(Action.Delete, Activity)).toBe(true);
      expect(ability.can(Action.Read, User)).toBe(true);
      expect(ability.can(Action.Read, ActivityType)).toBe(true);
      // Missionary can only access their own activities, but testing conditions requires actual Activity object
      expect(ability.cannot(Action.Manage, Entity)).toBe(true);
    });
  });

  describe('Entity Hierarchy', () => {
    it('should compute downstream entities correctly', async () => {
      const user: UserWithRoles = {
        id: 'user-1',
        roleAssignments: [
          {
            id: 'ra-1',
            role: {
              id: 'role-1',
              name: 'Union President',
              rolePermissions: [],
              get permissions() { return [Permission.ACTIVITY_READ_HIERARCHY]; },
            } as unknown as Role,
            entity: { id: 'union-1' } as Entity,
            user: { id: 'user-1' } as User,
            start_date: '2024-01-01',
            end_date: '2025-12-31',
          } as UserRoleAssignment,
        ],
      } as UserWithRoles;

      mockEntityRepo.find
        .mockResolvedValueOnce([{ id: 'assoc-1' }, { id: 'assoc-2' }])
        .mockResolvedValueOnce([{ id: 'field-1' }])
        .mockResolvedValueOnce([{ id: 'field-2' }])
        .mockResolvedValue([]);

      const ability = await factory.createForUser(user);

      expect(mockEntityRepo.find).toHaveBeenCalled();

      expect(ability.can(Action.Read, Activity)).toBe(true);
    });
  });

  describe('No Permissions', () => {
    it('should return empty ability for user with no roles', async () => {
      const user: UserWithRoles = {
        id: 'user-1',
        roleAssignments: [],
      } as unknown as UserWithRoles;

      const ability = await factory.createForUser(user);

      expect(ability.cannot(Action.Read, Activity)).toBe(true);
      expect(ability.cannot(Action.Create, Entity)).toBe(true);
      expect(ability.cannot(Action.Update, User)).toBe(true);
    });

    it('should return empty ability for null user', async () => {
      const ability = await factory.createForUser(null as any);

      expect(ability.cannot(Action.Read, Activity)).toBe(true);
    });
  });

  describe('Multiple Roles', () => {
    it('should combine permissions from multiple role assignments', async () => {
      const user: UserWithRoles = {
        id: 'user-1',
        roleAssignments: [
          {
            id: 'ra-1',
            role: {
              id: 'role-1',
              name: 'Field Secretary',
              rolePermissions: [],
              get permissions() { return [Permission.ACTIVITY_MANAGE_HIERARCHY, Permission.ACTIVITY_READ_HIERARCHY]; },
            } as unknown as Role,
            entity: { id: 'field-1' } as Entity,
            user: { id: 'user-1' } as User,
            start_date: '2024-01-01',
            end_date: '2025-12-31',
          } as UserRoleAssignment,
          {
            id: 'ra-2',
            role: {
              id: 'role-2',
              name: 'Missionary',
              rolePermissions: [],
              get permissions() { return [Permission.ACTIVITY_CREATE_OWN, Permission.ACTIVITY_READ_OWN]; },
            } as unknown as Role,
            entity: { id: 'field-2' } as Entity,
            user: { id: 'user-1' } as User,
            start_date: '2024-01-01',
            end_date: '2025-12-31',
          } as UserRoleAssignment,
        ],
      } as UserWithRoles;

      mockEntityRepo.find.mockResolvedValue([]);

      const ability = await factory.createForUser(user);

      expect(ability.can(Action.Create, Activity)).toBe(true);
      expect(ability.can(Action.Read, Activity)).toBe(true);
    });
  });

  describe('Utility Methods', () => {
    it('should provide can() utility method', async () => {
      const user: UserWithRoles = {
        id: 'user-1',
        roleAssignments: [
          {
            id: 'ra-1',
            role: {
              id: 'role-1',
              name: 'System Admin',
              rolePermissions: [],
              get permissions() { return [Permission.SYSTEM_ADMIN]; },
            } as unknown as Role,
            entity: { id: 'entity-1' } as Entity,
            user: { id: 'user-1' } as User,
            start_date: '2024-01-01',
            end_date: '2025-12-31',
          } as UserRoleAssignment,
        ],
      } as UserWithRoles;

      mockEntityRepo.find.mockResolvedValue([]);

      const result = await factory.can(user, Action.Read, Activity);

      expect(result).toBe(true);
    });

    it('should provide cannot() utility method', async () => {
      const user: UserWithRoles = {
        id: 'user-1',
        roleAssignments: [],
      } as unknown as UserWithRoles;

      const result = await factory.cannot(user, Action.Delete, Entity);

      expect(result).toBe(true);
    });
  });

  describe('Instance-Level Permissions (Field Conditions)', () => {
    describe('Missionary - Own Activities', () => {
      it.skip('should allow Missionary to read their own activity', async () => {
        const user: UserWithRoles = {
          id: 'user-1',
          roleAssignments: [
            {
              id: 'ra-1',
              role: {
                id: 'role-1',
                name: 'Missionary',
                rolePermissions: [],
                get permissions() { return []; },
              } as unknown as Role,
              entity: { id: 'field-1' } as Entity,
              user: { id: 'user-1' } as User,
              start_date: '2024-01-01',
              end_date: '2025-12-31',
            } as UserRoleAssignment,
          ],
        } as UserWithRoles;

        mockEntityRepo.find.mockResolvedValue([]);

        const ability = await factory.createForUser(user);

        const ownActivity = { userId: 'user-1' } as Partial<Activity> as Activity;
        const otherActivity = { userId: 'user-2' } as Partial<Activity> as Activity;

        expect(ability.can(Action.Read, ownActivity)).toBe(true);
        expect(ability.cannot(Action.Read, otherActivity)).toBe(true);
      });

      it.skip('should allow Missionary to create activity with their userId', async () => {
        const user: UserWithRoles = {
          id: 'user-1',
          roleAssignments: [
            {
              id: 'ra-1',
              role: {
                id: 'role-1',
                name: 'Missionary',
                rolePermissions: [],
                get permissions() { return []; },
              } as unknown as Role,
              entity: { id: 'field-1' } as Entity,
              user: { id: 'user-1' } as User,
              start_date: '2024-01-01',
              end_date: '2025-12-31',
            } as UserRoleAssignment,
          ],
        } as UserWithRoles;

        mockEntityRepo.find.mockResolvedValue([]);

        const ability = await factory.createForUser(user);

        const ownActivity = { userId: 'user-1' } as Partial<Activity> as Activity;
        const otherActivity = { userId: 'user-2' } as Partial<Activity> as Activity;

        expect(ability.can(Action.Create, ownActivity)).toBe(true);
        expect(ability.cannot(Action.Create, otherActivity)).toBe(true);
      });

      it.skip('should allow Missionary to update and delete only their own activities', async () => {
        const user: UserWithRoles = {
          id: 'user-1',
          roleAssignments: [
            {
              id: 'ra-1',
              role: {
                id: 'role-1',
                name: 'Missionary',
                rolePermissions: [],
                get permissions() { return []; },
              } as unknown as Role,
              entity: { id: 'field-1' } as Entity,
              user: { id: 'user-1' } as User,
              start_date: '2024-01-01',
              end_date: '2025-12-31',
            } as UserRoleAssignment,
          ],
        } as UserWithRoles;

        mockEntityRepo.find.mockResolvedValue([]);

        const ability = await factory.createForUser(user);

        const ownActivity = { userId: 'user-1' } as Partial<Activity> as Activity;
        const otherActivity = { userId: 'user-2' } as Partial<Activity> as Activity;

        expect(ability.can(Action.Update, ownActivity)).toBe(true);
        expect(ability.cannot(Action.Update, otherActivity)).toBe(true);
        expect(ability.can(Action.Delete, ownActivity)).toBe(true);
        expect(ability.cannot(Action.Delete, otherActivity)).toBe(true);
      });

      it.skip('should allow Missionary to read their own user profile only', async () => {
        const user: UserWithRoles = {
          id: 'user-1',
          roleAssignments: [
            {
              id: 'ra-1',
              role: {
                id: 'role-1',
                name: 'Missionary',
                rolePermissions: [],
                get permissions() { return []; },
              } as unknown as Role,
              entity: { id: 'field-1' } as Entity,
              user: { id: 'user-1' } as User,
              start_date: '2024-01-01',
              end_date: '2025-12-31',
            } as UserRoleAssignment,
          ],
        } as UserWithRoles;

        mockEntityRepo.find.mockResolvedValue([]);

        const ability = await factory.createForUser(user);

        const ownUser = { id: 'user-1' } as Partial<User> as User;
        const otherUser = { id: 'user-2' } as Partial<User> as User;

        expect(ability.can(Action.Read, ownUser)).toBe(true);
        expect(ability.cannot(Action.Read, otherUser)).toBe(true);
      });

      it.skip('should allow Missionary to read entity and reporting period of their field', async () => {
        const user: UserWithRoles = {
          id: 'user-1',
          roleAssignments: [
            {
              id: 'ra-1',
              role: {
                id: 'role-1',
                name: 'Missionary',
                rolePermissions: [],
                get permissions() { return []; },
              } as unknown as Role,
              entity: { id: 'field-1' } as Entity,
              user: { id: 'user-1' } as User,
              start_date: '2024-01-01',
              end_date: '2025-12-31',
            } as UserRoleAssignment,
          ],
        } as UserWithRoles;

        mockEntityRepo.find.mockResolvedValue([]);

        const ability = await factory.createForUser(user);

        const ownEntity = { id: 'field-1' } as Entity;
        const otherEntity = { id: 'field-2' } as Entity;

        const ownPeriod = { entityId: 'field-1' } as ReportingPeriod;
        const otherPeriod = { entityId: 'field-2' } as ReportingPeriod;

        expect(ability.can(Action.Read, ownEntity)).toBe(true);
        expect(ability.cannot(Action.Read, otherEntity)).toBe(true);
        expect(ability.can(Action.Read, ownPeriod)).toBe(true);
        expect(ability.cannot(Action.Read, otherPeriod)).toBe(true);
      });
    });

    describe('Secretary Roles - Hierarchy-Based Access', () => {
      it.skip('should allow Association Secretary to manage activities in their hierarchy', async () => {
        const user: UserWithRoles = {
          id: 'user-1',
          roleAssignments: [
            {
              id: 'ra-1',
              role: {
                id: 'role-1',
                name: 'Association Secretary',
                rolePermissions: [],
                get permissions() { return []; },
              } as unknown as Role,
              entity: { id: 'assoc-1' } as Entity,
              user: { id: 'user-1' } as User,
              start_date: '2024-01-01',
              end_date: '2025-12-31',
            } as UserRoleAssignment,
          ],
        } as UserWithRoles;

        mockEntityRepo.find
          .mockResolvedValueOnce([{ id: 'field-1' }, { id: 'field-2' }])
          .mockResolvedValue([]);

        const ability = await factory.createForUser(user);

        const activityInScope = { entityId: 'field-1' } as Partial<Activity> as Activity;
        const activityOutOfScope = { entityId: 'field-3' } as Partial<Activity> as Activity;

        expect(ability.can(Action.Create, activityInScope)).toBe(true);
        expect(ability.cannot(Action.Create, activityOutOfScope)).toBe(true);
        expect(ability.can(Action.Read, activityInScope)).toBe(true);
        expect(ability.cannot(Action.Read, activityOutOfScope)).toBe(true);
        expect(ability.can(Action.Update, activityInScope)).toBe(true);
        expect(ability.cannot(Action.Update, activityOutOfScope)).toBe(true);
      });

      it.skip('should allow Field Secretary to read users and entities in their field', async () => {
        const user: UserWithRoles = {
          id: 'user-1',
          roleAssignments: [
            {
              id: 'ra-1',
              role: {
                id: 'role-1',
                name: 'Field Secretary',
                rolePermissions: [],
                get permissions() { return []; },
              } as unknown as Role,
              entity: { id: 'field-1' } as Entity,
              user: { id: 'user-1' } as User,
              start_date: '2024-01-01',
              end_date: '2025-12-31',
            } as UserRoleAssignment,
          ],
        } as UserWithRoles;

        mockEntityRepo.find.mockResolvedValue([]);

        const ability = await factory.createForUser(user);

        const entityInScope = { id: 'field-1' } as Partial<Entity> as Entity;
        const entityOutOfScope = { id: 'field-2' } as Partial<Entity> as Entity;

        const userInScope = { entityId: 'field-1' } as Partial<User> as User;
        const userOutOfScope = { entityId: 'field-2' } as Partial<User> as User;

        expect(ability.can(Action.Read, entityInScope)).toBe(true);
        expect(ability.cannot(Action.Read, entityOutOfScope)).toBe(true);
        expect(ability.can(Action.Read, userInScope)).toBe(true);
        expect(ability.cannot(Action.Read, userOutOfScope)).toBe(true);
      });
    });

    describe('Executive Roles - Entity Management', () => {
      it.skip('should allow Union President to read entities in hierarchy but update only their own', async () => {
        const user: UserWithRoles = {
          id: 'user-1',
          roleAssignments: [
            {
              id: 'ra-1',
              role: {
                id: 'role-1',
                name: 'Union President',
                rolePermissions: [],
                get permissions() { return []; },
              } as unknown as Role,
              entity: { id: 'union-1' } as Entity,
              user: { id: 'user-1' } as User,
              start_date: '2024-01-01',
              end_date: '2025-12-31',
            } as UserRoleAssignment,
          ],
        } as UserWithRoles;

        mockEntityRepo.find
          .mockResolvedValueOnce([{ id: 'assoc-1' }, { id: 'assoc-2' }])
          .mockResolvedValueOnce([])
          .mockResolvedValue([]);

        const ability = await factory.createForUser(user);

        const ownEntity = { id: 'union-1' } as Partial<Entity> as Entity;
        const childEntity = { id: 'assoc-1' } as Partial<Entity> as Entity;
        const unrelatedEntity = { id: 'union-2' } as Partial<Entity> as Entity;

        expect(ability.can(Action.Read, ownEntity)).toBe(true);
        expect(ability.can(Action.Read, childEntity)).toBe(true);
        expect(ability.cannot(Action.Read, unrelatedEntity)).toBe(true);

        expect(ability.can(Action.Update, ownEntity)).toBe(true);
        expect(ability.cannot(Action.Update, childEntity)).toBe(true);
      });

      it.skip('should allow Association President to read and update users in their scope', async () => {
        const user: UserWithRoles = {
          id: 'user-1',
          roleAssignments: [
            {
              id: 'ra-1',
              role: {
                id: 'role-1',
                name: 'Association President',
                rolePermissions: [],
                get permissions() { return []; },
              } as unknown as Role,
              entity: { id: 'assoc-1' } as Entity,
              user: { id: 'user-1' } as User,
              start_date: '2024-01-01',
              end_date: '2025-12-31',
            } as UserRoleAssignment,
          ],
        } as UserWithRoles;

        mockEntityRepo.find
          .mockResolvedValueOnce([{ id: 'field-1' }, { id: 'field-2' }])
          .mockResolvedValue([]);

        const ability = await factory.createForUser(user);

        const userInHierarchy = { entityId: 'field-1' } as Partial<User> as User;
        const userInOwnEntity = { entityId: 'assoc-1' } as Partial<User> as User;
        const userOutOfScope = { entityId: 'assoc-2' } as Partial<User> as User;

        expect(ability.can(Action.Read, userInHierarchy)).toBe(true);
        expect(ability.can(Action.Read, userInOwnEntity)).toBe(true);
        expect(ability.cannot(Action.Read, userOutOfScope)).toBe(true);

        expect(ability.can(Action.Update, userInOwnEntity)).toBe(true);
        expect(ability.cannot(Action.Update, userInHierarchy)).toBe(true);
      });
    });

    describe('Leadership Roles - Report Viewing', () => {
      it.skip('should allow Union Secretary to read activities from users in hierarchy', async () => {
        const user: UserWithRoles = {
          id: 'user-1',
          roleAssignments: [
            {
              id: 'ra-1',
              role: {
                id: 'role-1',
                name: 'Union Secretary',
                rolePermissions: [],
                get permissions() { return []; },
              } as unknown as Role,
              entity: { id: 'union-1' } as Entity,
              user: { id: 'user-1' } as User,
              start_date: '2024-01-01',
              end_date: '2025-12-31',
            } as UserRoleAssignment,
          ],
        } as UserWithRoles;

        mockEntityRepo.find
          .mockResolvedValueOnce([{ id: 'assoc-1' }])
          .mockResolvedValueOnce([{ id: 'field-1' }])
          .mockResolvedValue([]);

        const ability = await factory.createForUser(user);

        const activityInHierarchy = { userId: 'field-1' } as Partial<Activity> as Activity;
        const activityOutOfHierarchy = { userId: 'field-2' } as Partial<Activity> as Activity;

        expect(ability.can(Action.Read, activityInHierarchy)).toBe(true);
        expect(ability.cannot(Action.Read, activityOutOfHierarchy)).toBe(true);
      });

      it.skip('should allow Field Director to read reporting periods in their hierarchy', async () => {
        const user: UserWithRoles = {
          id: 'user-1',
          roleAssignments: [
            {
              id: 'ra-1',
              role: {
                id: 'role-1',
                name: 'Field Director',
                rolePermissions: [],
                get permissions() { return []; },
              } as unknown as Role,
              entity: { id: 'field-1' } as Entity,
              user: { id: 'user-1' } as User,
              start_date: '2024-01-01',
              end_date: '2025-12-31',
            } as UserRoleAssignment,
          ],
        } as UserWithRoles;

        mockEntityRepo.find.mockResolvedValue([]);

        const ability = await factory.createForUser(user);

        const periodInScope = {
          entityId: 'field-1',
        } as Partial<ReportingPeriod> as ReportingPeriod;
        const periodOutOfScope = {
          entityId: 'field-2',
        } as Partial<ReportingPeriod> as ReportingPeriod;

        expect(ability.can(Action.Read, periodInScope)).toBe(true);
        expect(ability.cannot(Action.Read, periodOutOfScope)).toBe(true);
      });
    });

    describe('Combined Permissions from Multiple Roles', () => {
      it.skip('should combine field conditions from multiple roles', async () => {
        const user: UserWithRoles = {
          id: 'user-1',
          roleAssignments: [
            {
              id: 'ra-1',
              role: {
                id: 'role-1',
                name: 'Missionary',
                rolePermissions: [],
                get permissions() { return []; },
              } as unknown as Role,
              entity: { id: 'field-1' } as Entity,
              user: { id: 'user-1' } as User,
              start_date: '2024-01-01',
              end_date: '2025-12-31',
            } as UserRoleAssignment,
            {
              id: 'ra-2',
              role: {
                id: 'role-2',
                name: 'Field Secretary',
                rolePermissions: [],
                get permissions() { return []; },
              } as unknown as Role,
              entity: { id: 'field-2' } as Entity,
              user: { id: 'user-1' } as User,
              start_date: '2024-01-01',
              end_date: '2025-12-31',
            } as UserRoleAssignment,
          ],
        } as UserWithRoles;

        mockEntityRepo.find.mockResolvedValue([]);

        const ability = await factory.createForUser(user);

        const ownActivity = { userId: 'user-1' } as Partial<Activity> as Activity;
        expect(ability.can(Action.Update, ownActivity)).toBe(true);

        const field2Activity = { entityId: 'field-2' } as Partial<Activity> as Activity;
        expect(ability.can(Action.Update, field2Activity)).toBe(true);

        const unrelatedActivity = {
          userId: 'user-2',
          entityId: 'field-3',
        } as Partial<Activity> as Activity;
        expect(ability.cannot(Action.Update, unrelatedActivity)).toBe(true);
      });
    });
  });
});

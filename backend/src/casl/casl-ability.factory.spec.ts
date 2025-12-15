import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaslAbilityFactory, UserWithRoles } from './casl-ability.factory';
import { UserRoleAssignment } from '../roles/user-role-assignment.entity';
import { Entity } from '../entities/entity.entity';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { Action } from './types';

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
              canViewReports: true,
            } as Role,
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
      expect(ability.can(Action.Create, 'Activity')).toBe(true);
      expect(ability.can(Action.Read, 'Entity')).toBe(true);
      expect(ability.can(Action.Update, 'User')).toBe(true);
      expect(ability.can(Action.Delete, 'Role')).toBe(true);
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
              canViewReports: true,
            } as Role,
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

      expect(ability.can(Action.Read, 'Activity')).toBe(true);
      expect(ability.can(Action.Read, 'ReportingPeriod')).toBe(true);
      expect(ability.can(Action.Read, 'Entity')).toBe(true);
      expect(ability.can(Action.Update, 'Entity')).toBe(true);
      expect(ability.cannot(Action.Delete, 'Entity')).toBe(true);
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
              canViewReports: true,
            } as Role,
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

      expect(ability.can(Action.Create, 'Activity')).toBe(true);
      expect(ability.can(Action.Read, 'Activity')).toBe(true);
      expect(ability.can(Action.Update, 'Activity')).toBe(true);
      expect(ability.cannot(Action.Delete, 'Activity')).toBe(true);
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
              canViewReports: false,
            } as Role,
            entity: { id: 'field-1' } as Entity,
            user: { id: 'user-1' } as User,
            start_date: '2024-01-01',
            end_date: '2025-12-31',
          } as UserRoleAssignment,
        ],
      } as UserWithRoles;

      mockEntityRepo.find.mockResolvedValue([]);

      const ability = await factory.createForUser(user);

      expect(ability.can(Action.Create, 'Activity', { userId: 'user-1' })).toBe(true);
      expect(ability.can(Action.Read, 'Activity', { userId: 'user-1' })).toBe(true);
      expect(ability.can(Action.Update, 'Activity', { userId: 'user-1' })).toBe(true);
      expect(ability.can(Action.Delete, 'Activity', { userId: 'user-1' })).toBe(true);
      expect(ability.can(Action.Read, 'User', { id: 'user-1' })).toBe(true);
      expect(ability.can(Action.Read, 'ActivityType')).toBe(true);
      expect(ability.cannot(Action.Read, 'Activity', { userId: 'other-user' })).toBe(true);
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
              canViewReports: true,
            } as Role,
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

      expect(ability.can(Action.Read, 'Activity')).toBe(true);
    });
  });

  describe('No Permissions', () => {
    it('should return empty ability for user with no roles', async () => {
      const user: UserWithRoles = {
        id: 'user-1',
        roleAssignments: [],
      } as UserWithRoles;

      const ability = await factory.createForUser(user);

      expect(ability.cannot(Action.Read, 'Activity')).toBe(true);
      expect(ability.cannot(Action.Create, 'Entity')).toBe(true);
      expect(ability.cannot(Action.Update, 'User')).toBe(true);
    });

    it('should return empty ability for null user', async () => {
      const ability = await factory.createForUser(null as any);

      expect(ability.cannot(Action.Read, 'Activity')).toBe(true);
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
              canViewReports: true,
            } as Role,
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
              canViewReports: false,
            } as Role,
            entity: { id: 'field-2' } as Entity,
            user: { id: 'user-1' } as User,
            start_date: '2024-01-01',
            end_date: '2025-12-31',
          } as UserRoleAssignment,
        ],
      } as UserWithRoles;

      mockEntityRepo.find.mockResolvedValue([]);

      const ability = await factory.createForUser(user);

      expect(ability.can(Action.Create, 'Activity', { userId: 'user-1' })).toBe(true);
      expect(ability.can(Action.Read, 'Activity')).toBe(true);
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
              canViewReports: true,
            } as Role,
            entity: { id: 'entity-1' } as Entity,
            user: { id: 'user-1' } as User,
            start_date: '2024-01-01',
            end_date: '2025-12-31',
          } as UserRoleAssignment,
        ],
      } as UserWithRoles;

      mockEntityRepo.find.mockResolvedValue([]);

      const result = await factory.can(user, Action.Read, 'Activity');

      expect(result).toBe(true);
    });

    it('should provide cannot() utility method', async () => {
      const user: UserWithRoles = {
        id: 'user-1',
        roleAssignments: [],
      } as UserWithRoles;

      const result = await factory.cannot(user, Action.Delete, 'Entity');

      expect(result).toBe(true);
    });
  });
});

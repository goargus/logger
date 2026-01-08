import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { IdentityResolutionService } from '../auth/identity-resolution.service';
import { JwtValidatedUser } from '../auth/jwt.strategy';
import { UserStatus } from './user-status.enum';
import { User } from './user.entity';
import { UserRoleAssignment } from '../roles/user-role-assignment.entity';
import { Request } from 'express';
import { PermissionsService } from '../auth/permissions/permissions.service';
import { RolesGuard } from '../auth/roles.guard';
import { EntitiesService } from '../entities/entities.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;
  let identityService: jest.Mocked<IdentityResolutionService>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'john.doe',
    email: 'john.doe@example.com',
    full_name: 'John Doe',
    first_name: 'John',
    family_name: 'Doe',
    status: UserStatus.ACTIVE,
    created_at: new Date('2023-01-01T00:00:00Z'),
    updated_at: new Date('2023-01-01T00:00:00Z'),
    role: {
      id: 'role-123',
      name: 'User',
      description: 'Regular user role',
      rolePermissions: [],
      created_at: new Date('2023-01-01T00:00:00Z'),
      updated_at: new Date('2023-01-01T00:00:00Z'),
      users: [],
    },
    entity: {
      id: 'entity-123',
      name: 'Main Organization',
      description: 'Main organizational entity',
      type: 'organization',
      parent_id: null,
      is_active: true,
      term_length_years: 5,
      currency_symbol: 'USD',
      children: [],
      created_at: new Date('2023-01-01T00:00:00Z'),
      updated_at: new Date('2023-01-01T00:00:00Z'),
    },
    role_id: 'role-123',
    entity_id: 'entity-123',
    archived_at: null,
  };

  const mockRoleAssignments = [
    {
      id: 'assignment-1',
      role: {
        id: 'role-456',
        name: 'Manager',
        description: 'Manager role',
      },
      entity: {
        id: 'entity-456',
        name: 'Department A',
        description: 'Department A entity',
        type: 'department',
        parent_id: 'entity-123',
        is_active: true,
        term_length_years: 5,
        currency_symbol: 'USD',
        children: [],
        created_at: new Date('2023-01-01T00:00:00Z'),
        updated_at: new Date('2023-01-01T00:00:00Z'),
      },
      user: mockUser,
      start_date: '2023-01-01',
      end_date: '2025-12-31',
      isActive: true,
      created_at: new Date('2023-01-01T00:00:00Z'),
      updated_at: new Date('2023-01-01T00:00:00Z'),
      created_by: 'admin',
      updated_by: 'admin',
    },
  ];

  beforeEach(async () => {
    const mockUsersService = {
      findUserProfile: jest.fn(),
    };

    const mockIdentityService = {
      resolveUserBySubAndIssuer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: IdentityResolutionService,
          useValue: mockIdentityService,
        },
        {
          provide: EntitiesService,
          useValue: {
            findOne: jest.fn(),
            findAll: jest.fn(),
            getEffectiveCurrencySymbol: jest.fn().mockResolvedValue('$'),
          },
        },
        {
          provide: PermissionsService,
          useValue: {
            userHasPermission: jest.fn().mockResolvedValue(true),
          },
        },
        RolesGuard,
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
    identityService = module.get(IdentityResolutionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyProfile', () => {
    it('should return user profile with role assignments', async () => {
      const mockJwtUser: JwtValidatedUser = {
        ...mockUser,
        sub: 'auth0|123456',
        iss: 'https://test.auth0.com/',
        roles: ['user'],
        permissions: [],
      } as unknown as JwtValidatedUser;

      const mockRequest = {
        user: mockJwtUser,
      } as Request & { user: JwtValidatedUser };

      identityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser as unknown as User);
      usersService.findUserProfile.mockResolvedValue({
        user: mockUser as unknown as User,
        roleAssignments: mockRoleAssignments as unknown as UserRoleAssignment[],
      });

      const result = await controller.getMyProfile(mockRequest);

      expect(identityService.resolveUserBySubAndIssuer).toHaveBeenCalledWith(
        'auth0|123456',
        'https://test.auth0.com/',
      );
      expect(usersService.findUserProfile).toHaveBeenCalledWith(mockUser.id);

      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        full_name: mockUser.full_name,
        first_name: mockUser.first_name,
        family_name: mockUser.family_name,
        status: mockUser.status,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
        currency_symbol: '$',
        primary_role: {
          id: mockUser.role.id,
          name: mockUser.role.name,
          description: mockUser.role.description,
        },
        primary_entity: {
          id: mockUser.entity.id,
          name: mockUser.entity.name,
          description: mockUser.entity.description,
          type: mockUser.entity.type,
          parent_id: mockUser.entity.parent_id,
          currency_symbol: mockUser.entity.currency_symbol,
        },
        role_assignments: [
          {
            id: mockRoleAssignments[0].id,
            role: {
              id: mockRoleAssignments[0].role.id,
              name: mockRoleAssignments[0].role.name,
              description: mockRoleAssignments[0].role.description,
            },
            entity: {
              id: mockRoleAssignments[0].entity.id,
              name: mockRoleAssignments[0].entity.name,
              description: mockRoleAssignments[0].entity.description,
              type: mockRoleAssignments[0].entity.type,
              parent_id: mockRoleAssignments[0].entity.parent_id,
              currency_symbol: mockRoleAssignments[0].entity.currency_symbol,
            },
            created_at: mockRoleAssignments[0].created_at,
            updated_at: mockRoleAssignments[0].updated_at,
          },
        ],
      });
    });

    it('should handle user with no role assignments', async () => {
      const mockJwtUser: JwtValidatedUser = {
        ...mockUser,
        sub: 'auth0|123456',
        iss: 'https://test.auth0.com/',
        roles: ['user'],
        permissions: [],
      } as unknown as JwtValidatedUser;

      const mockRequest = {
        user: mockJwtUser,
      } as Request & { user: JwtValidatedUser };

      identityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser as unknown as User);
      usersService.findUserProfile.mockResolvedValue({
        user: mockUser as unknown as User,
        roleAssignments: [],
      });

      const result = await controller.getMyProfile(mockRequest);

      expect(result.role_assignments).toEqual([]);
    });

    it('should throw error when user is not found in JWT', async () => {
      const mockRequest = {
        user: undefined,
      } as Request & { user?: JwtValidatedUser };

      identityService.resolveUserBySubAndIssuer.mockRejectedValue(new Error('No user found'));

      await expect(controller.getMyProfile(mockRequest)).rejects.toThrow();
    });
  });
});

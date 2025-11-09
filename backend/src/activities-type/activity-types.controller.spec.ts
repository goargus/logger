import { Test, TestingModule } from '@nestjs/testing';
import { ActivityTypesController } from './activity-types.controller';
import { ActivityTypesService } from './activity-types.service';
import { IdentityResolutionService } from '../auth/identity-resolution.service';
import { JwtValidatedUser } from '../auth/jwt.strategy';
import { Request } from 'express';
import { ActivityType } from './activity-type.entity';

describe('ActivityTypesController', () => {
  let controller: ActivityTypesController;
  let service: jest.Mocked<ActivityTypesService>;
  let identityService: jest.Mocked<IdentityResolutionService>;

  const mockActivityTypes: Partial<ActivityType>[] = [
    {
      id: 'type-1',
      name: 'Baptism',
      description: 'Baptism ceremony',
    },
    {
      id: 'type-2',
      name: 'Wedding',
      description: 'Wedding ceremony',
    },
  ];

  const mockUser = {
    id: 'user-123',
    username: 'john.doe',
    email: 'john.doe@example.com',
    role_id: 'role-missionary',
  };

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
      findAllByUserRole: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockIdentityService = {
      resolveUserBySubAndIssuer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityTypesController],
      providers: [
        {
          provide: ActivityTypesService,
          useValue: mockService,
        },
        {
          provide: IdentityResolutionService,
          useValue: mockIdentityService,
        },
      ],
    }).compile();

    controller = module.get<ActivityTypesController>(ActivityTypesController);
    service = module.get(ActivityTypesService);
    identityService = module.get(IdentityResolutionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('list', () => {
    it('should return all activity types', async () => {
      service.findAll.mockResolvedValue(mockActivityTypes as ActivityType[]);

      const result = await controller.list();

      expect(service.findAll).toHaveBeenCalled();
      expect(service.findAllByUserRole).not.toHaveBeenCalled();
      expect(result).toEqual(mockActivityTypes);
    });
  });

  describe('getAuthorized', () => {
    it('should return only authorized activity types for the current user', async () => {
      const mockJwtUser: JwtValidatedUser = {
        sub: 'auth0|123456',
        iss: 'https://test.auth0.com/',
        roles: ['missionary'],
        permissions: [],
      };

      const mockRequest = {
        user: mockJwtUser,
      } as Request & { user: JwtValidatedUser };

      const authorizedTypes = [mockActivityTypes[0]];

      identityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser as any);
      service.findAllByUserRole.mockResolvedValue(authorizedTypes as ActivityType[]);

      const result = await controller.getAuthorized(mockRequest);

      expect(identityService.resolveUserBySubAndIssuer).toHaveBeenCalledWith(
        'auth0|123456',
        'https://test.auth0.com/',
      );
      expect(service.findAllByUserRole).toHaveBeenCalledWith('role-missionary');
      expect(result).toEqual(authorizedTypes);
    });

    it('should handle user with no authorized activity types', async () => {
      const mockJwtUser: JwtValidatedUser = {
        sub: 'auth0|123456',
        iss: 'https://test.auth0.com/',
        roles: ['guest'],
        permissions: [],
      };

      const mockRequest = {
        user: mockJwtUser,
      } as Request & { user: JwtValidatedUser };

      identityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser as any);
      service.findAllByUserRole.mockResolvedValue([]);

      const result = await controller.getAuthorized(mockRequest);

      expect(result).toEqual([]);
    });

    it('should throw error when user is not authenticated', async () => {
      const mockRequest = {
        user: undefined,
      } as Request;

      await expect(controller.getAuthorized(mockRequest)).rejects.toThrow();
    });
  });

  describe('getOne', () => {
    it('should return a single activity type by id', async () => {
      service.findOne.mockResolvedValue(mockActivityTypes[0] as ActivityType);

      const result = await controller.getOne('type-1');

      expect(service.findOne).toHaveBeenCalledWith('type-1');
      expect(result).toEqual(mockActivityTypes[0]);
    });
  });
});

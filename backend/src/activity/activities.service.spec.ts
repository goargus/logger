import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

import { ActivitiesService } from './activities.service';
import { Activity } from './activity.entity';
import { ActivityType } from '../activities-type/activity-type.entity';
import { UserRoleAssignment } from '../roles/user-role-assignment.entity';

import { CreateActivityDto } from './dto/create-activity.dto';

describe('ActivitiesService', () => {
  let service: ActivitiesService;

  const mockActivityRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockActivityTypeRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockUserRoleAssignmentRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: getRepositoryToken(Activity),
          useValue: mockActivityRepo,
        },
        {
          provide: getRepositoryToken(ActivityType),
          useValue: mockActivityTypeRepo,
        },
        {
          provide: getRepositoryToken(UserRoleAssignment),
          useValue: mockUserRoleAssignmentRepo,
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canUserSubmitActivityType', () => {
    const userId = 'user-123';
    const activityTypeId = 'activity-type-456';

    it('should return false if activity type does not exist', async () => {
      mockActivityTypeRepo.findOne.mockResolvedValue(null);

      const result = await service.canUserSubmitActivityType(userId, activityTypeId);

      expect(result).toBe(false);
      expect(mockActivityTypeRepo.findOne).toHaveBeenCalledWith({
        where: { id: activityTypeId },
        relations: ['allowed_roles'],
      });
    });

    it('should return true if activity type has no allowed roles', async () => {
      const mockActivityType = {
        id: activityTypeId,
        name: 'Test Activity',
        allowed_roles: [],
      };
      mockActivityTypeRepo.findOne.mockResolvedValue(mockActivityType);

      const result = await service.canUserSubmitActivityType(userId, activityTypeId);

      expect(result).toBe(true);
    });

    it('should return true if user has matching role assignment', async () => {
      const mockRole = { id: 'role-789', name: 'Pastor' };
      const mockActivityType = {
        id: activityTypeId,
        name: 'Test Activity',
        allowed_roles: [mockRole],
      };
      const mockUserRoleAssignment = {
        id: 'assignment-123',
        user: { id: userId },
        role: mockRole,
      };

      mockActivityTypeRepo.findOne.mockResolvedValue(mockActivityType);
      mockUserRoleAssignmentRepo.findOne.mockResolvedValue(mockUserRoleAssignment);

      const result = await service.canUserSubmitActivityType(userId, activityTypeId);

      expect(result).toBe(true);
      expect(mockUserRoleAssignmentRepo.findOne).toHaveBeenCalledWith({
        where: {
          user: { id: userId },
          role: { id: In(['role-789']) },
        },
      });
    });

    it('should return false if user has no matching role assignment', async () => {
      const mockRole = { id: 'role-789', name: 'Pastor' };
      const mockActivityType = {
        id: activityTypeId,
        name: 'Test Activity',
        allowed_roles: [mockRole],
      };

      mockActivityTypeRepo.findOne.mockResolvedValue(mockActivityType);
      mockUserRoleAssignmentRepo.findOne.mockResolvedValue(null);

      const result = await service.canUserSubmitActivityType(userId, activityTypeId);

      expect(result).toBe(false);
    });

    it('should return true if user has at least one matching role among multiple allowed roles', async () => {
      const mockRoles = [
        { id: 'role-789', name: 'Pastor' },
        { id: 'role-456', name: 'Minister' },
      ];
      const mockActivityType = {
        id: activityTypeId,
        name: 'Test Activity',
        allowed_roles: mockRoles,
      };
      const mockUserRoleAssignment = {
        id: 'assignment-123',
        user: { id: userId },
        role: mockRoles[1],
      };

      mockActivityTypeRepo.findOne.mockResolvedValue(mockActivityType);
      mockUserRoleAssignmentRepo.findOne.mockResolvedValue(mockUserRoleAssignment);

      const result = await service.canUserSubmitActivityType(userId, activityTypeId);

      expect(result).toBe(true);
      expect(mockUserRoleAssignmentRepo.findOne).toHaveBeenCalledWith({
        where: {
          user: { id: userId },
          role: { id: In(['role-789', 'role-456']) },
        },
      });
    });
  });

  describe('create', () => {
    const userId = 'user-123';
    const activityTypeId = 'activity-type-456';
    const createActivityDto: CreateActivityDto = {
      activityTypeId,
      activityDate: '2023-12-01',
      description: 'Test activity',
      hasExpense: false,
    };

    it('should throw BadRequestException if activity type does not exist', async () => {
      mockActivityTypeRepo.findOne.mockResolvedValue(null);

      await expect(service.create(createActivityDto, userId)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user is not authorized', async () => {
      const mockActivityType = {
        id: activityTypeId,
        name: 'Test Activity',
        allowed_roles: [{ id: 'role-789', name: 'Pastor' }],
      };

      // Mock ensureTypeOrThrow to pass
      mockActivityTypeRepo.findOne
        .mockResolvedValueOnce(mockActivityType) // First call for ensureTypeOrThrow
        .mockResolvedValueOnce(mockActivityType); // Second call for canUserSubmitActivityType

      // Mock authorization check to fail
      mockUserRoleAssignmentRepo.findOne.mockResolvedValue(null);

      await expect(service.create(createActivityDto, userId)).rejects.toThrow(
        new ForbiddenException('You are not authorized to submit this activity type'),
      );
    });

    it('should create activity successfully when user is authorized', async () => {
      const mockActivityType = {
        id: activityTypeId,
        name: 'Test Activity',
        allowed_roles: [{ id: 'role-789', name: 'Pastor' }],
      };
      const mockUserRoleAssignment = {
        id: 'assignment-123',
        user: { id: userId },
        role: { id: 'role-789', name: 'Pastor' },
      };
      const mockCreatedActivity = {
        id: 'activity-123',
        ...createActivityDto,
        userId,
      };

      // Mock ensureTypeOrThrow to pass
      mockActivityTypeRepo.findOne
        .mockResolvedValueOnce(mockActivityType) // First call for ensureTypeOrThrow
        .mockResolvedValueOnce(mockActivityType); // Second call for canUserSubmitActivityType

      // Mock authorization check to pass
      mockUserRoleAssignmentRepo.findOne.mockResolvedValue(mockUserRoleAssignment);

      // Mock activity creation
      mockActivityRepo.create.mockReturnValue(mockCreatedActivity);
      mockActivityRepo.save.mockResolvedValue(mockCreatedActivity);

      const result = await service.create(createActivityDto, userId);

      expect(result).toEqual(mockCreatedActivity);
      expect(mockActivityRepo.create).toHaveBeenCalled();
      expect(mockActivityRepo.save).toHaveBeenCalled();
    });

    it('should create activity for user with multiple roles when at least one matches', async () => {
      const mockActivityType = {
        id: activityTypeId,
        name: 'Test Activity',
        allowed_roles: [
          { id: 'role-789', name: 'Pastor' },
          { id: 'role-456', name: 'Minister' },
        ],
      };
      const mockUserRoleAssignment = {
        id: 'assignment-123',
        user: { id: userId },
        role: { id: 'role-456', name: 'Minister' },
      };
      const mockCreatedActivity = {
        id: 'activity-123',
        ...createActivityDto,
        userId,
      };

      mockActivityTypeRepo.findOne
        .mockResolvedValueOnce(mockActivityType)
        .mockResolvedValueOnce(mockActivityType);
      mockUserRoleAssignmentRepo.findOne.mockResolvedValue(mockUserRoleAssignment);
      mockActivityRepo.create.mockReturnValue(mockCreatedActivity);
      mockActivityRepo.save.mockResolvedValue(mockCreatedActivity);

      const result = await service.create(createActivityDto, userId);

      expect(result).toEqual(mockCreatedActivity);
    });
  });
});

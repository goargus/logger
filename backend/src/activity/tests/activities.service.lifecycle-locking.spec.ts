import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { ActivitiesService } from '../activities.service';
import { Activity } from '../activity.entity';
import { ActivityType } from '../../activities-type/activity-type.entity';
import { ReportingPeriod } from '../../reporting-periods/reporting-period.entity';
import { UserRoleAssignment } from '../../roles/user-role-assignment.entity';
import { ActivityStatus } from '../activity-status.enum';
import { ReportingPeriodStatus } from '../../reporting-periods/reporting-period-status.enum';
import { CreateActivityDto } from '../dto/create-activity.dto';
import { UpdateActivityDto } from '../dto/update-activity.dto';

describe('ActivitiesService - Lifecycle Locking', () => {
  let service: ActivitiesService;
  let activityRepo: jest.Mocked<Repository<Activity>>;
  let activityTypeRepo: jest.Mocked<Repository<ActivityType>>;
  let reportingPeriodRepo: jest.Mocked<Repository<ReportingPeriod>>;
  let userRoleAssignmentRepo: jest.Mocked<Repository<UserRoleAssignment>>;

  const mockActivity: Activity = {
    id: 'activity-id',
    activityTypeId: 'type-id',
    activityDate: '2024-01-15',
    description: 'Test activity',
    hasExpense: false,
    expenseAmount: null,
    userId: 'user-id',
    reportingPeriodId: 'period-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-id',
    updatedBy: 'user-id',
    status: ActivityStatus.ACTIVE,
    archivedAt: null,
    archivedBy: null,
  } as Activity;

  const mockActivityType: ActivityType = {
    id: 'type-id',
    name: 'Test Type',
    description: 'Test activity type',
  } as ActivityType;

  const mockActivePeriod: ReportingPeriod = {
    id: 'period-id',
    entityId: 'entity-id',
    entity: {} as any,
    termId: 'term-id',
    term: {} as any,
    name: 'January 2024',
    description: 'January reporting period',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    status: ReportingPeriodStatus.ACTIVE,
    isLocked: false,
    containsDate: jest.fn().mockReturnValue(true),
    activities: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin-id',
    updatedBy: 'admin-id',
  } as ReportingPeriod;

  const mockLockedPeriod: ReportingPeriod = {
    ...mockActivePeriod,
    id: 'locked-period-id',
    status: ReportingPeriodStatus.LOCKED,
    isLocked: true,
  } as ReportingPeriod;

  beforeEach(async () => {
    const mockActivityRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockActivityTypeRepo = {
      findOne: jest.fn(),
    };

    const mockExceptionRepo = {
      findOne: jest.fn(),
    };

    const mockReportingPeriodRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      manager: {
        getRepository: jest.fn().mockReturnValue(mockExceptionRepo),
      },
    };

    const mockUserRoleAssignmentRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

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
          provide: getRepositoryToken(ReportingPeriod),
          useValue: mockReportingPeriodRepo,
        },
        {
          provide: getRepositoryToken(UserRoleAssignment),
          useValue: mockUserRoleAssignmentRepo,
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    activityRepo = module.get(getRepositoryToken(Activity));
    activityTypeRepo = module.get(getRepositoryToken(ActivityType));
    reportingPeriodRepo = module.get(getRepositoryToken(ReportingPeriod));
    userRoleAssignmentRepo = module.get(getRepositoryToken(UserRoleAssignment));
  });

  describe('create', () => {
    it('should create activity when reporting period is active', async () => {
      const createDto: CreateActivityDto = {
        activityTypeId: 'type-id',
        activityDate: '2024-01-15',
        description: 'Test activity',
        hasExpense: false,
        expenseAmount: undefined,
      };

      activityTypeRepo.findOne.mockResolvedValue(mockActivityType);
      reportingPeriodRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockActivePeriod),
      } as any);
      activityRepo.create.mockReturnValue(mockActivity);
      activityRepo.save.mockResolvedValue(mockActivity);

      const result = await service.create(createDto, 'user-id');

      expect(result).toEqual(mockActivity);
      expect(activityRepo.create).toHaveBeenCalledWith({
        activityTypeId: 'type-id',
        activityDate: '2024-01-15',
        description: 'Test activity',
        hasExpense: false,
        expenseAmount: null,
        reportingPeriodId: 'period-id',
        userId: 'user-id',
        createdBy: 'user-id',
        updatedBy: 'user-id',
        status: ActivityStatus.ACTIVE,
      });
    });

    it('should throw ForbiddenException when creating activity in locked period', async () => {
      const createDto: CreateActivityDto = {
        activityTypeId: 'type-id',
        activityDate: '2024-01-15',
        description: 'Test activity',
        hasExpense: false,
        expenseAmount: undefined,
      };

      activityTypeRepo.findOne.mockResolvedValue(mockActivityType);
      reportingPeriodRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockLockedPeriod),
      } as any);

      const mockExceptionRepo = (reportingPeriodRepo.manager as any).getRepository();
      mockExceptionRepo.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, 'user-id')).rejects.toThrow(
        new ForbiddenException('Cannot create activity in a locked reporting period'),
      );
    });

    it('should create activity when no reporting period exists for date', async () => {
      const createDto: CreateActivityDto = {
        activityTypeId: 'type-id',
        activityDate: '2024-01-15',
        description: 'Test activity',
        hasExpense: false,
        expenseAmount: undefined,
      };

      activityTypeRepo.findOne.mockResolvedValue(mockActivityType);
      reportingPeriodRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      } as any);
      activityRepo.create.mockReturnValue({ ...mockActivity, reportingPeriodId: null });
      activityRepo.save.mockResolvedValue({ ...mockActivity, reportingPeriodId: null });

      const result = await service.create(createDto, 'user-id');

      expect(result).toEqual({ ...mockActivity, reportingPeriodId: null });
    });
  });

  describe('updateMine', () => {
    it('should update activity when reporting period is active', async () => {
      const updateDto: UpdateActivityDto = {
        description: 'Updated description',
      };

      activityRepo.findOne.mockResolvedValue(mockActivity);
      reportingPeriodRepo.findOne.mockResolvedValue(mockActivePeriod);
      activityRepo.save.mockResolvedValue({ ...mockActivity, description: 'Updated description' });

      const result = await service.updateMine('activity-id', updateDto, 'user-id');

      expect(result.description).toBe('Updated description');
    });

    it('should throw ForbiddenException when updating activity in locked period', async () => {
      const updateDto: UpdateActivityDto = {
        description: 'Updated description',
      };

      const activityInLockedPeriod = { ...mockActivity, reportingPeriodId: 'locked-period-id' };
      activityRepo.findOne.mockResolvedValue(activityInLockedPeriod);
      reportingPeriodRepo.findOne.mockResolvedValue(mockLockedPeriod);

      const mockExceptionRepo = (reportingPeriodRepo.manager as any).getRepository();
      mockExceptionRepo.findOne.mockResolvedValue(null);

      await expect(service.updateMine('activity-id', updateDto, 'user-id')).rejects.toThrow(
        new ForbiddenException('This activity is locked because its reporting period has ended'),
      );
    });

    it('should throw ForbiddenException when moving activity to locked period', async () => {
      const updateDto: UpdateActivityDto = {
        activityDate: '2024-02-15', // Different date that falls in locked period
      };

      activityRepo.findOne.mockResolvedValue(mockActivity);
      reportingPeriodRepo.findOne.mockResolvedValue(mockActivePeriod); // Current period is active
      reportingPeriodRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockLockedPeriod), // New period is locked
      } as any);

      const mockExceptionRepo = (reportingPeriodRepo.manager as any).getRepository();
      mockExceptionRepo.findOne.mockResolvedValue(null);

      await expect(service.updateMine('activity-id', updateDto, 'user-id')).rejects.toThrow(
        new ForbiddenException('Cannot move activity to a locked reporting period'),
      );
    });

    it('should update activity date and reporting period when moving to active period', async () => {
      const updateDto: UpdateActivityDto = {
        activityDate: '2024-02-15',
      };

      const newActivePeriod = { ...mockActivePeriod, id: 'new-period-id' };
      activityRepo.findOne.mockResolvedValue(mockActivity);
      reportingPeriodRepo.findOne.mockResolvedValue(mockActivePeriod);
      reportingPeriodRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(newActivePeriod),
      } as any);
      activityRepo.save.mockResolvedValue({
        ...mockActivity,
        activityDate: '2024-02-15',
        reportingPeriodId: 'new-period-id',
      });

      const result = await service.updateMine('activity-id', updateDto, 'user-id');

      expect(result.activityDate).toBe('2024-02-15');
      expect(result.reportingPeriodId).toBe('new-period-id');
    });
  });

  describe('archiveMine', () => {
    it('should archive activity when reporting period is active', async () => {
      activityRepo.findOne.mockResolvedValue(mockActivity);
      reportingPeriodRepo.findOne.mockResolvedValue(mockActivePeriod);
      activityRepo.save.mockResolvedValue({
        ...mockActivity,
        status: ActivityStatus.ARCHIVED,
        archivedAt: expect.any(Date),
        archivedBy: 'user-id',
      });

      await service.archiveMine('activity-id', 'user-id');

      expect(activityRepo.save).toHaveBeenCalledWith({
        ...mockActivity,
        status: ActivityStatus.ARCHIVED,
        archivedAt: expect.any(Date),
        archivedBy: 'user-id',
        updatedBy: 'user-id',
      });
    });

    it('should throw ForbiddenException when archiving activity in locked period', async () => {
      const activityInLockedPeriod = { ...mockActivity, reportingPeriodId: 'locked-period-id' };
      activityRepo.findOne.mockResolvedValue(activityInLockedPeriod);
      reportingPeriodRepo.findOne.mockResolvedValue(mockLockedPeriod);

      const mockExceptionRepo = (reportingPeriodRepo.manager as any).getRepository();
      mockExceptionRepo.findOne.mockResolvedValue(null);

      await expect(service.archiveMine('activity-id', 'user-id')).rejects.toThrow(
        new ForbiddenException('This activity is locked because its reporting period has ended'),
      );
    });

    it('should archive activity when no reporting period is assigned', async () => {
      const activityWithoutPeriod = { ...mockActivity, reportingPeriodId: null };
      activityRepo.findOne.mockResolvedValue(activityWithoutPeriod);

      await service.archiveMine('activity-id', 'user-id');

      expect(activityRepo.save).toHaveBeenCalledWith({
        ...activityWithoutPeriod,
        status: ActivityStatus.ARCHIVED,
        archivedAt: expect.any(Date),
        archivedBy: 'user-id',
        updatedBy: 'user-id',
      });
    });
  });

  describe('ensureOwnershipOrThrow', () => {
    it('should throw UnauthorizedException when user does not own activity', async () => {
      const activityOwnedByOther = { ...mockActivity, userId: 'other-user-id' };
      expect(() => {
        (service as any).ensureOwnershipOrThrow(activityOwnedByOther, 'user-id');
      }).toThrow();
    });

    it('should not throw when user owns activity', () => {
      expect(() => {
        (service as any).ensureOwnershipOrThrow(mockActivity, 'user-id');
      }).not.toThrow();
    });
  });
});

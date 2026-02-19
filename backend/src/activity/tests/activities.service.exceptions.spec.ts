import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { ActivitiesService } from '../activities.service';
import { Activity } from '../activity.entity';
import { ActivityType } from '../../activities-type/activity-type.entity';
import { ReportingPeriod } from '../../reporting-periods/reporting-period.entity';
import { UserRoleAssignment } from '../../roles/user-role-assignment.entity';
import { ActivityStatus } from '../activity-status.enum';
import { ReportingPeriodStatus } from '../../reporting-periods/reporting-period-status.enum';
import { CreateActivityDto } from '../dto/create-activity.dto';
import { UpdateActivityDto } from '../dto/update-activity.dto';
import { ReportingPeriodException } from '../../reporting-periods/reporting-period-exception.entity';

describe('ActivitiesService - Exception Handling', () => {
  let service: ActivitiesService;
  let activityRepo: jest.Mocked<Repository<Activity>>;
  let activityTypeRepo: jest.Mocked<Repository<ActivityType>>;
  let reportingPeriodRepo: jest.Mocked<Repository<ReportingPeriod>>;
  let userRoleAssignmentRepo: jest.Mocked<Repository<UserRoleAssignment>>;
  let exceptionRepo: jest.Mocked<Repository<ReportingPeriodException>>;

  const mockActivity: Activity = {
    id: 'activity-id',
    activityTypeId: 'type-id',
    activityDate: '2024-01-03',
    description: 'Test activity',
    hasExpense: false,
    expenseAmount: null,
    userId: 'user-id',
    reportingPeriodId: 'locked-period-id',
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

  const mockLockedPeriod: ReportingPeriod = {
    id: 'locked-period-id',
    entityId: 'entity-id',
    entity: {} as any,
    name: 'January 2024',
    description: 'Locked period',
    startDate: '2024-01-01',
    endDate: '2024-01-14',
    status: ReportingPeriodStatus.LOCKED,
    isLocked: true,
    containsDate: jest.fn().mockReturnValue(true),
    activities: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin-id',
    updatedBy: 'admin-id',
  } as ReportingPeriod;

  const mockException = {
    id: 'exception-id',
    userId: 'user-id',
    reportingPeriodId: 'locked-period-id',
    startDate: '2024-01-01',
    endDate: '2024-01-05',
    reason: 'Late submission approved',
    grantedBy: 'admin-id',
    grantedAt: new Date(),
  };

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

    const mockReportingPeriodRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockUserRoleAssignmentRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const mockExceptionRepo = {
      findOne: jest.fn(),
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
        {
          provide: getRepositoryToken(ReportingPeriodException),
          useValue: mockExceptionRepo,
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    activityRepo = module.get(getRepositoryToken(Activity));
    activityTypeRepo = module.get(getRepositoryToken(ActivityType));
    reportingPeriodRepo = module.get(getRepositoryToken(ReportingPeriod));
    userRoleAssignmentRepo = module.get(getRepositoryToken(UserRoleAssignment));
    exceptionRepo = module.get(getRepositoryToken(ReportingPeriodException));
  });

  describe('create with exception', () => {
    it('should allow creating activity in locked period when user has exception for the date', async () => {
      const createDto: CreateActivityDto = {
        activityTypeId: 'type-id',
        activityDate: '2024-01-03', // Within exception range (2024-01-01 to 2024-01-05)
        description: 'Late submission',
        hasExpense: false,
        expenseAmount: undefined,
      };

      activityTypeRepo.findOne.mockResolvedValue(mockActivityType);
      userRoleAssignmentRepo.findOne.mockResolvedValue({ id: 'assignment-id' } as any);
      reportingPeriodRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockLockedPeriod),
      } as any);

      exceptionRepo.findOne.mockResolvedValue(mockException);

      activityRepo.create.mockReturnValue(mockActivity);
      activityRepo.save.mockResolvedValue(mockActivity);

      const result = await service.create(createDto, 'user-id');

      expect(result).toEqual(mockActivity);
      expect(activityRepo.save).toHaveBeenCalled();
      expect(exceptionRepo.findOne).toHaveBeenCalledWith({
        where: {
          userId: 'user-id',
          reportingPeriodId: 'locked-period-id',
        },
      });
    });

    it('should block creating activity when date is outside exception range', async () => {
      const createDto: CreateActivityDto = {
        activityTypeId: 'type-id',
        activityDate: '2024-01-10', // Outside exception range (2024-01-01 to 2024-01-05)
        description: 'Late submission',
        hasExpense: false,
        expenseAmount: undefined,
      };

      activityTypeRepo.findOne.mockResolvedValue(mockActivityType);
      userRoleAssignmentRepo.findOne.mockResolvedValue({ id: 'assignment-id' } as any);
      reportingPeriodRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockLockedPeriod),
      } as any);

      exceptionRepo.findOne.mockResolvedValue(mockException);

      await expect(service.create(createDto, 'user-id')).rejects.toThrow(
        new ForbiddenException('Cannot create activity in a locked reporting period'),
      );

      expect(activityRepo.save).not.toHaveBeenCalled();
    });

    it('should allow creating activity at exception start boundary', async () => {
      const createDto: CreateActivityDto = {
        activityTypeId: 'type-id',
        activityDate: '2024-01-01',
        description: 'At start boundary',
        hasExpense: false,
        expenseAmount: undefined,
      };

      activityTypeRepo.findOne.mockResolvedValue(mockActivityType);
      userRoleAssignmentRepo.findOne.mockResolvedValue({ id: 'assignment-id' } as any);
      reportingPeriodRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockLockedPeriod),
      } as any);

      exceptionRepo.findOne.mockResolvedValue(mockException);
      activityRepo.create.mockReturnValue(mockActivity);
      activityRepo.save.mockResolvedValue(mockActivity);

      await expect(service.create(createDto, 'user-id')).resolves.toBeDefined();
    });

    it('should allow creating activity at exception end boundary', async () => {
      const createDto: CreateActivityDto = {
        activityTypeId: 'type-id',
        activityDate: '2024-01-05',
        description: 'At end boundary',
        hasExpense: false,
        expenseAmount: undefined,
      };

      activityTypeRepo.findOne.mockResolvedValue(mockActivityType);
      userRoleAssignmentRepo.findOne.mockResolvedValue({ id: 'assignment-id' } as any);
      reportingPeriodRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockLockedPeriod),
      } as any);

      exceptionRepo.findOne.mockResolvedValue(mockException);
      activityRepo.create.mockReturnValue(mockActivity);
      activityRepo.save.mockResolvedValue(mockActivity);

      await expect(service.create(createDto, 'user-id')).resolves.toBeDefined();
    });
  });

  describe('updateMine with exception', () => {
    it('should allow updating activity in locked period when user has exception for the date', async () => {
      const updateDto: UpdateActivityDto = {
        description: 'Updated description',
      };

      const activityInRange = { ...mockActivity, activityDate: '2024-01-03' };
      activityRepo.findOne.mockResolvedValue(activityInRange);
      reportingPeriodRepo.findOne.mockResolvedValue(mockLockedPeriod);
      exceptionRepo.findOne.mockResolvedValue(mockException);
      activityRepo.save.mockResolvedValue({ ...activityInRange, description: 'Updated' });

      const result = await service.updateMine('activity-id', updateDto, 'user-id');

      expect(result).toBeDefined();
      expect(activityRepo.save).toHaveBeenCalled();
    });

    it('should block updating activity when activity date is outside exception range', async () => {
      const updateDto: UpdateActivityDto = {
        description: 'Updated description',
      };

      const activityOutsideRange = { ...mockActivity, activityDate: '2024-01-10' };
      activityRepo.findOne.mockResolvedValue(activityOutsideRange);
      reportingPeriodRepo.findOne.mockResolvedValue(mockLockedPeriod);
      exceptionRepo.findOne.mockResolvedValue(mockException);

      await expect(service.updateMine('activity-id', updateDto, 'user-id')).rejects.toThrow(
        new ForbiddenException('This activity is locked because its reporting period has ended'),
      );
    });

    it('should allow moving activity to date within exception range', async () => {
      const updateDto: UpdateActivityDto = {
        activityDate: '2024-01-04',
      };

      activityRepo.findOne.mockResolvedValue(mockActivity);
      reportingPeriodRepo.findOne.mockResolvedValue(mockLockedPeriod);
      reportingPeriodRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockLockedPeriod),
      } as any);

      exceptionRepo.findOne.mockResolvedValue(mockException);
      activityRepo.save.mockResolvedValue({ ...mockActivity, activityDate: '2024-01-04' });

      const result = await service.updateMine('activity-id', updateDto, 'user-id');

      expect(result).toBeDefined();
      expect(activityRepo.save).toHaveBeenCalled();
    });

    it('should block moving activity to date outside exception range', async () => {
      const updateDto: UpdateActivityDto = {
        activityDate: '2024-01-10',
      };

      activityRepo.findOne.mockResolvedValue(mockActivity);
      reportingPeriodRepo.findOne.mockResolvedValue(mockLockedPeriod);
      reportingPeriodRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockLockedPeriod),
      } as any);

      exceptionRepo.findOne.mockResolvedValue(mockException);

      await expect(service.updateMine('activity-id', updateDto, 'user-id')).rejects.toThrow(
        new ForbiddenException('Cannot move activity to a locked reporting period'),
      );
    });
  });

  describe('archiveMine with exception', () => {
    it('should allow archiving activity in locked period when user has exception for the date', async () => {
      const activityInRange = { ...mockActivity, activityDate: '2024-01-03' };
      activityRepo.findOne.mockResolvedValue(activityInRange);
      reportingPeriodRepo.findOne.mockResolvedValue(mockLockedPeriod);
      exceptionRepo.findOne.mockResolvedValue(mockException);
      activityRepo.save.mockResolvedValue({ ...activityInRange, status: ActivityStatus.ARCHIVED });

      await service.archiveMine('activity-id', 'user-id');

      expect(activityRepo.save).toHaveBeenCalled();
    });

    it('should block archiving activity when activity date is outside exception range', async () => {
      const activityOutsideRange = { ...mockActivity, activityDate: '2024-01-10' };
      activityRepo.findOne.mockResolvedValue(activityOutsideRange);
      reportingPeriodRepo.findOne.mockResolvedValue(mockLockedPeriod);
      exceptionRepo.findOne.mockResolvedValue(mockException);

      await expect(service.archiveMine('activity-id', 'user-id')).rejects.toThrow(
        new ForbiddenException('This activity is locked because its reporting period has ended'),
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActivitiesController } from '../activities.controller';
import { ActivitiesService } from '../activities.service';
import { IdentityResolutionService } from '../../auth/identity-resolution.service';
import { ReportingPeriodsService } from '../../reporting-periods/reporting-periods.service';
import { Activity } from '../activity.entity';
import { ActivityType } from '../../activities-type/activity-type.entity';
import { ReportingPeriod } from '../../reporting-periods/reporting-period.entity';
import { User } from '../../users/user.entity';
import { ActivityStatus } from '../activity-status.enum';
import { ReportingPeriodStatus } from '../../reporting-periods/reporting-period-status.enum';

describe('ActivitiesController - Locked Indicator', () => {
  let controller: ActivitiesController;
  let activitiesService: jest.Mocked<ActivitiesService>;
  let reportingPeriodsService: jest.Mocked<ReportingPeriodsService>;
  let identityService: jest.Mocked<IdentityResolutionService>;
  let usersRepo: jest.Mocked<Repository<User>>;
  let typesRepo: jest.Mocked<Repository<ActivityType>>;
  let periodsRepo: jest.Mocked<Repository<ReportingPeriod>>;

  const mockUser = {
    id: 'user-id',
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockActivity: Activity = {
    id: 'activity-id',
    activityTypeId: 'type-id',
    activityDate: '2024-01-10',
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
    description: 'Active period',
    startDate: '2024-01-01',
    endDate: '2024-01-14',
    status: ReportingPeriodStatus.ACTIVE,
    isLocked: false,
    containsDate: jest.fn(),
    activities: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin-id',
    updatedBy: 'admin-id',
  } as ReportingPeriod;

  const mockLockedPeriod: ReportingPeriod = {
    ...mockActivePeriod,
    status: ReportingPeriodStatus.LOCKED,
    isLocked: true,
  } as ReportingPeriod;

  beforeEach(async () => {
    const mockActivitiesService = {
      create: jest.fn(),
      findMine: jest.fn(),
      findOneMine: jest.fn(),
      updateMine: jest.fn(),
    };

    const mockReportingPeriodsService = {
      hasUserExceptionForDate: jest.fn(),
    };

    const mockIdentityService = {
      resolveUserBySubAndIssuer: jest.fn(),
    };

    const mockUsersRepo = {
      findOneByOrFail: jest.fn(),
    };

    const mockTypesRepo = {
      findOneByOrFail: jest.fn(),
      find: jest.fn(),
    };

    const mockPeriodsRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitiesController],
      providers: [
        {
          provide: ActivitiesService,
          useValue: mockActivitiesService,
        },
        {
          provide: ReportingPeriodsService,
          useValue: mockReportingPeriodsService,
        },
        {
          provide: IdentityResolutionService,
          useValue: mockIdentityService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepo,
        },
        {
          provide: getRepositoryToken(ActivityType),
          useValue: mockTypesRepo,
        },
        {
          provide: getRepositoryToken(ReportingPeriod),
          useValue: mockPeriodsRepo,
        },
      ],
    }).compile();

    controller = module.get<ActivitiesController>(ActivitiesController);
    activitiesService = module.get(ActivitiesService);
    reportingPeriodsService = module.get(ReportingPeriodsService);
    identityService = module.get(IdentityResolutionService);
    usersRepo = module.get(getRepositoryToken(User));
    typesRepo = module.get(getRepositoryToken(ActivityType));
    periodsRepo = module.get(getRepositoryToken(ReportingPeriod));
  });

  describe('create - locked indicator', () => {
    it('should return locked: false when period is active', async () => {
      const mockRequest = {
        user: { sub: 'auth0|123', iss: 'https://test.auth0.com/' },
      } as any;

      const createDto = {
        activityTypeId: 'type-id',
        activityDate: '2024-01-10',
        hasExpense: false,
      };

      identityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser as any);
      activitiesService.create.mockResolvedValue(mockActivity);
      usersRepo.findOneByOrFail.mockResolvedValue(mockUser as any);
      typesRepo.findOneByOrFail.mockResolvedValue(mockActivityType);
      periodsRepo.findOne.mockResolvedValue(mockActivePeriod);

      const result = await controller.create(mockRequest, createDto as any);

      expect(result.locked).toBe(false);
      expect(reportingPeriodsService.hasUserExceptionForDate).not.toHaveBeenCalled();
    });

    it('should return locked: true when period is locked and user has no exception', async () => {
      const mockRequest = {
        user: { sub: 'auth0|123', iss: 'https://test.auth0.com/' },
      } as any;

      const createDto = {
        activityTypeId: 'type-id',
        activityDate: '2024-01-10',
        hasExpense: false,
      };

      identityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser as any);
      activitiesService.create.mockResolvedValue(mockActivity);
      usersRepo.findOneByOrFail.mockResolvedValue(mockUser as any);
      typesRepo.findOneByOrFail.mockResolvedValue(mockActivityType);
      periodsRepo.findOne.mockResolvedValue(mockLockedPeriod);
      reportingPeriodsService.hasUserExceptionForDate.mockResolvedValue(false);

      const result = await controller.create(mockRequest, createDto as any);

      expect(result.locked).toBe(true);
      expect(reportingPeriodsService.hasUserExceptionForDate).toHaveBeenCalledWith(
        'user-id',
        'period-id',
        '2024-01-10',
      );
    });

    it('should return locked: false when period is locked but user has exception for the date', async () => {
      const mockRequest = {
        user: { sub: 'auth0|123', iss: 'https://test.auth0.com/' },
      } as any;

      const createDto = {
        activityTypeId: 'type-id',
        activityDate: '2024-01-10',
        hasExpense: false,
      };

      identityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser as any);
      activitiesService.create.mockResolvedValue(mockActivity);
      usersRepo.findOneByOrFail.mockResolvedValue(mockUser as any);
      typesRepo.findOneByOrFail.mockResolvedValue(mockActivityType);
      periodsRepo.findOne.mockResolvedValue(mockLockedPeriod);
      reportingPeriodsService.hasUserExceptionForDate.mockResolvedValue(true);

      const result = await controller.create(mockRequest, createDto as any);

      expect(result.locked).toBe(false);
      expect(reportingPeriodsService.hasUserExceptionForDate).toHaveBeenCalledWith(
        'user-id',
        'period-id',
        '2024-01-10',
      );
    });

    it('should return locked: false when activity has no reporting period', async () => {
      const mockRequest = {
        user: { sub: 'auth0|123', iss: 'https://test.auth0.com/' },
      } as any;

      const createDto = {
        activityTypeId: 'type-id',
        activityDate: '2024-01-10',
        hasExpense: false,
      };

      const activityWithoutPeriod = { ...mockActivity, reportingPeriodId: null };

      identityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser as any);
      activitiesService.create.mockResolvedValue(activityWithoutPeriod);
      usersRepo.findOneByOrFail.mockResolvedValue(mockUser as any);
      typesRepo.findOneByOrFail.mockResolvedValue(mockActivityType);
      periodsRepo.findOne.mockResolvedValue(null);

      const result = await controller.create(mockRequest, createDto as any);

      expect(result.locked).toBe(false);
      expect(reportingPeriodsService.hasUserExceptionForDate).not.toHaveBeenCalled();
    });
  });

  describe('getOne - locked indicator', () => {
    it('should return locked: false when period is active', async () => {
      const mockRequest = {
        user: { sub: 'auth0|123', iss: 'https://test.auth0.com/' },
      } as any;

      identityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser as any);
      activitiesService.findOneMine.mockResolvedValue(mockActivity);
      usersRepo.findOneByOrFail.mockResolvedValue(mockUser as any);
      typesRepo.findOneByOrFail.mockResolvedValue(mockActivityType);
      periodsRepo.findOne.mockResolvedValue(mockActivePeriod);

      const result = await controller.getOne(mockRequest, 'activity-id');

      expect(result.locked).toBe(false);
    });

    it('should return locked: true when period is locked and user has no exception', async () => {
      const mockRequest = {
        user: { sub: 'auth0|123', iss: 'https://test.auth0.com/' },
      } as any;

      identityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser as any);
      activitiesService.findOneMine.mockResolvedValue(mockActivity);
      usersRepo.findOneByOrFail.mockResolvedValue(mockUser as any);
      typesRepo.findOneByOrFail.mockResolvedValue(mockActivityType);
      periodsRepo.findOne.mockResolvedValue(mockLockedPeriod);
      reportingPeriodsService.hasUserExceptionForDate.mockResolvedValue(false);

      const result = await controller.getOne(mockRequest, 'activity-id');

      expect(result.locked).toBe(true);
    });

    it('should return locked: false when user has exception covering the activity date', async () => {
      const mockRequest = {
        user: { sub: 'auth0|123', iss: 'https://test.auth0.com/' },
      } as any;

      identityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser as any);
      activitiesService.findOneMine.mockResolvedValue(mockActivity);
      usersRepo.findOneByOrFail.mockResolvedValue(mockUser as any);
      typesRepo.findOneByOrFail.mockResolvedValue(mockActivityType);
      periodsRepo.findOne.mockResolvedValue(mockLockedPeriod);
      reportingPeriodsService.hasUserExceptionForDate.mockResolvedValue(true);

      const result = await controller.getOne(mockRequest, 'activity-id');

      expect(result.locked).toBe(false);
    });
  });

  describe('findMine - locked indicator', () => {
    it('should calculate locked status for each activity individually', async () => {
      const mockRequest = {
        user: { sub: 'auth0|123', iss: 'https://test.auth0.com/' },
      } as any;

      const activity1 = { ...mockActivity, id: 'act-1', activityDate: '2024-01-05' };
      const activity2 = { ...mockActivity, id: 'act-2', activityDate: '2024-01-10' };
      const activity3 = { ...mockActivity, id: 'act-3', activityDate: '2024-01-15' };

      identityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser as any);
      activitiesService.findMine.mockResolvedValue([[activity1, activity2, activity3], 3]);
      usersRepo.findOneByOrFail.mockResolvedValue(mockUser as any);
      typesRepo.find.mockResolvedValue([mockActivityType]);
      periodsRepo.find.mockResolvedValue([mockLockedPeriod]);

      // User has exception for Jan 5-10, but not Jan 15
      reportingPeriodsService.hasUserExceptionForDate.mockImplementation(
        async (userId, periodId, date) => {
          if (date === '2024-01-05' || date === '2024-01-10') return true;
          if (date === '2024-01-15') return false;
          return false;
        },
      );

      const result = await controller.findMine(mockRequest, 1, 20);

      expect(result.items).toHaveLength(3);
      expect(result.items[0].locked).toBe(false); // Jan 5 - has exception
      expect(result.items[1].locked).toBe(false); // Jan 10 - has exception
      expect(result.items[2].locked).toBe(true); // Jan 15 - no exception
      expect(reportingPeriodsService.hasUserExceptionForDate).toHaveBeenCalledTimes(3);
    });

    it('should return all locked: false when period is active', async () => {
      const mockRequest = {
        user: { sub: 'auth0|123', iss: 'https://test.auth0.com/' },
      } as any;

      const activity1 = { ...mockActivity, id: 'act-1' };
      const activity2 = { ...mockActivity, id: 'act-2' };

      identityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser as any);
      activitiesService.findMine.mockResolvedValue([[activity1, activity2], 2]);
      usersRepo.findOneByOrFail.mockResolvedValue(mockUser as any);
      typesRepo.find.mockResolvedValue([mockActivityType]);
      periodsRepo.find.mockResolvedValue([mockActivePeriod]);

      const result = await controller.findMine(mockRequest, 1, 20);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].locked).toBe(false);
      expect(result.items[1].locked).toBe(false);
      expect(reportingPeriodsService.hasUserExceptionForDate).not.toHaveBeenCalled();
    });
  });

  describe('update - locked indicator', () => {
    it('should return correct locked status after update', async () => {
      const mockRequest = {
        user: { sub: 'auth0|123', iss: 'https://test.auth0.com/' },
      } as any;

      const updateDto = {
        description: 'Updated description',
      };

      identityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser as any);
      activitiesService.updateMine.mockResolvedValue(mockActivity);
      usersRepo.findOneByOrFail.mockResolvedValue(mockUser as any);
      typesRepo.findOneByOrFail.mockResolvedValue(mockActivityType);
      periodsRepo.findOne.mockResolvedValue(mockLockedPeriod);
      reportingPeriodsService.hasUserExceptionForDate.mockResolvedValue(true);

      const result = await controller.update(mockRequest, 'activity-id', updateDto);

      expect(result.locked).toBe(false);
      expect(reportingPeriodsService.hasUserExceptionForDate).toHaveBeenCalledWith(
        'user-id',
        'period-id',
        '2024-01-10',
      );
    });
  });
});

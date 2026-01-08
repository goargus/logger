import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';
import { Activity } from '../activity/activity.entity';
import { User } from '../users/user.entity';
import { Entity } from '../entities/entity.entity';
import { ReportingPeriod } from '../reporting-periods/reporting-period.entity';
import { ActivityType } from '../activities-type/activity-type.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReportsAccessService } from './access/reports-access.service';
import { ReportsTimeScopeService } from './time/reports-time-scope.service';
import { ReportsActivityQueryFactory } from './query/reports-activity-query.factory';
import { SummaryCalculator } from './calculators/summary.calculator';
import { BreakdownsCalculator } from './calculators/breakdowns.calculator';
import { ComplianceCalculator } from './calculators/compliance.calculator';
import { TrendsCalculator } from './calculators/trends.calculator';
import { ComparisonCalculator } from './calculators/comparison.calculator';
import { RankingsCalculator } from './calculators/rankings.calculator';
import { ExpensesCalculator } from './calculators/expenses.calculator';
import { PeriodBoundaryCalculator } from './time/period-boundary.calculator';
import { BreakdownComparisonCalculator } from './calculators/breakdown-comparison.calculator';
import { HierarchyBreakdownCalculator } from './calculators/hierarchy-breakdown.calculator';
import { CsvExporter } from './export/csv-exporter';
import { PermissionsService } from '../auth/permissions/permissions.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let activityRepo: Repository<Activity>;
  let userRepo: Repository<User>;
  let entityRepo: Repository<Entity>;
  let periodRepo: Repository<ReportingPeriod>;
  let activityTypeRepo: Repository<ActivityType>;
  let accessService: ReportsAccessService;
  let timeScopeService: ReportsTimeScopeService;
  let queryFactory: ReportsActivityQueryFactory;
  let permissionsService: PermissionsService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: ReportsAccessService,
          useValue: {
            getEntityHierarchy: jest.fn().mockResolvedValue(['entity-1']),
            validateEntityInUserScope: jest.fn().mockResolvedValue(true),
            validateUserInScope: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: ReportsTimeScopeService,
          useValue: {
            getOrDetermineTimeScope: jest.fn(),
          },
        },
        {
          provide: ReportsActivityQueryFactory,
          useValue: {
            buildActivityQuery: jest.fn(() => mockQueryBuilder),
          },
        },
        SummaryCalculator,
        BreakdownsCalculator,
        ComplianceCalculator,
        TrendsCalculator,
        ComparisonCalculator,
        RankingsCalculator,
        ExpensesCalculator,
        PeriodBoundaryCalculator,
        BreakdownComparisonCalculator,
        {
          provide: HierarchyBreakdownCalculator,
          useValue: {
            calculate: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: CsvExporter,
          useValue: {
            exportToCsv: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Activity),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            findOne: jest.fn().mockResolvedValue(null),
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
            find: jest.fn().mockResolvedValue([]),
            manager: {
              query: jest.fn().mockResolvedValue([]),
            },
          },
        },
        {
          provide: getRepositoryToken(Entity),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(ReportingPeriod),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
            find: jest.fn().mockResolvedValue([]),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ActivityType),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: PermissionsService,
          useValue: {
            userHasPermission: jest.fn().mockResolvedValue(true),
            getPermissionsForRole: jest.fn().mockResolvedValue([]),
            getEffectivePermissionsForUser: jest.fn().mockResolvedValue(new Map()),
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    activityRepo = module.get<Repository<Activity>>(getRepositoryToken(Activity));
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    entityRepo = module.get<Repository<Entity>>(getRepositoryToken(Entity));
    periodRepo = module.get<Repository<ReportingPeriod>>(getRepositoryToken(ReportingPeriod));
    activityTypeRepo = module.get<Repository<ActivityType>>(getRepositoryToken(ActivityType));
    accessService = module.get<ReportsAccessService>(ReportsAccessService);
    timeScopeService = module.get<ReportsTimeScopeService>(ReportsTimeScopeService);
    queryFactory = module.get<ReportsActivityQueryFactory>(ReportsActivityQueryFactory);
    permissionsService = module.get<PermissionsService>(PermissionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSummary', () => {
    it('should return personal summary for user without canViewReports permission', async () => {
      const mockUser = {
        id: 'user-1',
        entity_id: 'entity-1',
        role: { rolePermissions: [] },
        entity: { id: 'entity-1', name: 'Campo Seattle', type: 'FIELD' },
      };

      const mockPeriod = {
        id: 'period-1',
        startDate: '2024-12-01',
        endDate: '2024-12-14',
        status: 'active',
        entityId: 'entity-1',
      };

      const mockActivities = [
        {
          id: 'activity-1',
          userId: 'user-1',
          expenseAmount: '50.00',
          activityTypeId: 'type-1',
          user: mockUser,
        },
        {
          id: 'activity-2',
          userId: 'user-1',
          expenseAmount: '30.00',
          activityTypeId: 'type-1',
          user: mockUser,
        },
      ];

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(entityRepo, 'findOne').mockResolvedValue(mockUser.entity as any);
      jest.spyOn(permissionsService, 'userHasPermission').mockResolvedValue(false);
      jest.spyOn(timeScopeService, 'getOrDetermineTimeScope').mockResolvedValue({
        periodIds: [mockPeriod.id],
        period: mockPeriod as any,
      });
      mockQueryBuilder.getMany.mockResolvedValue(mockActivities);

      const result = await service.getSummary('user-1', {});

      expect(result.scope).toBe('personal');
      expect(result.totals.activities).toBe(2);
      expect(result.totals.expenses).toBe(80);
      expect(result.totals.usersExpected).toBe(1);
      expect(result.totals.usersSubmitted).toBe(1);
      expect(result.totals.complianceRate).toBe(1);
    });

    it('should return entity summary for user with canViewReports permission', async () => {
      const mockUser = {
        id: 'user-1',
        entity_id: 'entity-1',
        role: { rolePermissions: [] },
        entity: { id: 'entity-1', name: 'Campo Seattle', type: 'FIELD' },
      };

      const mockPeriod = {
        id: 'period-1',
        startDate: '2024-12-01',
        endDate: '2024-12-14',
        status: 'active',
        entityId: 'entity-1',
      };

      const mockActivities = [
        {
          id: 'activity-1',
          userId: 'user-1',
          expenseAmount: '50.00',
          activityTypeId: 'type-1',
          user: { id: 'user-1', entity_id: 'entity-1' },
        },
        {
          id: 'activity-2',
          userId: 'user-2',
          expenseAmount: '30.00',
          activityTypeId: 'type-1',
          user: { id: 'user-2', entity_id: 'entity-1' },
        },
      ];

      const mockUsersInScope = [
        { id: 'user-1', status: 'active' },
        { id: 'user-2', status: 'active' },
        { id: 'user-3', status: 'active' },
      ];

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(entityRepo, 'findOne').mockResolvedValue(mockUser.entity as any);
      jest.spyOn(timeScopeService, 'getOrDetermineTimeScope').mockResolvedValue({
        periodIds: [mockPeriod.id],
        period: mockPeriod as any,
      });
      jest.spyOn(userRepo, 'find').mockResolvedValue(mockUsersInScope as any);
      mockQueryBuilder.getMany.mockResolvedValue(mockActivities);

      const result = await service.getSummary('user-1', {});

      expect(result.scope).toBe('entity');
      expect(result.totals.activities).toBe(2);
      expect(result.totals.expenses).toBe(80);
      expect(result.totals.usersExpected).toBe(3);
      expect(result.totals.usersSubmitted).toBe(2);
      expect(result.totals.complianceRate).toBe(0.67);
    });

    it('should throw ForbiddenException when regular user tries to view entity report', async () => {
      const mockUser = {
        id: 'user-1',
        entity_id: 'entity-1',
        role: { rolePermissions: [] },
        entity: { id: 'entity-1' },
      };

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(permissionsService, 'userHasPermission').mockResolvedValue(false);

      await expect(service.getSummary('user-1', { entityId: 'entity-2' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when user tries to view data outside their scope', async () => {
      const mockUser = {
        id: 'user-1',
        entity_id: 'entity-1',
        role: { rolePermissions: [] },
        entity: { id: 'entity-1' },
      };

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(accessService, 'validateEntityInUserScope').mockResolvedValue(false);

      await expect(service.getSummary('user-1', { entityId: 'entity-2' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getBreakdowns', () => {
    it('should return breakdowns by type, entity, and user', async () => {
      const mockUser = {
        id: 'user-1',
        entity_id: 'entity-1',
        role: { rolePermissions: [] },
        entity: { id: 'entity-1' },
      };

      const mockPeriod = {
        id: 'period-1',
        startDate: '2024-12-01',
        endDate: '2024-12-14',
        status: 'active',
        entityId: 'entity-1',
      };

      const mockActivities = [
        {
          id: 'activity-1',
          userId: 'user-1',
          activityTypeId: 'type-1',
          expenseAmount: '50.00',
          activityType: { name: 'Visitas' },
          user: {
            id: 'user-1',
            entity_id: 'entity-1',
            full_name: 'María García',
            entity: { id: 'entity-1', name: 'Campo Seattle', type: 'FIELD' },
          },
        },
        {
          id: 'activity-2',
          userId: 'user-2',
          activityTypeId: 'type-1',
          expenseAmount: '30.00',
          activityType: { name: 'Visitas' },
          user: {
            id: 'user-2',
            entity_id: 'entity-1',
            full_name: 'Juan Pérez',
            entity: { id: 'entity-1', name: 'Campo Seattle', type: 'FIELD' },
          },
        },
      ];

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(periodRepo, 'findOne').mockResolvedValue(mockPeriod as any);
      jest.spyOn(entityRepo, 'findOne').mockResolvedValue({ id: 'entity-1', children: [] } as any);
      jest.spyOn(entityRepo, 'find').mockResolvedValue([]);
      jest.spyOn(userRepo, 'find').mockResolvedValue([
        { id: 'user-1', status: 'active' },
        { id: 'user-2', status: 'active' },
      ] as any);
      mockQueryBuilder.getMany.mockResolvedValue(mockActivities);

      const result = await service.getBreakdowns('user-1', {});

      expect(result.byType).toHaveLength(1);
      expect(result.byType[0].name).toBe('Visitas');
      expect(result.byType[0].count).toBe(2);
      expect(result.byType[0].expenses).toBe(80);

      expect(result.byEntity).toHaveLength(1);
      expect(result.byEntity[0].name).toBe('Campo Seattle');
      expect(result.byEntity[0].count).toBe(2);

      expect(result.byUser).toHaveLength(2);
    });

    it('should not include entity breakdown for regular users', async () => {
      const mockUser = {
        id: 'user-1',
        entity_id: 'entity-1',
        role: { rolePermissions: [] },
        entity: { id: 'entity-1' },
      };

      const mockPeriod = {
        id: 'period-1',
        startDate: '2024-12-01',
        endDate: '2024-12-14',
        status: 'active',
        entityId: 'entity-1',
      };

      const mockActivities = [
        {
          id: 'activity-1',
          userId: 'user-1',
          activityTypeId: 'type-1',
          expenseAmount: '50.00',
          activityType: { name: 'Visitas' },
          user: {
            id: 'user-1',
            entity_id: 'entity-1',
            full_name: 'María García',
            entity: { id: 'entity-1', name: 'Campo Seattle', type: 'FIELD' },
          },
        },
      ];

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(service as any, 'canViewReports').mockResolvedValue(false);
      jest.spyOn(periodRepo, 'findOne').mockResolvedValue(mockPeriod as any);
      jest.spyOn(permissionsService, 'userHasPermission').mockResolvedValue(false);
      mockQueryBuilder.getMany.mockResolvedValue(mockActivities);

      const result = await service.getBreakdowns('user-1', {});

      expect(result.byEntity).toHaveLength(0);
      expect(result.byUser).toHaveLength(1);
    });
  });

  describe('getCompliance', () => {
    it('should throw ForbiddenException for users without canViewReports', async () => {
      const mockUser = {
        id: 'user-1',
        entity_id: 'entity-1',
        role: { rolePermissions: [] },
      };

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(permissionsService, 'userHasPermission').mockResolvedValue(false);

      await expect(service.getCompliance('user-1', {})).rejects.toThrow(ForbiddenException);
    });

    it('should return submitted and not submitted user lists', async () => {
      const mockUser = {
        id: 'user-1',
        entity_id: 'entity-1',
        role: { rolePermissions: [] },
        entity: { id: 'entity-1' },
      };

      const mockPeriod = {
        id: 'period-1',
        startDate: '2024-12-01',
        endDate: '2024-12-14',
        status: 'active',
        entityId: 'entity-1',
      };

      const mockActivities = [
        {
          id: 'activity-1',
          userId: 'user-1',
          activityDate: '2024-12-10',
          user: { id: 'user-1' },
        },
      ];

      const mockUsersInScope = [
        {
          id: 'user-1',
          full_name: 'María García',
          status: 'active',
          entity: { name: 'Campo Seattle' },
        },
        {
          id: 'user-2',
          full_name: 'Juan Pérez',
          status: 'active',
          entity: { name: 'Campo Seattle' },
        },
      ];

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(entityRepo, 'findOne').mockResolvedValue({ id: 'entity-1', children: [] } as any);
      jest.spyOn(timeScopeService, 'getOrDetermineTimeScope').mockResolvedValue({
        periodIds: [mockPeriod.id],
        period: mockPeriod as any,
      });
      jest.spyOn(userRepo, 'find').mockResolvedValue(mockUsersInScope as any);
      jest
        .spyOn(userRepo.manager, 'query')
        .mockResolvedValue([{ user_id: 'user-2', name: 'Misionero' }]);
      mockQueryBuilder.getMany.mockResolvedValue(mockActivities);

      const result = await service.getCompliance('user-1', {});

      expect(result.submitted).toHaveLength(1);
      expect(result.submitted[0].userId).toBe('user-1');
      expect(result.submitted[0].count).toBe(1);

      expect(result.notSubmitted).toHaveLength(1);
      expect(result.notSubmitted[0].userId).toBe('user-2');
      expect(result.notSubmitted[0].roles).toEqual(['Misionero']);
    });
  });

  describe('getTrends', () => {
    it('should return trends data for last 5 periods', async () => {
      const mockUser = {
        id: 'user-1',
        entity_id: 'entity-1',
        role: { rolePermissions: [] },
        entity: { id: 'entity-1' },
      };

      const mockPeriods = [
        {
          id: 'period-1',
          startDate: '2024-12-01',
          endDate: '2024-12-14',
          entityId: 'entity-1',
        },
        {
          id: 'period-2',
          startDate: '2024-11-17',
          endDate: '2024-11-30',
          entityId: 'entity-1',
        },
      ];

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(periodRepo, 'find').mockResolvedValue(mockPeriods as any);
      jest.spyOn(entityRepo, 'findOne').mockResolvedValue({ id: 'entity-1', children: [] } as any);
      jest.spyOn(entityRepo, 'find').mockResolvedValue([]);
      jest.spyOn(userRepo, 'find').mockResolvedValue([{ id: 'user-1', status: 'active' }] as any);
      mockQueryBuilder.getMany.mockResolvedValue([
        { id: 'activity-1', userId: 'user-1', expenseAmount: '50.00' },
      ]);

      const result = await service.getTrends('user-1', {});

      expect(result.periods).toHaveLength(2);
      expect(result.periods[0].activities).toBe(1);
      expect(result.periods[0].expenses).toBe(50);
    });
  });

  describe('getRankings', () => {
    it('should throw ForbiddenException for users without canViewReports', async () => {
      const mockUser = {
        id: 'user-1',
        entity_id: 'entity-1',
        role: { rolePermissions: [] },
      };

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(permissionsService, 'userHasPermission').mockResolvedValue(false);

      await expect(service.getRankings('user-1', {})).rejects.toThrow(ForbiddenException);
    });

    it('should return top performers, lowest compliance, and inactive users', async () => {
      const mockUser = {
        id: 'user-1',
        entity_id: 'entity-1',
        role: { rolePermissions: [] },
        entity: { id: 'entity-1' },
      };

      const mockPeriod = {
        id: 'period-1',
        startDate: '2024-12-01',
        endDate: '2024-12-14',
        status: 'active',
        entityId: 'entity-1',
      };

      const mockActivities = [
        {
          id: 'activity-1',
          userId: 'user-1',
          expenseAmount: '50.00',
          user: {
            id: 'user-1',
            full_name: 'María García',
            entity: { name: 'Campo Seattle', id: 'entity-1' },
            entity_id: 'entity-1',
          },
        },
      ];

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(periodRepo, 'findOne').mockResolvedValue(mockPeriod as any);
      jest.spyOn(periodRepo, 'find').mockResolvedValue([mockPeriod, mockPeriod, mockPeriod] as any);
      jest.spyOn(entityRepo, 'findOne').mockResolvedValue({ id: 'entity-1', children: [] } as any);
      jest
        .spyOn(entityRepo, 'find')
        .mockResolvedValue([{ id: 'entity-1', name: 'Campo Seattle' }] as any);
      jest.spyOn(userRepo, 'find').mockResolvedValue([
        {
          id: 'user-1',
          status: 'active',
          entity: { name: 'Campo Seattle' },
        },
      ] as any);
      jest.spyOn(activityRepo, 'findOne').mockResolvedValue(null);
      mockQueryBuilder.getMany.mockResolvedValue(mockActivities);

      const result = await service.getRankings('user-1', { limit: 5 });

      expect(result.topPerformers).toBeDefined();
      expect(result.lowestCompliance).toBeDefined();
      expect(result.inactiveUsers).toBeDefined();
    });
  });

  describe('getExpenses', () => {
    it('should return expense breakdown by type, entity, and user', async () => {
      const mockUser = {
        id: 'user-1',
        entity_id: 'entity-1',
        role: { rolePermissions: [] },
        entity: { id: 'entity-1' },
      };

      const mockPeriod = {
        id: 'period-1',
        startDate: '2024-12-01',
        endDate: '2024-12-14',
        status: 'active',
        entityId: 'entity-1',
      };

      const mockActivities = [
        {
          id: 'activity-1',
          userId: 'user-1',
          activityTypeId: 'type-1',
          expenseAmount: '50.00',
          activityType: { name: 'Visitas' },
          user: {
            id: 'user-1',
            entity_id: 'entity-1',
            full_name: 'María García',
            entity: { id: 'entity-1', name: 'Campo Seattle' },
          },
        },
        {
          id: 'activity-2',
          userId: 'user-1',
          activityTypeId: 'type-1',
          expenseAmount: '30.00',
          activityType: { name: 'Visitas' },
          user: {
            id: 'user-1',
            entity_id: 'entity-1',
            full_name: 'María García',
            entity: { id: 'entity-1', name: 'Campo Seattle' },
          },
        },
      ];

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(periodRepo, 'findOne').mockResolvedValue(mockPeriod as any);
      jest.spyOn(entityRepo, 'findOne').mockResolvedValue({ id: 'entity-1', children: [] } as any);
      jest.spyOn(entityRepo, 'find').mockResolvedValue([]);
      mockQueryBuilder.getMany.mockResolvedValue(mockActivities);

      const result = await service.getExpenses('user-1', {});

      expect(result.total).toBe(80);
      expect(result.byType).toHaveLength(1);
      expect(result.byType[0].total).toBe(80);
      expect(result.byType[0].percent).toBe(100);
      expect(result.byType[0].avgPerActivity).toBe(40);

      expect(result.byUser).toHaveLength(1);
      expect(result.byUser[0].total).toBe(80);
      expect(result.byUser[0].percent).toBe(100);
    });
  });
});

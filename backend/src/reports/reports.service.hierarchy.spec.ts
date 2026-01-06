import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';
import { User } from '../users/user.entity';
import { ReportingPeriod } from '../reporting-periods/reporting-period.entity';
import { Activity } from '../activity/activity.entity';
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
import { EntityType } from '../entities/entity.entity';
import { CsvExporter } from './export/csv-exporter';
import { PermissionsService } from '../auth/permissions/permissions.service';

describe('ReportsService - Hierarchy Features', () => {
  let service: ReportsService;
  let userRepo: jest.Mocked<Repository<User>>;
  let accessService: jest.Mocked<ReportsAccessService>;
  let timeScopeService: jest.Mocked<ReportsTimeScopeService>;
  let queryFactory: jest.Mocked<ReportsActivityQueryFactory>;
  let summaryCalculator: jest.Mocked<SummaryCalculator>;
  let hierarchyBreakdownCalculator: jest.Mocked<HierarchyBreakdownCalculator>;

  // Test data
  const actorWithReports = {
    id: 'actor-1',
    entity_id: 'entity-1',
    role: { rolePermissions: [] },
    entity: { id: 'entity-1', name: 'Test Union', type: EntityType.UNION },
  } as unknown as User;

  const actorWithoutReports = {
    id: 'actor-2',
    entity_id: 'entity-2',
    role: { rolePermissions: [] },
    entity: { id: 'entity-2', name: 'Test Field', type: EntityType.FIELD },
  } as unknown as User;

  const mockActivities = [
    {
      id: 'act-1',
      userId: 'user-1',
      user: { id: 'user-1', entity_id: 'entity-1' },
      expenseAmount: '50.00',
    },
    {
      id: 'act-2',
      userId: 'user-2',
      user: { id: 'user-2', entity_id: 'entity-2' },
      expenseAmount: '30.00',
    },
  ] as unknown as Activity[];

  const mockSummaryResponse = {
    period: { id: 'period-1', startDate: '2024-01-01', endDate: '2024-01-14', status: 'active' },
    scope: 'entity' as const,
    entity: { id: 'entity-1', name: 'Test Union', type: 'UNION' },
    totals: {
      activities: 5,
      expenses: 100,
      usersExpected: 10,
      usersSubmitted: 7,
      complianceRate: 0.7,
    },
  };

  const mockHierarchyBreakdown = [
    {
      entityId: 'entity-1',
      entityName: 'Test Union',
      entityType: EntityType.UNION,
      parentId: null,
      activities: 3,
      expenses: 60,
      usersExpected: 5,
      usersSubmitted: 3,
      complianceRate: 0.6,
    },
    {
      entityId: 'entity-2',
      entityName: 'Test Association',
      entityType: EntityType.ASSOCIATION,
      parentId: 'entity-1',
      activities: 2,
      expenses: 40,
      usersExpected: 5,
      usersSubmitted: 4,
      complianceRate: 0.8,
    },
  ];

  beforeEach(async () => {
    const mockQueryBuilder = {
      getMany: jest.fn().mockResolvedValue(mockActivities),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ReportingPeriod),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: ReportsAccessService,
          useValue: {
            validateEntityInUserScope: jest.fn().mockResolvedValue(true),
            validateUserInScope: jest.fn().mockResolvedValue(true),
            getEntityHierarchy: jest.fn().mockResolvedValue(['entity-1', 'entity-2']),
          },
        },
        {
          provide: ReportsTimeScopeService,
          useValue: {
            getOrDetermineTimeScope: jest.fn().mockResolvedValue({ periodIds: ['period-1'] }),
          },
        },
        {
          provide: ReportsActivityQueryFactory,
          useValue: {
            buildActivityQuery: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: SummaryCalculator,
          useValue: {
            calculate: jest.fn().mockReturnValue(mockSummaryResponse),
          },
        },
        {
          provide: BreakdownsCalculator,
          useValue: { calculate: jest.fn() },
        },
        {
          provide: ComplianceCalculator,
          useValue: { calculate: jest.fn() },
        },
        {
          provide: TrendsCalculator,
          useValue: { calculate: jest.fn() },
        },
        {
          provide: ComparisonCalculator,
          useValue: { calculate: jest.fn() },
        },
        {
          provide: RankingsCalculator,
          useValue: { calculate: jest.fn() },
        },
        {
          provide: ExpensesCalculator,
          useValue: { calculate: jest.fn() },
        },
        {
          provide: PeriodBoundaryCalculator,
          useValue: { calculate: jest.fn() },
        },
        {
          provide: BreakdownComparisonCalculator,
          useValue: { calculate: jest.fn() },
        },
        {
          provide: HierarchyBreakdownCalculator,
          useValue: {
            calculate: jest.fn().mockResolvedValue(mockHierarchyBreakdown),
          },
        },
        {
          provide: CsvExporter,
          useValue: {
            exportToCsv: jest.fn(),
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
    userRepo = module.get(getRepositoryToken(User));
    accessService = module.get(ReportsAccessService);
    timeScopeService = module.get(ReportsTimeScopeService);
    queryFactory = module.get(ReportsActivityQueryFactory);
    summaryCalculator = module.get(SummaryCalculator);
    hierarchyBreakdownCalculator = module.get(HierarchyBreakdownCalculator);
  });

  describe('getSummary with includeHierarchyBreakdown', () => {
    it('should include hierarchy breakdown when flag is true and user canViewReports', async () => {
      userRepo.findOne = jest.fn().mockResolvedValue(actorWithReports);

      const result = await service.getSummary('actor-1', {
        includeHierarchyBreakdown: true,
      });

      expect(result).toHaveProperty('hierarchyBreakdown');
      expect(result.hierarchyBreakdown).toEqual(mockHierarchyBreakdown);
      expect(hierarchyBreakdownCalculator.calculate).toHaveBeenCalledWith(mockActivities, [
        'entity-1',
        'entity-2',
      ]);
    });

    it('should not include hierarchy breakdown when flag is false', async () => {
      userRepo.findOne = jest.fn().mockResolvedValue(actorWithReports);

      const result = await service.getSummary('actor-1', {
        includeHierarchyBreakdown: false,
      });

      expect(result).not.toHaveProperty('hierarchyBreakdown');
      expect(hierarchyBreakdownCalculator.calculate).not.toHaveBeenCalled();
    });

    it('should not include hierarchy breakdown when flag is not provided', async () => {
      userRepo.findOne = jest.fn().mockResolvedValue(actorWithReports);

      const result = await service.getSummary('actor-1', {});

      expect(result).not.toHaveProperty('hierarchyBreakdown');
      expect(hierarchyBreakdownCalculator.calculate).not.toHaveBeenCalled();
    });

    it('should not include hierarchy breakdown when user cannot view reports', async () => {
      userRepo.findOne = jest.fn().mockResolvedValue(actorWithoutReports);

      const result = await service.getSummary('actor-2', {
        includeHierarchyBreakdown: true,
      });

      expect(result).not.toHaveProperty('hierarchyBreakdown');
      expect(hierarchyBreakdownCalculator.calculate).not.toHaveBeenCalled();
    });

    it('should not include hierarchy breakdown when userId filter is provided', async () => {
      userRepo.findOne = jest.fn().mockResolvedValue(actorWithReports);

      const result = await service.getSummary('actor-1', {
        includeHierarchyBreakdown: true,
        userId: 'specific-user',
      });

      // When filtering by userId, hierarchy breakdown doesn't make sense
      expect(result).not.toHaveProperty('hierarchyBreakdown');
    });

    it('should calculate hierarchy breakdown for specific entity scope', async () => {
      userRepo.findOne = jest.fn().mockResolvedValue(actorWithReports);
      accessService.getEntityHierarchy = jest
        .fn()
        .mockResolvedValue(['entity-3', 'entity-4', 'entity-5']);

      await service.getSummary('actor-1', {
        entityId: 'entity-3',
        includeHierarchyBreakdown: true,
      });

      expect(hierarchyBreakdownCalculator.calculate).toHaveBeenCalledWith(mockActivities, [
        'entity-3',
        'entity-4',
        'entity-5',
      ]);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';
import { User } from '../users/user.entity';
import { PeriodCalculator } from '../periods/period-calculator';
import { ReportsAccessService } from './access/reports-access.service';
import { ReportsTimeScopeService } from './time/reports-time-scope.service';
import { ReportsActivityQueryFactory } from './query/reports-activity-query.factory';
import { SummaryCalculator } from './calculators/summary.calculator';
import { BreakdownsCalculator } from './calculators/breakdowns.calculator';
import { EngagementCalculator } from './calculators/engagement.calculator';
import { TrendsCalculator } from './calculators/trends.calculator';
import { ComparisonCalculator } from './calculators/comparison.calculator';
import { RankingsCalculator } from './calculators/rankings.calculator';
import { ExpensesCalculator } from './calculators/expenses.calculator';
import { PeriodBoundaryCalculator } from './time/period-boundary.calculator';
import { BreakdownComparisonCalculator } from './calculators/breakdown-comparison.calculator';
import { HierarchyBreakdownCalculator } from './calculators/hierarchy-breakdown.calculator';
import { CsvExporter } from './export/csv-exporter';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PermissionsService } from '../auth/permissions/permissions.service';
import { EngagementFilter } from './dto/users-report.dto';

describe('ReportsService - getUsersReport', () => {
  let service: ReportsService;
  let userRepo: jest.Mocked<Repository<User>>;
  let accessService: jest.Mocked<ReportsAccessService>;
  let timeScopeService: jest.Mocked<ReportsTimeScopeService>;
  let queryFactory: jest.Mocked<ReportsActivityQueryFactory>;
  let permissionsService: jest.Mocked<PermissionsService>;

  const mockLeader = {
    id: 'leader-uuid',
    entity_id: 'entity-uuid',
    role: { rolePermissions: [] },
    entity: { id: 'entity-uuid', name: 'Test Entity', type: 'FIELD' },
  };

  const mockRegularUser = {
    id: 'regular-uuid',
    entity_id: 'entity-uuid',
    role: { rolePermissions: [] },
    entity: { id: 'entity-uuid', name: 'Test Entity', type: 'FIELD' },
  };

  const mockUsersInHierarchy = [
    {
      id: 'user-1',
      full_name: 'John Doe',
      email: 'john@example.com',
      entity_id: 'entity-uuid',
      entity: { id: 'entity-uuid', name: 'Field A', type: 'FIELD' },
      role: { id: 'role-1', name: 'Missionary' },
    },
    {
      id: 'user-2',
      full_name: 'Jane Smith',
      email: 'jane@example.com',
      entity_id: 'entity-uuid',
      entity: { id: 'entity-uuid', name: 'Field A', type: 'FIELD' },
      role: { id: 'role-2', name: 'Pastor' },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: PeriodCalculator,
          useValue: {
            getCurrentPeriod: jest.fn().mockReturnValue({
              startDate: '2024-01-01',
              endDate: '2024-01-14',
              periodNumber: 1,
              label: 'Enero 2024 - Período 1',
            }),
            getPreviousPeriods: jest.fn().mockReturnValue([]),
          },
        },
        {
          provide: ReportsAccessService,
          useValue: {
            validateEntityInUserScope: jest.fn(),
            getEntityHierarchy: jest.fn(),
            getUsersInHierarchy: jest.fn(),
            getRoleAssignmentsForUsers: jest.fn().mockResolvedValue(new Map()),
          },
        },
        {
          provide: ReportsTimeScopeService,
          useValue: {
            getOrDetermineTimeScope: jest.fn().mockReturnValue({
              dateFrom: '2024-01-01',
              dateTo: '2024-01-31',
            }),
          },
        },
        {
          provide: ReportsActivityQueryFactory,
          useValue: {
            buildActivityQuery: jest.fn().mockReturnValue({
              getMany: jest.fn().mockResolvedValue([]),
            }),
          },
        },
        { provide: SummaryCalculator, useValue: {} },
        { provide: BreakdownsCalculator, useValue: {} },
        { provide: EngagementCalculator, useValue: {} },
        { provide: TrendsCalculator, useValue: {} },
        { provide: ComparisonCalculator, useValue: {} },
        { provide: RankingsCalculator, useValue: {} },
        { provide: ExpensesCalculator, useValue: {} },
        { provide: PeriodBoundaryCalculator, useValue: {} },
        { provide: BreakdownComparisonCalculator, useValue: {} },
        { provide: HierarchyBreakdownCalculator, useValue: {} },
        { provide: CsvExporter, useValue: {} },
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
    permissionsService = module.get(PermissionsService);
  });

  describe('access control', () => {
    it('should throw ForbiddenException if user does not have canViewReports permission', async () => {
      // Override the global mock to return false for this test
      permissionsService.userHasPermission = jest.fn().mockResolvedValue(false);

      userRepo.findOne.mockResolvedValue(mockRegularUser as any);
      permissionsService.userHasPermission.mockResolvedValue(false);

      await expect(service.getUsersReport('regular-uuid', {})).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if actor user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.getUsersReport('unknown-uuid', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if requested entity is not in scope', async () => {
      userRepo.findOne.mockResolvedValue(mockLeader as any);
      accessService.validateEntityInUserScope.mockResolvedValue(false);

      await expect(
        service.getUsersReport('leader-uuid', { entityId: 'other-entity' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('pagination', () => {
    it('should return paginated results with default page 1 and limit 20', async () => {
      userRepo.findOne.mockResolvedValue(mockLeader as any);
      accessService.getEntityHierarchy.mockResolvedValue(['entity-uuid']);
      accessService.getUsersInHierarchy.mockResolvedValue({
        users: mockUsersInHierarchy,
        total: 2,
      } as any);

      const result = await service.getUsersReport('leader-uuid', {});

      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('should respect custom page and limit parameters', async () => {
      userRepo.findOne.mockResolvedValue(mockLeader as any);
      accessService.getEntityHierarchy.mockResolvedValue(['entity-uuid']);
      accessService.getUsersInHierarchy.mockResolvedValue({
        users: mockUsersInHierarchy.slice(0, 1),
        total: 50,
      } as any);

      const result = await service.getUsersReport('leader-uuid', {
        page: 2,
        limit: 10,
      });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
      });
    });
  });

  describe('response structure', () => {
    it('should return users with all required fields', async () => {
      userRepo.findOne.mockResolvedValue(mockLeader as any);
      accessService.getEntityHierarchy.mockResolvedValue(['entity-uuid']);
      accessService.getUsersInHierarchy.mockResolvedValue({
        users: mockUsersInHierarchy,
        total: 2,
      } as any);

      const result = await service.getUsersReport('leader-uuid', {});

      expect(result.users).toHaveLength(2);
      expect(result.users[0]).toMatchObject({
        userId: expect.any(String),
        name: expect.any(String),
        email: expect.any(String),
        entityId: expect.any(String),
        entityName: expect.any(String),
        roleName: expect.any(String),
        activitiesCount: expect.any(Number),
        totalExpenses: expect.any(Number),
      });
      // trend is either number or null
      expect(result.users[0]).toHaveProperty('trend');
    });

    it('should include summary with totals', async () => {
      userRepo.findOne.mockResolvedValue(mockLeader as any);
      accessService.getEntityHierarchy.mockResolvedValue(['entity-uuid']);
      accessService.getUsersInHierarchy.mockResolvedValue({
        users: mockUsersInHierarchy,
        total: 2,
      } as any);

      const result = await service.getUsersReport('leader-uuid', {});

      expect(result.summary).toMatchObject({
        totalUsers: expect.any(Number),
        activeUsers: expect.any(Number),
        inactiveUsers: expect.any(Number),
        totalActivities: expect.any(Number),
        totalExpenses: expect.any(Number),
        avgActivitiesPerUser: expect.any(Number),
      });
    });
  });

  describe('filtering', () => {
    it('should filter by engagement status (active)', async () => {
      userRepo.findOne.mockResolvedValue(mockLeader as any);
      accessService.getEntityHierarchy.mockResolvedValue(['entity-uuid']);
      accessService.getUsersInHierarchy.mockResolvedValue({
        users: [mockUsersInHierarchy[0]],
        total: 1,
      } as any);

      const result = await service.getUsersReport('leader-uuid', {
        engagement: EngagementFilter.ACTIVE,
      });

      expect(result.users.every((u) => u.activitiesCount > 0)).toBe(true);
    });

    it('should filter by search term (name or email)', async () => {
      userRepo.findOne.mockResolvedValue(mockLeader as any);
      accessService.getEntityHierarchy.mockResolvedValue(['entity-uuid']);
      accessService.getUsersInHierarchy.mockResolvedValue({
        users: [mockUsersInHierarchy[0]],
        total: 1,
      } as any);

      const result = await service.getUsersReport('leader-uuid', {
        search: 'john',
      });

      expect(result.users).toHaveLength(1);
      expect(result.users[0].name.toLowerCase()).toContain('john');
    });
  });
});

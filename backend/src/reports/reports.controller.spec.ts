import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { IdentityResolutionService } from '../auth/identity-resolution.service';

describe('ReportsController', () => {
  let controller: ReportsController;
  let reportsService: ReportsService;
  let identityService: IdentityResolutionService;

  const mockReportsService = {
    getSummary: jest.fn(),
    getBreakdowns: jest.fn(),
    getCompliance: jest.fn(),
    getTrends: jest.fn(),
    getComparison: jest.fn(),
    getRankings: jest.fn(),
    getExpenses: jest.fn(),
  };

  const mockIdentityService = {
    resolveUserBySubAndIssuer: jest.fn(),
  };

  const mockRequest = {
    user: {
      sub: 'auth0|123456',
      iss: 'https://example.auth0.com/',
    },
  };

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    username: 'testuser',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
        {
          provide: IdentityResolutionService,
          useValue: mockIdentityService,
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    reportsService = module.get<ReportsService>(ReportsService);
    identityService = module.get<IdentityResolutionService>(IdentityResolutionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSummary', () => {
    it('should return summary data', async () => {
      const mockSummary = {
        period: {
          id: 'period-1',
          startDate: '2024-12-01',
          endDate: '2024-12-14',
          status: 'active',
        },
        scope: 'entity' as const,
        entity: { id: 'entity-1', name: 'Campo Seattle', type: 'FIELD' },
        totals: {
          activities: 71,
          expenses: 380.0,
          usersExpected: 20,
          usersSubmitted: 15,
          complianceRate: 0.75,
        },
      };

      mockIdentityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser);
      mockReportsService.getSummary.mockResolvedValue(mockSummary);

      const result = await controller.getSummary(mockRequest as any, {});

      expect(identityService.resolveUserBySubAndIssuer).toHaveBeenCalledWith(
        mockRequest.user.sub,
        mockRequest.user.iss,
      );
      expect(reportsService.getSummary).toHaveBeenCalledWith('user-1', {});
      expect(result).toEqual(mockSummary);
    });

    it('should pass query parameters to service', async () => {
      mockIdentityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser);
      mockReportsService.getSummary.mockResolvedValue({} as any);

      const query = { periodId: 'period-1', entityId: 'entity-1' };
      await controller.getSummary(mockRequest as any, query);

      expect(reportsService.getSummary).toHaveBeenCalledWith('user-1', query);
    });
  });

  describe('getBreakdowns', () => {
    it('should return breakdowns data', async () => {
      const mockBreakdowns = {
        byType: [{ typeId: 'type-1', name: 'Visitas a Hogares', count: 45, expenses: 230.0 }],
        byEntity: [
          {
            entityId: 'entity-1',
            name: 'Campo Seattle',
            type: 'FIELD',
            count: 28,
            expenses: 180.0,
            compliance: { submitted: 5, total: 6 },
          },
        ],
        byUser: [{ userId: 'user-1', name: 'María García', count: 12, expenses: 150.0 }],
      };

      mockIdentityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser);
      mockReportsService.getBreakdowns.mockResolvedValue(mockBreakdowns);

      const result = await controller.getBreakdowns(mockRequest as any, {});

      expect(reportsService.getBreakdowns).toHaveBeenCalledWith('user-1', {});
      expect(result).toEqual(mockBreakdowns);
    });
  });

  describe('getCompliance', () => {
    it('should return compliance data', async () => {
      const mockCompliance = {
        submitted: [
          {
            userId: 'user-1',
            name: 'María García',
            count: 12,
            lastActivity: '2024-12-12',
          },
        ],
        notSubmitted: [
          {
            userId: 'user-2',
            name: 'Carlos Ruiz',
            roles: ['Misionero'],
            entity: 'Campo Seattle',
          },
        ],
      };

      mockIdentityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser);
      mockReportsService.getCompliance.mockResolvedValue(mockCompliance);

      const result = await controller.getCompliance(mockRequest as any, {});

      expect(reportsService.getCompliance).toHaveBeenCalledWith('user-1', {});
      expect(result).toEqual(mockCompliance);
    });
  });

  describe('getTrends', () => {
    it('should return trends data', async () => {
      const mockTrends = {
        periods: [
          {
            periodId: 'period-1',
            startDate: '2024-12-01',
            endDate: '2024-12-14',
            activities: 71,
            expenses: 380.0,
            complianceRate: 0.75,
            usersSubmitted: 15,
            usersExpected: 20,
          },
        ],
      };

      mockIdentityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser);
      mockReportsService.getTrends.mockResolvedValue(mockTrends);

      const result = await controller.getTrends(mockRequest as any, {});

      expect(reportsService.getTrends).toHaveBeenCalledWith('user-1', {});
      expect(result).toEqual(mockTrends);
    });
  });

  describe('getComparison', () => {
    it('should return comparison data', async () => {
      const mockComparison = {
        current: {
          periodId: 'period-1',
          dates: 'Dic 1-14',
          activities: 71,
          expenses: 380.0,
          complianceRate: 0.75,
          usersActive: 15,
        },
        previous: {
          periodId: 'period-2',
          dates: 'Nov 17-30',
          activities: 68,
          expenses: 320.0,
          complianceRate: 0.8,
          usersActive: 16,
        },
        changes: {
          activities: { value: 3, percent: 4.4 },
          expenses: { value: 60.0, percent: 18.75 },
          complianceRate: { value: -0.05, percent: -6.25 },
          usersActive: { value: -1, percent: -6.25 },
        },
      };

      mockIdentityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser);
      mockReportsService.getComparison.mockResolvedValue(mockComparison);

      const result = await controller.getComparison(mockRequest as any, {});

      expect(reportsService.getComparison).toHaveBeenCalledWith('user-1', {});
      expect(result).toEqual(mockComparison);
    });
  });

  describe('getRankings', () => {
    it('should return rankings data', async () => {
      const mockRankings = {
        topPerformers: [
          {
            userId: 'user-1',
            name: 'María García',
            entity: 'Seattle',
            count: 12,
            expenses: 150.0,
          },
        ],
        lowestCompliance: [{ entityId: 'entity-2', name: 'Campo Tacoma', rate: 0.5, missing: 3 }],
        inactiveUsers: [
          {
            userId: 'user-3',
            name: 'Carlos Ruiz',
            entity: 'Tacoma',
            periodsInactive: 3,
          },
        ],
      };

      mockIdentityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser);
      mockReportsService.getRankings.mockResolvedValue(mockRankings);

      const result = await controller.getRankings(mockRequest as any, { limit: 5 });

      expect(reportsService.getRankings).toHaveBeenCalledWith('user-1', { limit: 5 });
      expect(result).toEqual(mockRankings);
    });
  });

  describe('getExpenses', () => {
    it('should return expenses data', async () => {
      const mockExpenses = {
        total: 380.0,
        byType: [
          {
            typeId: 'type-1',
            name: 'Visitas a Hogares',
            total: 230.0,
            percent: 60.5,
            avgPerActivity: 5.11,
          },
        ],
        byEntity: [
          {
            entityId: 'entity-1',
            name: 'Campo Seattle',
            total: 180.0,
            percent: 47.4,
            perUser: 30.0,
          },
        ],
        byUser: [{ userId: 'user-1', name: 'María García', total: 150.0, percent: 39.5 }],
      };

      mockIdentityService.resolveUserBySubAndIssuer.mockResolvedValue(mockUser);
      mockReportsService.getExpenses.mockResolvedValue(mockExpenses);

      const result = await controller.getExpenses(mockRequest as any, {});

      expect(reportsService.getExpenses).toHaveBeenCalledWith('user-1', {});
      expect(result).toEqual(mockExpenses);
    });
  });
});

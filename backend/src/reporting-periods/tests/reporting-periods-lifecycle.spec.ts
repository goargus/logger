import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportingPeriodsService } from '../reporting-periods.service';
import { ReportingPeriod } from '../reporting-period.entity';
import { ReportingPeriodException } from '../reporting-period-exception.entity';
import { ReportingPeriodStatus } from '../reporting-period-status.enum';
import { ConflictException } from '@nestjs/common';
import { Entity } from '../../entities/entity.entity';

describe('ReportingPeriodsService - Lifecycle Management', () => {
  let service: ReportingPeriodsService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    remove: jest.fn(),
  };

  const mockExceptionsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockEntityRepository = {
    findOne: jest.fn(),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getCount: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingPeriodsService,
        {
          provide: getRepositoryToken(ReportingPeriod),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(ReportingPeriodException),
          useValue: mockExceptionsRepository,
        },
        {
          provide: getRepositoryToken(Entity),
          useValue: mockEntityRepository,
        },
      ],
    }).compile();

    service = module.get<ReportingPeriodsService>(ReportingPeriodsService);

    jest.clearAllMocks();
  });

  describe('Entity Relationship', () => {
    it('should enforce entity_id as required field', async () => {
      const dto = {
        entityId: 'entity-1',
        name: 'Test Period',
        startDate: '2025-01-01',
        endDate: '2025-01-15',
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getOne.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(dto);
      mockRepository.save.mockResolvedValue({ ...dto, id: '1' });

      const result = await service.create(dto, 'user-1');

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: 'entity-1',
        }),
      );
    });

    it('should only allow one active period per entity', async () => {
      const dto = {
        entityId: 'entity-1',
        name: 'Test Period',
        startDate: '2025-02-01',
        endDate: '2025-02-15',
        status: ReportingPeriodStatus.ACTIVE,
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getOne.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue({
        id: '1',
        name: 'Active Period',
        entityId: 'entity-1',
        status: ReportingPeriodStatus.ACTIVE,
      });

      await expect(service.create(dto, 'user-1')).rejects.toThrow(ConflictException);
      await expect(service.create(dto, 'user-1')).rejects.toThrow(
        'Entity already has an active reporting period',
      );
    });
  });

  describe('Automatic Period Creation', () => {
    it('should create first 14-day period for new entity', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockResolvedValue({
        id: '1',
        entityId: 'entity-1',
        status: ReportingPeriodStatus.ACTIVE,
      });

      const result = await service.createFirstPeriodForEntity('entity-1', 'system');

      expect(result).toBeDefined();
      expect(result?.status).toBe(ReportingPeriodStatus.ACTIVE);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: 'entity-1',
          status: ReportingPeriodStatus.ACTIVE,
        }),
      );
    });

    it('should not create first period if entity already has one', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 'existing-1' });

      const result = await service.createFirstPeriodForEntity('entity-1', 'system');

      expect(result).toBeNull();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should create next period after previous one is locked', async () => {
      const previousPeriod = {
        id: '1',
        entityId: 'entity-1',
        endDate: '2025-01-15',
        status: ReportingPeriodStatus.LOCKED,
      };

      mockRepository.findOne.mockResolvedValue(previousPeriod);
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockResolvedValue({
        id: '2',
        entityId: 'entity-1',
        startDate: '2025-01-16',
        endDate: '2025-01-30',
        status: ReportingPeriodStatus.ACTIVE,
      });

      const result = await service.createNextPeriod('entity-1', 'system');

      expect(result).toBeDefined();
      expect(result.status).toBe(ReportingPeriodStatus.ACTIVE);
    });
  });

  describe('Automatic Period Transitions', () => {
    it('should transition expired active periods to locked', async () => {
      const expiredPeriod = {
        id: '1',
        entityId: 'entity-1',
        status: ReportingPeriodStatus.ACTIVE,
        endDate: '2025-01-01',
      };

      mockRepository.find.mockResolvedValue([expiredPeriod]);
      mockRepository.save.mockResolvedValue({
        ...expiredPeriod,
        status: ReportingPeriodStatus.LOCKED,
      });
      mockRepository.findOne.mockResolvedValue(expiredPeriod);
      mockRepository.create.mockReturnValue({});

      const count = await service.transitionExpiredPeriods('system');

      expect(count).toBeGreaterThan(0);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should create new active period after locking expired one', async () => {
      const expiredPeriod = {
        id: '1',
        entityId: 'entity-1',
        status: ReportingPeriodStatus.ACTIVE,
        endDate: '2025-01-14',
      };

      mockRepository.find.mockResolvedValue([expiredPeriod]);
      mockRepository.save.mockResolvedValue({
        ...expiredPeriod,
        status: ReportingPeriodStatus.LOCKED,
      });
      mockRepository.findOne.mockResolvedValue(expiredPeriod);
      mockRepository.create.mockReturnValue({});

      await service.transitionExpiredPeriods('system');

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('Query Operations', () => {
    it('should find active period by entity', async () => {
      const activePeriod = {
        id: '1',
        entityId: 'entity-1',
        status: ReportingPeriodStatus.ACTIVE,
      };

      mockRepository.findOne.mockResolvedValue(activePeriod);

      const result = await service.findActiveByEntity('entity-1');

      expect(result).toEqual(activePeriod);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          entityId: 'entity-1',
          status: ReportingPeriodStatus.ACTIVE,
        },
        relations: ['entity'],
      });
    });

    it('should filter periods by entity', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([{ id: '1' }, { id: '2' }]);

      const result = await service.findByEntity('entity-1');

      expect(result).toHaveLength(2);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('period.entity_id = :entityId', {
        entityId: 'entity-1',
      });
    });

    it('should find all periods with entity filter', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([{ id: '1' }]);

      await service.findAll('entity-1');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('period.entity_id = :entityId', {
        entityId: 'entity-1',
      });
    });
  });

  describe('Manual Admin Operations', () => {
    it('should allow admin to manually close active period', async () => {
      const activePeriod = {
        id: '1',
        entityId: 'entity-1',
        status: ReportingPeriodStatus.ACTIVE,
      };

      mockRepository.findOne.mockResolvedValue(activePeriod);
      mockRepository.save.mockResolvedValue({
        ...activePeriod,
        status: ReportingPeriodStatus.LOCKED,
      });

      const result = await service.close('1', 'admin-1');

      expect(result.status).toBe(ReportingPeriodStatus.LOCKED);
    });

    it('should allow admin to unlock period if no other active exists', async () => {
      const lockedPeriod = {
        id: '1',
        entityId: 'entity-1',
        status: ReportingPeriodStatus.LOCKED,
      };

      mockRepository.findOne.mockResolvedValueOnce(lockedPeriod).mockResolvedValueOnce(null);

      mockRepository.save.mockResolvedValue({
        ...lockedPeriod,
        status: ReportingPeriodStatus.ACTIVE,
      });

      const result = await service.unlock('1', 'admin-1');

      expect(result.status).toBe(ReportingPeriodStatus.ACTIVE);
    });

    it('should prevent unlocking if another active period exists', async () => {
      const lockedPeriod = {
        id: '1',
        entityId: 'entity-1',
        status: ReportingPeriodStatus.LOCKED,
      };

      mockRepository.findOne.mockResolvedValueOnce(lockedPeriod).mockResolvedValueOnce({
        id: '2',
        entityId: 'entity-1',
        status: ReportingPeriodStatus.ACTIVE,
      });

      await expect(service.unlock('1', 'admin-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('14-Day Period Duration', () => {
    it('should create periods with exactly 14-day duration', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockImplementation((data) => data);
      mockRepository.save.mockImplementation((data) => Promise.resolve(data));

      await service.createFirstPeriodForEntity('entity-1', 'system');

      const createCall = mockRepository.create.mock.calls[0][0];
      const start = new Date(createCall.startDate);
      const end = new Date(createCall.endDate);
      const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(14);
    });
  });
});

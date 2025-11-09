import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReportingPeriodsService } from '../reporting-periods.service';
import { ReportingPeriod } from '../reporting-period.entity';
import { ReportingPeriodException } from '../reporting-period-exception.entity';
import { ReportingPeriodStatus } from '../reporting-period-status.enum';
import { CreateExceptionDto } from '../dto/create-exception.dto';

describe('ReportingPeriodsService - Exceptions', () => {
  let service: ReportingPeriodsService;
  let periodRepo: jest.Mocked<Repository<ReportingPeriod>>;
  let exceptionRepo: jest.Mocked<Repository<ReportingPeriodException>>;

  const mockPeriod: ReportingPeriod = {
    id: 'period-id',
    entityId: 'entity-id',
    entity: {} as any,
    termId: 'term-id',
    term: {} as any,
    name: 'January 2024',
    description: 'Test period',
    startDate: '2024-01-01',
    endDate: '2024-01-14',
    status: ReportingPeriodStatus.LOCKED,
    isLocked: true,
    containsDate: jest.fn(),
    activities: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin-id',
    updatedBy: 'admin-id',
  } as ReportingPeriod;

  const mockException: ReportingPeriodException = {
    id: 'exception-id',
    userId: 'user-id',
    reportingPeriodId: 'period-id',
    startDate: '2024-01-01',
    endDate: '2024-01-05',
    reason: 'User was sick',
    grantedBy: 'admin-id',
    grantedAt: new Date(),
  } as ReportingPeriodException;

  beforeEach(async () => {
    const mockPeriodRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockExceptionRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingPeriodsService,
        {
          provide: getRepositoryToken(ReportingPeriod),
          useValue: mockPeriodRepo,
        },
        {
          provide: getRepositoryToken(ReportingPeriodException),
          useValue: mockExceptionRepo,
        },
      ],
    }).compile();

    service = module.get<ReportingPeriodsService>(ReportingPeriodsService);
    periodRepo = module.get(getRepositoryToken(ReportingPeriod));
    exceptionRepo = module.get(getRepositoryToken(ReportingPeriodException));
  });

  describe('createOrUpdateException', () => {
    it('should create a new exception when none exists', async () => {
      const dto: CreateExceptionDto = {
        userId: 'user-id',
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        reason: 'User was sick',
      };

      periodRepo.findOne.mockResolvedValue(mockPeriod);
      exceptionRepo.findOne.mockResolvedValue(null);
      exceptionRepo.create.mockReturnValue(mockException);
      exceptionRepo.save.mockResolvedValue(mockException);

      const result = await service.createOrUpdateException('period-id', dto, 'admin-id');

      expect(periodRepo.findOne).toHaveBeenCalledWith({ where: { id: 'period-id' } });
      expect(exceptionRepo.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-id', reportingPeriodId: 'period-id' },
      });
      expect(exceptionRepo.create).toHaveBeenCalledWith({
        userId: 'user-id',
        reportingPeriodId: 'period-id',
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        reason: 'User was sick',
        grantedBy: 'admin-id',
      });
      expect(exceptionRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockException);
    });

    it('should update existing exception when one already exists', async () => {
      const dto: CreateExceptionDto = {
        userId: 'user-id',
        startDate: '2024-01-06',
        endDate: '2024-01-10',
        reason: 'Extended deadline',
      };

      const existingException = { ...mockException };
      periodRepo.findOne.mockResolvedValue(mockPeriod);
      exceptionRepo.findOne.mockResolvedValue(existingException);
      exceptionRepo.save.mockResolvedValue({
        ...existingException,
        startDate: '2024-01-06',
        endDate: '2024-01-10',
        reason: 'Extended deadline',
        grantedBy: 'admin-id',
      });

      const result = await service.createOrUpdateException('period-id', dto, 'admin-id');

      expect(exceptionRepo.create).not.toHaveBeenCalled();
      expect(exceptionRepo.save).toHaveBeenCalledWith({
        ...existingException,
        startDate: '2024-01-06',
        endDate: '2024-01-10',
        reason: 'Extended deadline',
        grantedBy: 'admin-id',
      });
      expect(result.startDate).toBe('2024-01-06');
      expect(result.endDate).toBe('2024-01-10');
    });

    it('should throw BadRequestException when start date is after end date', async () => {
      const dto: CreateExceptionDto = {
        userId: 'user-id',
        startDate: '2024-01-10',
        endDate: '2024-01-05',
        reason: 'Invalid dates',
      };

      periodRepo.findOne.mockResolvedValue(mockPeriod);

      await expect(
        service.createOrUpdateException('period-id', dto, 'admin-id'),
      ).rejects.toThrow(new BadRequestException('Start date must be before end date'));
    });

    it('should throw BadRequestException when dates are outside period boundaries', async () => {
      const dto: CreateExceptionDto = {
        userId: 'user-id',
        startDate: '2024-01-01',
        endDate: '2024-01-20', // Beyond period end date (2024-01-14)
        reason: 'Out of bounds',
      };

      periodRepo.findOne.mockResolvedValue(mockPeriod);

      await expect(
        service.createOrUpdateException('period-id', dto, 'admin-id'),
      ).rejects.toThrow(
        new BadRequestException(
          'Exception dates must be within period boundaries (2024-01-01 - 2024-01-14)',
        ),
      );
    });

    it('should throw BadRequestException when start date is before period start', async () => {
      const dto: CreateExceptionDto = {
        userId: 'user-id',
        startDate: '2023-12-28',
        endDate: '2024-01-05',
        reason: 'Out of bounds',
      };

      periodRepo.findOne.mockResolvedValue(mockPeriod);

      await expect(
        service.createOrUpdateException('period-id', dto, 'admin-id'),
      ).rejects.toThrow(
        new BadRequestException(
          'Exception dates must be within period boundaries (2024-01-01 - 2024-01-14)',
        ),
      );
    });

    it('should allow exception with dates exactly matching period boundaries', async () => {
      const dto: CreateExceptionDto = {
        userId: 'user-id',
        startDate: '2024-01-01',
        endDate: '2024-01-14',
        reason: 'Full period access',
      };

      periodRepo.findOne.mockResolvedValue(mockPeriod);
      exceptionRepo.findOne.mockResolvedValue(null);
      exceptionRepo.create.mockReturnValue(mockException);
      exceptionRepo.save.mockResolvedValue(mockException);

      await expect(
        service.createOrUpdateException('period-id', dto, 'admin-id'),
      ).resolves.toBeDefined();
    });

    it('should throw NotFoundException when period does not exist', async () => {
      const dto: CreateExceptionDto = {
        userId: 'user-id',
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        reason: 'Test',
      };

      periodRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createOrUpdateException('invalid-period-id', dto, 'admin-id'),
      ).rejects.toThrow(new NotFoundException('Reporting period not found'));
    });
  });

  describe('revokeException', () => {
    it('should remove exception when it exists', async () => {
      exceptionRepo.findOne.mockResolvedValue(mockException);
      exceptionRepo.remove.mockResolvedValue(mockException);

      await service.revokeException('period-id', 'user-id');

      expect(exceptionRepo.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-id', reportingPeriodId: 'period-id' },
      });
      expect(exceptionRepo.remove).toHaveBeenCalledWith(mockException);
    });

    it('should throw NotFoundException when exception does not exist', async () => {
      exceptionRepo.findOne.mockResolvedValue(null);

      await expect(service.revokeException('period-id', 'user-id')).rejects.toThrow(
        new NotFoundException('Exception not found'),
      );
    });
  });

  describe('findExceptionsByPeriod', () => {
    it('should return all exceptions for a period', async () => {
      const exceptions = [
        mockException,
        { ...mockException, id: 'exception-2', userId: 'user-2' },
      ];

      exceptionRepo.find.mockResolvedValue(exceptions as ReportingPeriodException[]);

      const result = await service.findExceptionsByPeriod('period-id');

      expect(exceptionRepo.find).toHaveBeenCalledWith({
        where: { reportingPeriodId: 'period-id' },
        relations: ['user'],
        order: { grantedAt: 'DESC' },
      });
      expect(result).toEqual(exceptions);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no exceptions exist', async () => {
      exceptionRepo.find.mockResolvedValue([]);

      const result = await service.findExceptionsByPeriod('period-id');

      expect(result).toEqual([]);
    });
  });

  describe('hasUserExceptionForDate', () => {
    it('should return true when user has exception covering the date', async () => {
      exceptionRepo.findOne.mockResolvedValue(mockException);

      const result = await service.hasUserExceptionForDate(
        'user-id',
        'period-id',
        '2024-01-03',
      );

      expect(exceptionRepo.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-id', reportingPeriodId: 'period-id' },
      });
      expect(result).toBe(true);
    });

    it('should return true when date is at start boundary', async () => {
      exceptionRepo.findOne.mockResolvedValue(mockException);

      const result = await service.hasUserExceptionForDate(
        'user-id',
        'period-id',
        '2024-01-01',
      );

      expect(result).toBe(true);
    });

    it('should return true when date is at end boundary', async () => {
      exceptionRepo.findOne.mockResolvedValue(mockException);

      const result = await service.hasUserExceptionForDate(
        'user-id',
        'period-id',
        '2024-01-05',
      );

      expect(result).toBe(true);
    });

    it('should return false when date is before exception start', async () => {
      exceptionRepo.findOne.mockResolvedValue(mockException);

      const result = await service.hasUserExceptionForDate(
        'user-id',
        'period-id',
        '2023-12-31',
      );

      expect(result).toBe(false);
    });

    it('should return false when date is after exception end', async () => {
      exceptionRepo.findOne.mockResolvedValue(mockException);

      const result = await service.hasUserExceptionForDate(
        'user-id',
        'period-id',
        '2024-01-06',
      );

      expect(result).toBe(false);
    });

    it('should return false when user has no exception', async () => {
      exceptionRepo.findOne.mockResolvedValue(null);

      const result = await service.hasUserExceptionForDate(
        'user-id',
        'period-id',
        '2024-01-03',
      );

      expect(result).toBe(false);
    });
  });
});

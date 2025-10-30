import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ReportingPeriodsService } from '../reporting-periods.service';
import { ReportingPeriod } from '../reporting-period.entity';
import { ReportingPeriodStatus } from '../reporting-period-status.enum';
import { CreateReportingPeriodDto } from '../dto/create-reporting-period.dto';
import { UpdateReportingPeriodDto } from '../dto/update-reporting-period.dto';

describe('ReportingPeriodsService', () => {
  let service: ReportingPeriodsService;
  let repo: jest.Mocked<Repository<ReportingPeriod>>;

  const mockReportingPeriod: ReportingPeriod = {
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
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin-id',
    updatedBy: 'admin-id',
    isLocked: false,
    containsDate: jest.fn().mockReturnValue(true),
    activities: [],
  } as ReportingPeriod;

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingPeriodsService,
        {
          provide: getRepositoryToken(ReportingPeriod),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ReportingPeriodsService>(ReportingPeriodsService);
    repo = module.get(getRepositoryToken(ReportingPeriod));
  });

  describe('create', () => {
    it('should create a new reporting period successfully', async () => {
      const createDto: CreateReportingPeriodDto = {
        entityId: 'entity-id',
        termId: 'term-id',
        name: 'February 2024',
        description: 'February reporting period',
        startDate: '2024-02-01',
        endDate: '2024-02-29',
        status: ReportingPeriodStatus.ACTIVE,
      };

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      repo.createQueryBuilder.mockReturnValue(queryBuilder as any);
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(mockReportingPeriod);
      repo.save.mockResolvedValue(mockReportingPeriod);

      const result = await service.create(createDto, 'admin-id');

      expect(result).toEqual(mockReportingPeriod);
      expect(repo.create).toHaveBeenCalledWith({
        entityId: 'entity-id',
        termId: 'term-id',
        name: 'February 2024',
        description: 'February reporting period',
        startDate: '2024-02-01',
        endDate: '2024-02-29',
        status: ReportingPeriodStatus.ACTIVE,
        createdBy: 'admin-id',
        updatedBy: 'admin-id',
      });
    });

    it('should throw BadRequestException when start date is after end date', async () => {
      const createDto: CreateReportingPeriodDto = {
        entityId: 'entity-id',
        termId: 'term-id',
        name: 'Invalid Period',
        startDate: '2024-02-29',
        endDate: '2024-02-01',
      };

      await expect(service.create(createDto, 'admin-id')).rejects.toThrow(
        new BadRequestException('Start date must be before end date'),
      );
    });

    it('should throw ConflictException when period overlaps with existing', async () => {
      const createDto: CreateReportingPeriodDto = {
        entityId: 'entity-id',
        termId: 'term-id',
        name: 'Overlapping Period',
        startDate: '2024-01-15',
        endDate: '2024-02-15',
      };

      const existingPeriod = {
        ...mockReportingPeriod,
        name: 'Existing Period',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(existingPeriod),
      };

      repo.createQueryBuilder.mockReturnValue(queryBuilder as any);

      await expect(service.create(createDto, 'admin-id')).rejects.toThrow(
        new ConflictException(
          `Period overlaps with existing period "Existing Period" (2024-01-01 - 2024-01-31)`,
        ),
      );
    });
  });

  describe('findByDate', () => {
    it('should find reporting period by date', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockReportingPeriod),
      };

      repo.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.findByDate('2024-01-15');

      expect(result).toEqual(mockReportingPeriod);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'period.startDate <= :date AND period.endDate >= :date',
        { date: '2024-01-15' },
      );
    });

    it('should return null when no period found for date', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      repo.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.findByDate('2024-03-15');

      expect(result).toBeNull();
    });
  });

  describe('lock', () => {
    it('should lock an active reporting period', async () => {
      const activePeriod = {
        ...mockReportingPeriod,
        status: ReportingPeriodStatus.ACTIVE,
        isLocked: false,
        containsDate: jest.fn().mockReturnValue(true),
      } as ReportingPeriod;
      const lockedPeriod = {
        ...activePeriod,
        status: ReportingPeriodStatus.LOCKED,
        isLocked: true,
        containsDate: jest.fn().mockReturnValue(true),
      } as ReportingPeriod;

      repo.findOne.mockResolvedValue(activePeriod);
      repo.save.mockResolvedValue(lockedPeriod);

      const result = await service.lock('period-id', 'admin-id');

      expect(result.status).toBe(ReportingPeriodStatus.LOCKED);
      expect(repo.save).toHaveBeenCalledWith({
        ...activePeriod,
        status: ReportingPeriodStatus.LOCKED,
        updatedBy: 'admin-id',
      });
    });

    it('should throw BadRequestException when period is already locked', async () => {
      const lockedPeriod = {
        ...mockReportingPeriod,
        status: ReportingPeriodStatus.LOCKED,
      } as ReportingPeriod;
      repo.findOne.mockResolvedValue(lockedPeriod);

      await expect(service.lock('period-id', 'admin-id')).rejects.toThrow(
        new BadRequestException('Reporting period is already locked'),
      );
    });
  });

  describe('unlock', () => {
    it('should unlock a locked reporting period', async () => {
      const lockedPeriod = {
        ...mockReportingPeriod,
        status: ReportingPeriodStatus.LOCKED,
        isLocked: true,
        containsDate: jest.fn().mockReturnValue(true),
      };
      const activePeriod = {
        ...lockedPeriod,
        status: ReportingPeriodStatus.ACTIVE,
        isLocked: false,
        containsDate: jest.fn().mockReturnValue(true),
      };

      // First call returns the locked period, second call checks for existing active (returns null)
      repo.findOne.mockResolvedValueOnce(lockedPeriod).mockResolvedValueOnce(null);
      repo.save.mockResolvedValue(activePeriod);

      const result = await service.unlock('period-id', 'admin-id');

      expect(result.status).toBe(ReportingPeriodStatus.ACTIVE);
      expect(repo.save).toHaveBeenCalledWith({
        ...lockedPeriod,
        status: ReportingPeriodStatus.ACTIVE,
        updatedBy: 'admin-id',
      });
    });

    it('should throw BadRequestException when period is already active', async () => {
      const activePeriod = {
        ...mockReportingPeriod,
        status: ReportingPeriodStatus.ACTIVE,
        isLocked: false,
        containsDate: jest.fn().mockReturnValue(true),
      };
      repo.findOne.mockResolvedValue(activePeriod);

      await expect(service.unlock('period-id', 'admin-id')).rejects.toThrow(
        new BadRequestException('Reporting period is already active'),
      );
    });
  });

  describe('update', () => {
    it('should update reporting period successfully', async () => {
      const updateDto: UpdateReportingPeriodDto = {
        name: 'Updated January 2024',
        description: 'Updated description',
      };

      const updatedPeriod = {
        ...mockReportingPeriod,
        ...updateDto,
        isLocked: false,
        containsDate: jest.fn().mockReturnValue(true),
      };

      repo.findOne.mockResolvedValue(mockReportingPeriod);
      repo.save.mockResolvedValue(updatedPeriod);

      const result = await service.update('period-id', updateDto, 'admin-id');

      expect(result.name).toBe('Updated January 2024');
      expect(result.description).toBe('Updated description');
    });

    it('should throw BadRequestException when updating with invalid date range', async () => {
      const updateDto: UpdateReportingPeriodDto = {
        startDate: '2024-01-31',
        endDate: '2024-01-01',
      };

      repo.findOne.mockResolvedValue(mockReportingPeriod);

      await expect(service.update('period-id', updateDto, 'admin-id')).rejects.toThrow(
        new BadRequestException('Start date must be before end date'),
      );
    });

    it('should throw ConflictException when update causes overlap', async () => {
      const updateDto: UpdateReportingPeriodDto = {
        startDate: '2024-02-01',
        endDate: '2024-02-29',
      };

      const overlappingPeriod = {
        id: 'other-period-id',
        name: 'February 2024',
        startDate: '2024-02-01',
        endDate: '2024-02-29',
      };

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(overlappingPeriod),
      };

      repo.findOne.mockResolvedValue(mockReportingPeriod);
      repo.createQueryBuilder.mockReturnValue(queryBuilder as any);

      await expect(service.update('period-id', updateDto, 'admin-id')).rejects.toThrow(
        new ConflictException(
          `Period would overlap with existing period "February 2024" (2024-02-01 - 2024-02-29)`,
        ),
      );
    });
  });

  describe('remove', () => {
    it('should remove reporting period when no activities are associated', async () => {
      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };

      repo.findOne.mockResolvedValue(mockReportingPeriod);
      repo.createQueryBuilder.mockReturnValue(queryBuilder as any);
      repo.remove.mockResolvedValue(mockReportingPeriod);

      await service.remove('period-id');

      expect(repo.remove).toHaveBeenCalledWith(mockReportingPeriod);
    });

    it('should throw BadRequestException when activities are associated', async () => {
      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
      };

      repo.findOne.mockResolvedValue(mockReportingPeriod);
      repo.createQueryBuilder.mockReturnValue(queryBuilder as any);

      await expect(service.remove('period-id')).rejects.toThrow(
        new BadRequestException(
          'Cannot delete reporting period: it has associated activities. Please reassign or remove activities first.',
        ),
      );
    });
  });

  describe('findOne', () => {
    it('should return reporting period when found', async () => {
      repo.findOne.mockResolvedValue(mockReportingPeriod);

      const result = await service.findOne('period-id');

      expect(result).toEqual(mockReportingPeriod);
    });

    it('should throw NotFoundException when period not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        new NotFoundException('Reporting period not found'),
      );
    });
  });
});

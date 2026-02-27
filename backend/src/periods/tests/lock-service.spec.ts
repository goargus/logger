import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LockService } from '../lock.service';
import { AdminLock } from '../admin-lock.entity';
import { PeriodException } from '../period-exception.entity';
import { PeriodCalculator } from '../period-calculator';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('LockService', () => {
  let service: LockService;
  let adminLockRepo: Record<string, jest.Mock>;
  let exceptionRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    adminLockRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn((data) => data),
      delete: jest.fn(),
    };
    exceptionRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn((data) => data),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LockService,
        { provide: getRepositoryToken(AdminLock), useValue: adminLockRepo },
        { provide: getRepositoryToken(PeriodException), useValue: exceptionRepo },
        { provide: PeriodCalculator, useValue: new PeriodCalculator(2) },
      ],
    }).compile();

    service = module.get<LockService>(LockService);

    jest.useFakeTimers().setSystemTime(new Date('2026-03-20T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('getAdminLock', () => {
    it('returns the admin lock for an entity', async () => {
      const lock = { id: 'lock-1', entityId: 'entity-1', lockDate: '2026-03-15' };
      adminLockRepo.findOne.mockResolvedValue(lock);
      expect(await service.getAdminLock('entity-1')).toEqual(lock);
    });

    it('returns null when no admin lock exists', async () => {
      adminLockRepo.findOne.mockResolvedValue(null);
      expect(await service.getAdminLock('entity-1')).toBeNull();
    });
  });

  describe('isDateLockedSync', () => {
    it('returns true when date is in a past period', () => {
      expect(service.isDateLockedSync('2026-03-10', null)).toBe(true);
    });

    it('returns true when date <= admin lock date', () => {
      const lock = { lockDate: '2026-03-25' } as any;
      expect(service.isDateLockedSync('2026-03-20', lock)).toBe(true);
    });

    it('returns false when date is current and no admin lock', () => {
      expect(service.isDateLockedSync('2026-03-20', null)).toBe(false);
    });

    it('returns false when date is after admin lock date', () => {
      const lock = { lockDate: '2026-03-18' } as any;
      expect(service.isDateLockedSync('2026-03-20', lock)).toBe(false);
    });
  });

  describe('isDateLocked', () => {
    it('returns true when date is in a past period', async () => {
      adminLockRepo.findOne.mockResolvedValue(null);
      // Mar 10 is in period 1 (Mar 1-15), today is Mar 20 → past period
      expect(await service.isDateLocked('entity-1', '2026-03-10')).toBe(true);
    });

    it('returns true when date <= admin lock date', async () => {
      adminLockRepo.findOne.mockResolvedValue({ lockDate: '2026-03-25' });
      // Mar 20 is in current period but admin locked through Mar 25
      expect(await service.isDateLocked('entity-1', '2026-03-20')).toBe(true);
    });

    it('returns false when date is in the current period and no admin lock', async () => {
      adminLockRepo.findOne.mockResolvedValue(null);
      expect(await service.isDateLocked('entity-1', '2026-03-20')).toBe(false);
    });

    it('admin lock takes precedence over natural period', async () => {
      // Date is in current period (not naturally locked), but admin locked
      adminLockRepo.findOne.mockResolvedValue({ lockDate: '2026-03-31' });
      expect(await service.isDateLocked('entity-1', '2026-03-20')).toBe(true);
    });
  });

  describe('isDateAvailableForUser', () => {
    it('returns true for unlocked date', async () => {
      adminLockRepo.findOne.mockResolvedValue(null);
      expect(await service.isDateAvailableForUser('entity-1', 'user-1', '2026-03-20')).toBe(true);
    });

    it('returns true for locked date with valid exception', async () => {
      adminLockRepo.findOne.mockResolvedValue(null);
      exceptionRepo.find.mockResolvedValue([{ startDate: '2026-03-01', endDate: '2026-03-15' }]);
      // Mar 10 is in a past period (locked), but user has exception
      expect(await service.isDateAvailableForUser('entity-1', 'user-1', '2026-03-10')).toBe(true);
    });

    it('returns false for locked date without exception', async () => {
      adminLockRepo.findOne.mockResolvedValue(null);
      exceptionRepo.find.mockResolvedValue([]);
      expect(await service.isDateAvailableForUser('entity-1', 'user-1', '2026-03-10')).toBe(false);
    });

    it('returns false when exception does not cover the date', async () => {
      adminLockRepo.findOne.mockResolvedValue(null);
      exceptionRepo.find.mockResolvedValue([{ startDate: '2026-03-01', endDate: '2026-03-05' }]);
      expect(await service.isDateAvailableForUser('entity-1', 'user-1', '2026-03-10')).toBe(false);
    });
  });

  describe('getAvailability', () => {
    it('returns current period and available dates for current month', async () => {
      adminLockRepo.findOne.mockResolvedValue(null);
      exceptionRepo.find.mockResolvedValue([]);

      const result = await service.getAvailability('entity-1', 'user-1', '2026-03');
      expect(result.currentPeriod).toEqual({
        startDate: '2026-03-16',
        endDate: '2026-03-31',
      });
      // Only current period is available (no exceptions for locked first half)
      expect(result.availableDates).toEqual([{ startDate: '2026-03-16', endDate: '2026-03-31' }]);
    });

    it('merges exception windows into available dates', async () => {
      adminLockRepo.findOne.mockResolvedValue(null);
      exceptionRepo.find.mockResolvedValue([{ startDate: '2026-03-01', endDate: '2026-03-05' }]);

      const result = await service.getAvailability('entity-1', 'user-1', '2026-03');
      expect(result.availableDates).toEqual([
        { startDate: '2026-03-16', endDate: '2026-03-31' },
        { startDate: '2026-03-01', endDate: '2026-03-05' },
      ]);
    });

    it('handles month entirely in the past', async () => {
      adminLockRepo.findOne.mockResolvedValue(null);
      exceptionRepo.find.mockResolvedValue([]);

      const result = await service.getAvailability('entity-1', 'user-1', '2026-01');
      expect(result.currentPeriod).toBeNull();
      expect(result.availableDates).toEqual([]);
    });

    it('handles admin lock that locks part of current period', async () => {
      adminLockRepo.findOne.mockResolvedValue({ lockDate: '2026-03-20' });
      exceptionRepo.find.mockResolvedValue([]);

      const result = await service.getAvailability('entity-1', 'user-1', '2026-03');
      // Current period is Mar 16-31, but locked through Mar 20
      // Available: Mar 21-31
      expect(result.availableDates).toEqual([{ startDate: '2026-03-21', endDate: '2026-03-31' }]);
    });
  });

  describe('setAdminLock', () => {
    it('creates lock entry for entity', async () => {
      adminLockRepo.findOne.mockResolvedValue(null);
      adminLockRepo.save.mockResolvedValue({
        id: 'lock-1',
        entityId: 'entity-1',
        lockDate: '2026-03-15',
      });

      await service.setAdminLock('entity-1', '2026-03-15', 'admin-1');
      expect(adminLockRepo.save).toHaveBeenCalled();
    });

    it('updates existing lock entry', async () => {
      const existing = { id: 'lock-1', entityId: 'entity-1', lockDate: '2026-03-10' };
      adminLockRepo.findOne.mockResolvedValue(existing);
      adminLockRepo.save.mockResolvedValue({ ...existing, lockDate: '2026-03-20' });

      await service.setAdminLock('entity-1', '2026-03-20', 'admin-1');
      expect(adminLockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ lockDate: '2026-03-20' }),
      );
    });
  });

  describe('removeAdminLock', () => {
    it('deletes lock entry for entity', async () => {
      adminLockRepo.delete.mockResolvedValue({ affected: 1 });
      await service.removeAdminLock('entity-1');
      expect(adminLockRepo.delete).toHaveBeenCalledWith({ entityId: 'entity-1' });
    });
  });

  describe('grantException', () => {
    it('creates exception for user', async () => {
      exceptionRepo.findOne.mockResolvedValue(null);
      exceptionRepo.save.mockResolvedValue({ id: 'exc-1' });

      await service.grantException(
        'user-1',
        'entity-1',
        '2026-03-01',
        '2026-03-05',
        'admin-1',
        'Late submission',
      );
      expect(exceptionRepo.save).toHaveBeenCalled();
    });

    it('validates end_date >= start_date', async () => {
      await expect(
        service.grantException('user-1', 'entity-1', '2026-03-10', '2026-03-05', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('revokeException', () => {
    it('deletes exception by ID', async () => {
      exceptionRepo.findOne.mockResolvedValue({ id: 'exc-1' });
      exceptionRepo.delete.mockResolvedValue({ affected: 1 });
      await service.revokeException('exc-1');
      expect(exceptionRepo.delete).toHaveBeenCalledWith('exc-1');
    });

    it('throws if exception not found', async () => {
      exceptionRepo.findOne.mockResolvedValue(null);
      await expect(service.revokeException('exc-missing')).rejects.toThrow(NotFoundException);
    });
  });
});

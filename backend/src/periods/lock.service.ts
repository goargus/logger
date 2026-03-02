import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminLock } from './admin-lock.entity';
import { PeriodException } from './period-exception.entity';
import { PeriodCalculator } from './period-calculator';
import { isDateInRange } from '../common/date.utils';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface AvailabilityResponse {
  currentPeriod: DateRange | null;
  availableDates: DateRange[];
}

@Injectable()
export class LockService {
  constructor(
    @InjectRepository(AdminLock) private readonly adminLockRepo: Repository<AdminLock>,
    @InjectRepository(PeriodException) private readonly exceptionRepo: Repository<PeriodException>,
    private readonly calculator: PeriodCalculator,
  ) {}

  async getAdminLock(entityId: string): Promise<AdminLock | null> {
    return this.adminLockRepo.findOne({ where: { entityId } });
  }

  isDateLockedSync(dateStr: string, adminLock: AdminLock | null): boolean {
    if (this.calculator.isDateInPastPeriod(dateStr)) {
      return true;
    }
    if (adminLock && dateStr <= adminLock.lockDate) {
      return true;
    }
    return false;
  }

  async isDateLocked(entityId: string, dateStr: string): Promise<boolean> {
    if (this.calculator.isDateInPastPeriod(dateStr)) {
      return true;
    }

    const adminLock = await this.adminLockRepo.findOne({ where: { entityId } });
    if (adminLock && dateStr <= adminLock.lockDate) {
      return true;
    }

    return false;
  }

  async isDateAvailableForUser(
    entityId: string,
    userId: string,
    dateStr: string,
  ): Promise<boolean> {
    const locked = await this.isDateLocked(entityId, dateStr);
    if (!locked) return true;

    const exceptions = await this.exceptionRepo.find({
      where: { userId, entityId },
    });

    return exceptions.some((e) => isDateInRange(dateStr, e.startDate, e.endDate));
  }

  async getAvailability(
    entityId: string,
    userId: string,
    monthStr: string,
  ): Promise<AvailabilityResponse> {
    const [year, month] = monthStr.split('-').map(Number);
    const periods = this.calculator.getPeriodsForMonth(year, month);
    const today = new Date().toISOString().split('T')[0];

    const adminLock = await this.adminLockRepo.findOne({ where: { entityId } });
    const exceptions = await this.exceptionRepo.find({
      where: { userId, entityId },
    });

    // Find the current period (the one containing today, if in this month)
    const currentPeriod = periods.find((p) => today >= p.startDate && today <= p.endDate);

    const availableDates: DateRange[] = [];

    for (const period of periods) {
      const naturallyLocked = period.endDate < today;
      const adminLocked = adminLock ? period.startDate <= adminLock.lockDate : false;

      if (!naturallyLocked && !adminLocked) {
        // Entire period is available
        availableDates.push({ startDate: period.startDate, endDate: period.endDate });
      } else if (adminLock && !naturallyLocked) {
        // Partially locked by admin: only dates after admin lock are available
        const availableStart = this.nextDay(adminLock.lockDate);
        if (availableStart <= period.endDate) {
          availableDates.push({ startDate: availableStart, endDate: period.endDate });
        }
      }
      // If naturally locked, only exceptions can unlock dates (handled below)
    }

    // Add exception windows that fall within locked periods of this month
    for (const exception of exceptions) {
      const overlapStart =
        exception.startDate < periods[0].startDate ? periods[0].startDate : exception.startDate;
      const overlapEnd =
        exception.endDate > periods[periods.length - 1].endDate
          ? periods[periods.length - 1].endDate
          : exception.endDate;

      if (overlapStart <= overlapEnd) {
        // Only add if this covers locked dates
        const isLocked = await this.isDateLocked(entityId, overlapStart);
        if (isLocked) {
          availableDates.push({ startDate: overlapStart, endDate: overlapEnd });
        }
      }
    }

    return {
      currentPeriod: currentPeriod
        ? { startDate: currentPeriod.startDate, endDate: currentPeriod.endDate }
        : null,
      availableDates,
    };
  }

  async setAdminLock(entityId: string, lockDate: string, lockedBy: string): Promise<AdminLock> {
    await this.adminLockRepo.upsert(
      { entityId, lockDate, lockedBy },
      { conflictPaths: ['entityId'] },
    );
    return this.adminLockRepo.findOneByOrFail({ entityId });
  }

  async removeAdminLock(entityId: string): Promise<void> {
    await this.adminLockRepo.delete({ entityId });
  }

  async grantException(
    userId: string,
    entityId: string,
    startDate: string,
    endDate: string,
    grantedBy: string,
    reason?: string,
  ): Promise<PeriodException> {
    if (endDate < startDate) {
      throw new BadRequestException('endDate must be >= startDate');
    }

    const exception = this.exceptionRepo.create({
      userId,
      entityId,
      startDate,
      endDate,
      grantedBy,
      reason: reason ?? null,
    });
    return this.exceptionRepo.save(exception);
  }

  async revokeException(exceptionId: string): Promise<void> {
    const exception = await this.exceptionRepo.findOne({ where: { id: exceptionId } });
    if (!exception) {
      throw new NotFoundException('Exception not found');
    }
    await this.exceptionRepo.delete(exceptionId);
  }

  private nextDay(dateStr: string): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  }
}

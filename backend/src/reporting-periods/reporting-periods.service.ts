import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { ReportingPeriod } from './reporting-period.entity';
import { ReportingPeriodException } from './reporting-period-exception.entity';
import { CreateReportingPeriodDto } from './dto/create-reporting-period.dto';
import { UpdateReportingPeriodDto } from './dto/update-reporting-period.dto';
import { CreateExceptionDto } from './dto/create-exception.dto';
import { ReportingPeriodStatus } from './reporting-period-status.enum';

@Injectable()
export class ReportingPeriodsService {
  private readonly logger = new Logger(ReportingPeriodsService.name);

  constructor(
    @InjectRepository(ReportingPeriod)
    private readonly repo: Repository<ReportingPeriod>,
    @InjectRepository(ReportingPeriodException)
    private readonly exceptionsRepo: Repository<ReportingPeriodException>,
  ) {}

  async create(dto: CreateReportingPeriodDto, actorUserId: string): Promise<ReportingPeriod> {
    if (dto.startDate >= dto.endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const overlapping = await this.repo
      .createQueryBuilder('period')
      .where('period.entity_id = :entityId', { entityId: dto.entityId })
      .andWhere('(period.startDate <= :endDate AND period.endDate >= :startDate)', {
        startDate: dto.startDate,
        endDate: dto.endDate,
      })
      .getOne();

    if (overlapping) {
      throw new ConflictException(
        `Period overlaps with existing period "${overlapping.name}" (${overlapping.startDate} - ${overlapping.endDate})`,
      );
    }

    const status = dto.status ?? ReportingPeriodStatus.ACTIVE;
    if (status === ReportingPeriodStatus.ACTIVE) {
      const activeExists = await this.repo.findOne({
        where: {
          entityId: dto.entityId,
          status: ReportingPeriodStatus.ACTIVE,
        },
      });

      if (activeExists) {
        throw new ConflictException(
          `Entity already has an active reporting period: "${activeExists.name}"`,
        );
      }
    }

    const entity = this.repo.create({
      entityId: dto.entityId,
      name: dto.name,
      description: dto.description ?? null,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status,
      createdBy: actorUserId,
      updatedBy: actorUserId,
    });

    return this.repo.save(entity);
  }

  async createFirstPeriodForEntity(
    entityId: string,
    actorUserId: string,
  ): Promise<ReportingPeriod | null> {
    try {
      const existing = await this.repo.findOne({
        where: { entityId },
      });

      if (existing) {
        this.logger.warn(`Entity ${entityId} already has a reporting period, skipping creation`);
        return null;
      }

      const today = new Date();
      const startDate = this.formatDate(today);
      const endDate = this.formatDate(this.addDays(today, 14));

      const period = this.repo.create({
        entityId,
        name: `Reporting Period ${startDate}`,
        startDate,
        endDate,
        status: ReportingPeriodStatus.ACTIVE,
        createdBy: actorUserId,
        updatedBy: actorUserId,
      });

      const saved = await this.repo.save(period);
      this.logger.log(`Created first reporting period for entity ${entityId}: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create first period for entity ${entityId}:`, error);
      return null;
    }
  }

  async createNextPeriod(entityId: string, actorUserId: string): Promise<ReportingPeriod> {
    const previousPeriod = await this.repo.findOne({
      where: {
        entityId,
        status: ReportingPeriodStatus.LOCKED,
      },
      order: { endDate: 'DESC' },
    });

    if (!previousPeriod) {
      throw new NotFoundException('No previous period found to create next period');
    }

    const startDate = this.formatDate(this.addDays(new Date(previousPeriod.endDate), 1));
    const endDate = this.formatDate(this.addDays(new Date(startDate), 14));

    const period = this.repo.create({
      entityId,
      name: `Reporting Period ${startDate}`,
      startDate,
      endDate,
      status: ReportingPeriodStatus.ACTIVE,
      createdBy: actorUserId,
      updatedBy: actorUserId,
    });

    const saved = await this.repo.save(period);
    this.logger.log(`Created next reporting period for entity ${entityId}: ${saved.id}`);
    return saved;
  }

  async transitionExpiredPeriods(actorUserId: string): Promise<number> {
    const today = this.formatDate(new Date());

    const expiredPeriods = await this.repo.find({
      where: {
        status: ReportingPeriodStatus.ACTIVE,
        endDate: LessThanOrEqual(today),
      },
    });

    let transitioned = 0;

    for (const period of expiredPeriods) {
      try {
        period.status = ReportingPeriodStatus.LOCKED;
        period.updatedBy = actorUserId;
        await this.repo.save(period);

        await this.createNextPeriod(period.entityId, actorUserId);
        transitioned++;
      } catch (error) {
        this.logger.error(`Failed to transition period ${period.id}:`, error);
      }
    }

    this.logger.log(`Transitioned ${transitioned} expired reporting periods`);
    return transitioned;
  }

  async findActiveByEntity(entityId: string): Promise<ReportingPeriod | null> {
    return this.repo.findOne({
      where: {
        entityId,
        status: ReportingPeriodStatus.ACTIVE,
      },
      relations: ['entity'],
    });
  }

  async findByEntity(entityId: string): Promise<ReportingPeriod[]> {
    return this.repo
      .createQueryBuilder('period')
      .where('period.entity_id = :entityId', { entityId })
      .orderBy('period.start_date', 'DESC')
      .getMany();
  }

  async findAll(entityId?: string): Promise<ReportingPeriod[]> {
    const query = this.repo
      .createQueryBuilder('period')
      .leftJoinAndSelect('period.entity', 'entity')
      .orderBy('period.start_date', 'DESC');

    if (entityId) {
      query.andWhere('period.entity_id = :entityId', { entityId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<ReportingPeriod> {
    const period = await this.repo.findOne({ where: { id } });
    if (!period) {
      throw new NotFoundException('Reporting period not found');
    }
    return period;
  }

  async findByDate(date: string): Promise<ReportingPeriod | null> {
    return this.repo
      .createQueryBuilder('period')
      .where('period.startDate <= :date AND period.endDate >= :date', { date })
      .getOne();
  }

  async update(
    id: string,
    dto: UpdateReportingPeriodDto,
    actorUserId: string,
  ): Promise<ReportingPeriod> {
    const period = await this.findOne(id);

    if (dto.startDate && dto.endDate && dto.startDate >= dto.endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const startDate = dto.startDate ?? period.startDate;
    const endDate = dto.endDate ?? period.endDate;

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }
    if (dto.startDate || dto.endDate) {
      const overlapping = await this.repo
        .createQueryBuilder('period')
        .where(
          '(period.startDate <= :endDate AND period.endDate >= :startDate) AND period.id != :id',
          { startDate, endDate, id },
        )
        .getOne();

      if (overlapping) {
        throw new ConflictException(
          `Period would overlap with existing period "${overlapping.name}" (${overlapping.startDate} - ${overlapping.endDate})`,
        );
      }
    }

    Object.assign(period, {
      ...dto,
      updatedBy: actorUserId,
    });

    return this.repo.save(period);
  }

  async lock(id: string, actorUserId: string): Promise<ReportingPeriod> {
    const period = await this.findOne(id);

    if (period.status === ReportingPeriodStatus.LOCKED) {
      throw new BadRequestException('Reporting period is already locked');
    }

    period.status = ReportingPeriodStatus.LOCKED;
    period.updatedBy = actorUserId;

    return this.repo.save(period);
  }

  async unlock(id: string, actorUserId: string): Promise<ReportingPeriod> {
    const period = await this.findOne(id);

    if (period.status === ReportingPeriodStatus.ACTIVE) {
      throw new BadRequestException('Reporting period is already active');
    }

    const activeExists = await this.repo.findOne({
      where: {
        entityId: period.entityId,
        status: ReportingPeriodStatus.ACTIVE,
      },
    });

    if (activeExists) {
      throw new ConflictException(
        `Entity already has an active reporting period: "${activeExists.name}"`,
      );
    }

    period.status = ReportingPeriodStatus.ACTIVE;
    period.updatedBy = actorUserId;

    return this.repo.save(period);
  }

  async close(id: string, actorUserId: string): Promise<ReportingPeriod> {
    return this.lock(id, actorUserId);
  }

  async remove(id: string): Promise<void> {
    const period = await this.findOne(id);
    const activitiesCount = await this.repo
      .createQueryBuilder('period')
      .leftJoin('period.activities', 'activity')
      .where('period.id = :id', { id })
      .getCount();

    if (activitiesCount > 0) {
      throw new BadRequestException(
        'Cannot delete reporting period: it has associated activities. Please reassign or remove activities first.',
      );
    }

    await this.repo.remove(period);
  }

  async createOrUpdateException(
    periodId: string,
    dto: CreateExceptionDto,
    actorUserId: string,
  ): Promise<ReportingPeriodException> {
    const period = await this.findOne(periodId);

    if (dto.startDate >= dto.endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    if (dto.startDate < period.startDate || dto.endDate > period.endDate) {
      throw new BadRequestException(
        `Exception dates must be within period boundaries (${period.startDate} - ${period.endDate})`,
      );
    }

    const existing = await this.exceptionsRepo.findOne({
      where: {
        userId: dto.userId,
        reportingPeriodId: periodId,
      },
    });

    if (existing) {
      existing.startDate = dto.startDate;
      existing.endDate = dto.endDate;
      existing.reason = dto.reason ?? null;
      existing.grantedBy = actorUserId;
      return this.exceptionsRepo.save(existing);
    }

    const exception = this.exceptionsRepo.create({
      userId: dto.userId,
      reportingPeriodId: periodId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      reason: dto.reason ?? null,
      grantedBy: actorUserId,
    });

    return this.exceptionsRepo.save(exception);
  }

  async revokeException(periodId: string, userId: string): Promise<void> {
    const exception = await this.exceptionsRepo.findOne({
      where: {
        userId,
        reportingPeriodId: periodId,
      },
    });

    if (!exception) {
      throw new NotFoundException('Exception not found');
    }

    await this.exceptionsRepo.remove(exception);
  }

  async findExceptionsByPeriod(periodId: string): Promise<ReportingPeriodException[]> {
    return this.exceptionsRepo.find({
      where: { reportingPeriodId: periodId },
      relations: ['user'],
      order: { grantedAt: 'DESC' },
    });
  }

  async hasUserExceptionForDate(
    userId: string,
    reportingPeriodId: string,
    activityDate: string,
  ): Promise<boolean> {
    const exception = await this.exceptionsRepo.findOne({
      where: {
        userId,
        reportingPeriodId,
      },
    });

    if (!exception) {
      return false;
    }

    return activityDate >= exception.startDate && activityDate <= exception.endDate;
  }

  async getLockedDateRangesForUser(
    userId: string,
  ): Promise<Array<{ startDate: string; endDate: string; periodName: string }>> {
    const lockedPeriods = await this.repo.find({
      where: { status: ReportingPeriodStatus.LOCKED },
      order: { startDate: 'ASC' },
    });

    const userExceptions = await this.exceptionsRepo.find({
      where: { userId },
    });

    const lockedRanges: Array<{ startDate: string; endDate: string; periodName: string }> = [];

    for (const period of lockedPeriods) {
      const exception = userExceptions.find((ex) => ex.reportingPeriodId === period.id);

      if (exception) {
        if (period.startDate < exception.startDate) {
          const dayBefore = this.subtractDays(new Date(exception.startDate), 1);
          lockedRanges.push({
            startDate: period.startDate,
            endDate: this.formatDate(dayBefore),
            periodName: period.name,
          });
        }

        if (exception.endDate < period.endDate) {
          const dayAfter = this.addDays(new Date(exception.endDate), 1);
          lockedRanges.push({
            startDate: this.formatDate(dayAfter),
            endDate: period.endDate,
            periodName: period.name,
          });
        }
      } else {
        lockedRanges.push({
          startDate: period.startDate,
          endDate: period.endDate,
          periodName: period.name,
        });
      }
    }

    return lockedRanges;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private subtractDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }
}

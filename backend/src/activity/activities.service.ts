import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, FindOptionsWhere } from 'typeorm';
import { Activity } from './activity.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivityStatus } from './activity-status.enum';
import { ActivityType } from '../activities-type/activity-type.entity';
import { ReportingPeriod } from '../reporting-periods/reporting-period.entity';
import { ReportingPeriodStatus } from '../reporting-periods/reporting-period-status.enum';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity) private readonly repo: Repository<Activity>,
    @InjectRepository(ActivityType) private readonly typesRepo: Repository<ActivityType>,
    @InjectRepository(ReportingPeriod)
    private readonly reportingPeriodsRepo: Repository<ReportingPeriod>,
  ) {}

  private ensureOwnershipOrThrow(activity: Activity, userId: string) {
    if (activity.userId !== userId) {
      throw new ForbiddenException('You can only access your own activities.');
    }
  }

  private async ensureTypeOrThrow(typeId: string): Promise<ActivityType> {
    const type = await this.typesRepo.findOne({ where: { id: typeId } });
    if (!type) throw new NotFoundException('ActivityType not found.');
    return type;
  }

  private async findReportingPeriodForDate(date: string): Promise<ReportingPeriod | null> {
    return this.reportingPeriodsRepo
      .createQueryBuilder('period')
      .where('period.startDate <= :date AND period.endDate >= :date', { date })
      .getOne();
  }

  private async ensureActivityNotLocked(activity: Activity): Promise<void> {
    if (activity.reportingPeriodId) {
      const reportingPeriod = await this.reportingPeriodsRepo.findOne({
        where: { id: activity.reportingPeriodId },
      });
      if (reportingPeriod && reportingPeriod.status === ReportingPeriodStatus.LOCKED) {
        throw new ForbiddenException(
          'This activity is locked because its reporting period has ended',
        );
      }
    }
  }

  async create(dto: CreateActivityDto, actorUserId: string): Promise<Activity> {
    await this.ensureTypeOrThrow(dto.activityTypeId);

    if (dto.hasExpense && (dto.expenseAmount == null || dto.expenseAmount === '')) {
      throw new BadRequestException('expenseAmount is required when hasExpense is true.');
    }

    const reportingPeriod = await this.findReportingPeriodForDate(dto.activityDate);
    if (reportingPeriod && reportingPeriod.status === ReportingPeriodStatus.LOCKED) {
      throw new ForbiddenException('Cannot create activity in a locked reporting period');
    }

    const entity = this.repo.create({
      activityTypeId: dto.activityTypeId,
      activityDate: dto.activityDate,
      description: dto.description ?? null,
      hasExpense: dto.hasExpense,
      expenseAmount: dto.hasExpense ? dto.expenseAmount : null,
      reportingPeriodId: reportingPeriod?.id ?? null,
      userId: actorUserId,
      createdBy: actorUserId,
      updatedBy: actorUserId,
      status: ActivityStatus.ACTIVE,
    });

    return this.repo.save(entity);
  }

  async findMine(userId: string, page = 1, limit = 20): Promise<[Activity[], number]> {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = Math.max(page - 1, 0) * take;

    return this.repo.findAndCount({
      where: { userId, status: ActivityStatus.ACTIVE } as FindOptionsWhere<Activity>,
      order: { activityDate: 'DESC', createdAt: 'DESC' },
      skip,
      take,
    });
  }

  async findOneMine(id: string, userId: string): Promise<Activity> {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Activity not found.');
    this.ensureOwnershipOrThrow(a, userId);
    return a;
  }

  async updateMine(id: string, dto: UpdateActivityDto, userId: string): Promise<Activity> {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Activity not found.');
    this.ensureOwnershipOrThrow(a, userId);

    await this.ensureActivityNotLocked(a);

    if (dto.activityTypeId) {
      await this.ensureTypeOrThrow(dto.activityTypeId);
      a.activityTypeId = dto.activityTypeId;
    }

    if (dto.activityDate && dto.activityDate !== a.activityDate) {
      const newReportingPeriod = await this.findReportingPeriodForDate(dto.activityDate);
      if (newReportingPeriod && newReportingPeriod.status === ReportingPeriodStatus.LOCKED) {
        throw new ForbiddenException('Cannot move activity to a locked reporting period');
      }
      a.reportingPeriodId = newReportingPeriod?.id ?? null;
    }

    if (dto.hasExpense === true && (dto.expenseAmount == null || dto.expenseAmount === '')) {
      throw new BadRequestException('expenseAmount is required when hasExpense is true.');
    }
    if (dto.hasExpense === false) {
      a.expenseAmount = null;
    }

    Object.assign(a, {
      ...dto,
      updatedBy: userId,
    });

    return this.repo.save(a);
  }

  async archiveMine(id: string, userId: string): Promise<void> {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Activity not found.');
    this.ensureOwnershipOrThrow(a, userId);

    await this.ensureActivityNotLocked(a);

    a.status = ActivityStatus.ARCHIVED;
    a.archivedAt = new Date();
    a.archivedBy = userId;
    a.updatedBy = userId;

    await this.repo.save(a);
  }

  async mapTypeNamesByIds(ids: string[]): Promise<Map<string, string>> {
    const uniq = [...new Set(ids)];
    if (uniq.length === 0) return new Map();
    const types = await this.typesRepo.find({ where: { id: In(uniq) } });
    return new Map(types.map((t) => [t.id, (t as any).name]));
  }

  async getMonthlyExpenseTotal(userId: string, year: number, month: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const result = await this.repo
      .createQueryBuilder('activity')
      .select('SUM(CAST(activity.expenseAmount AS DECIMAL))', 'total')
      .where('activity.userId = :userId', { userId })
      .andWhere('activity.status = :status', { status: ActivityStatus.ACTIVE })
      .andWhere('activity.hasExpense = :hasExpense', { hasExpense: true })
      .andWhere('activity.activityDate >= :startDate', {
        startDate: startDate.toISOString().split('T')[0],
      })
      .andWhere('activity.activityDate <= :endDate', {
        endDate: endDate.toISOString().split('T')[0],
      })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }
}

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
import { UserRoleAssignment } from '../roles/user-role-assignment.entity';
import { formatDateToString, isDateInRange } from '../common/date.utils';
import { normalizePagination } from '../common/pagination';
import { ReportingPeriodException } from '../reporting-periods/reporting-period-exception.entity';
import { User } from '../users/user.entity';
import { ReportingPeriodsService } from '../reporting-periods/reporting-periods.service';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity) private readonly repo: Repository<Activity>,
    @InjectRepository(ActivityType) private readonly typesRepo: Repository<ActivityType>,
    @InjectRepository(ReportingPeriod)
    private readonly reportingPeriodsRepo: Repository<ReportingPeriod>,
    @InjectRepository(ReportingPeriodException)
    private readonly exceptionsRepo: Repository<ReportingPeriodException>,
    @InjectRepository(UserRoleAssignment)
    private readonly uraRepo: Repository<UserRoleAssignment>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly reportingPeriodsService: ReportingPeriodsService,
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

  private async getUserEntityId(userId: string): Promise<string> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'entity_id'],
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user.entity_id;
  }

  private normalizeDateString(date: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    return formatDateToString(new Date(date));
  }

  private async findLockedPeriodForDate(
    entityId: string,
    date: string,
  ): Promise<ReportingPeriod | null> {
    return this.reportingPeriodsRepo
      .createQueryBuilder('period')
      .where('period.entity_id = :entityId', { entityId })
      .andWhere('period.status = :status', { status: ReportingPeriodStatus.LOCKED })
      .andWhere('period.startDate <= :date AND period.endDate >= :date', { date })
      .getOne();
  }

  private async resolveReportingPeriodForDate(
    userId: string,
    date: string,
    operation: 'create' | 'move' = 'create',
  ): Promise<ReportingPeriod> {
    const entityId = await this.getUserEntityId(userId);

    let activePeriod = await this.reportingPeriodsRepo.findOne({
      where: { entityId, status: ReportingPeriodStatus.ACTIVE },
    });

    if (!activePeriod) {
      activePeriod = await this.reportingPeriodsService.ensureCurrentPeriodForEntity(
        entityId,
        userId,
      );
    }

    if (isDateInRange(date, activePeriod.startDate, activePeriod.endDate)) {
      return activePeriod;
    }

    const lockedPeriod = await this.findLockedPeriodForDate(entityId, date);
    if (!lockedPeriod) {
      throw new ForbiddenException(`Cannot ${operation} activity outside active reporting period`);
    }

    const hasException = await this.exceptionsRepo.findOne({
      where: {
        userId,
        reportingPeriodId: lockedPeriod.id,
      },
    });

    if (!hasException) {
      throw new ForbiddenException(`Cannot ${operation} activity in a locked reporting period`);
    }

    const { startDate, endDate } = hasException;
    if (!isDateInRange(date, startDate, endDate)) {
      throw new ForbiddenException(`Cannot ${operation} activity in a locked reporting period`);
    }

    return lockedPeriod;
  }

  private async ensureActivityNotLocked(activity: Activity, userId: string): Promise<void> {
    if (activity.reportingPeriodId) {
      const reportingPeriod = await this.reportingPeriodsRepo.findOne({
        where: { id: activity.reportingPeriodId },
      });
      if (reportingPeriod && reportingPeriod.status === ReportingPeriodStatus.LOCKED) {
        const hasException = await this.exceptionsRepo.findOne({
          where: {
            userId,
            reportingPeriodId: activity.reportingPeriodId,
          },
        });

        if (hasException) {
          const activityDate = activity.activityDate;
          const { startDate, endDate } = hasException;
          if (activityDate >= startDate && activityDate <= endDate) {
            return;
          }
        }

        throw new ForbiddenException(
          'This activity is locked because its reporting period has ended',
        );
      }
    }
  }

  async canUserSubmitActivityType(userId: string, activityTypeId: string): Promise<boolean> {
    const activityType = await this.typesRepo.findOne({
      where: { id: activityTypeId },
      relations: ['allowed_roles'],
    });

    if (!activityType) {
      return false;
    }

    if (!activityType.allowed_roles || activityType.allowed_roles.length === 0) {
      return true;
    }

    const allowedRoleIds = activityType.allowed_roles.map((role) => role.id);

    const userRoleAssignment = await this.uraRepo.findOne({
      where: {
        user: { id: userId },
        role: { id: In(allowedRoleIds) },
      },
    });

    return !!userRoleAssignment;
  }

  async create(dto: CreateActivityDto, actorUserId: string): Promise<Activity> {
    await this.ensureTypeOrThrow(dto.activityTypeId);

    const isAuthorized = await this.canUserSubmitActivityType(actorUserId, dto.activityTypeId);
    if (!isAuthorized) {
      throw new ForbiddenException('You are not authorized to submit this activity type');
    }

    if (dto.hasExpense && (dto.expenseAmount == null || dto.expenseAmount === '')) {
      throw new BadRequestException('expenseAmount is required when hasExpense is true.');
    }

    const activityDate = this.normalizeDateString(dto.activityDate);
    const reportingPeriod = await this.resolveReportingPeriodForDate(actorUserId, activityDate);

    const entity = this.repo.create({
      activityTypeId: dto.activityTypeId,
      activityDate,
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

  async findMine(
    userId: string,
    page = 1,
    limit = 20,
    filters?: {
      startDate?: string;
      endDate?: string;
      activityTypeId?: string;
      hasExpense?: boolean;
      search?: string;
    },
  ): Promise<[Activity[], number]> {
    const { skip, limit: take } = normalizePagination({ page, limit });

    const qb = this.repo
      .createQueryBuilder('activity')
      .where('activity.userId = :userId', { userId })
      .andWhere('activity.status = :status', { status: ActivityStatus.ACTIVE });

    if (filters?.startDate) {
      qb.andWhere('activity.activityDate >= :startDate', { startDate: filters.startDate });
    }
    if (filters?.endDate) {
      qb.andWhere('activity.activityDate <= :endDate', { endDate: filters.endDate });
    }
    if (filters?.activityTypeId) {
      qb.andWhere('activity.activityTypeId = :activityTypeId', {
        activityTypeId: filters.activityTypeId,
      });
    }
    if (filters?.hasExpense !== undefined) {
      qb.andWhere('activity.hasExpense = :hasExpense', { hasExpense: filters.hasExpense });
    }
    if (filters?.search) {
      const search = filters.search.trim();
      if (search) {
        qb.leftJoin('activity.activityType', 'activityType');
        const like = `%${search}%`;
        if (search.length < 3) {
          qb.andWhere('(activity.description ILIKE :like OR activityType.name ILIKE :like)', {
            like,
          });
        } else {
          qb.andWhere(
            `(${[
              'activity.description ILIKE :like',
              'activityType.name ILIKE :like',
              'similarity(activity.description, :search) > :threshold',
              'similarity(activityType.name, :search) > :threshold',
            ].join(' OR ')})`,
            {
              like,
              search,
              threshold: 0.2,
            },
          );
        }
      }
    }

    qb.orderBy('activity.activityDate', 'DESC').addOrderBy('activity.createdAt', 'DESC');
    qb.skip(skip).take(take);

    return qb.getManyAndCount();
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

    await this.ensureActivityNotLocked(a, userId);

    if (dto.activityTypeId) {
      await this.ensureTypeOrThrow(dto.activityTypeId);
      const isAuthorized = await this.canUserSubmitActivityType(userId, dto.activityTypeId);
      if (!isAuthorized) {
        throw new ForbiddenException('You are not authorized to submit this activity type');
      }
      a.activityTypeId = dto.activityTypeId;
    }

    if (dto.activityDate && dto.activityDate !== a.activityDate) {
      const activityDate = this.normalizeDateString(dto.activityDate);
      const newReportingPeriod = await this.resolveReportingPeriodForDate(userId, activityDate, 'move');
      a.reportingPeriodId = newReportingPeriod.id;
      a.activityDate = activityDate;
    }

    if (dto.hasExpense === true && (dto.expenseAmount == null || dto.expenseAmount === '')) {
      throw new BadRequestException('expenseAmount is required when hasExpense is true.');
    }
    if (dto.hasExpense === false) {
      a.expenseAmount = null;
    }

    const updates = {
      ...dto,
      updatedBy: userId,
    };
    if (updates.activityDate != null) {
      updates.activityDate = a.activityDate;
    }

    Object.assign(a, updates);

    return this.repo.save(a);
  }

  async archiveMine(id: string, userId: string): Promise<void> {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Activity not found.');
    this.ensureOwnershipOrThrow(a, userId);

    await this.ensureActivityNotLocked(a, userId);

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
        startDate: formatDateToString(startDate),
      })
      .andWhere('activity.activityDate <= :endDate', {
        endDate: formatDateToString(endDate),
      })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }
}

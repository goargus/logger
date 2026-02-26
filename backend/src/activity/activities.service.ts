import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Activity } from './activity.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivityStatus } from './activity-status.enum';
import { ActivityType } from '../activities-type/activity-type.entity';
import { UserRoleAssignment } from '../roles/user-role-assignment.entity';
import { formatDateToString } from '../common/date.utils';
import { normalizePagination } from '../common/pagination';
import { User } from '../users/user.entity';
import { LockService } from '../periods/lock.service';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity) private readonly repo: Repository<Activity>,
    @InjectRepository(ActivityType) private readonly typesRepo: Repository<ActivityType>,
    @InjectRepository(UserRoleAssignment)
    private readonly uraRepo: Repository<UserRoleAssignment>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly lockService: LockService,
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

    const entityId = await this.getUserEntityId(actorUserId);
    const available = await this.lockService.isDateAvailableForUser(
      entityId,
      actorUserId,
      activityDate,
    );
    if (!available) {
      throw new ForbiddenException('Activity date is locked');
    }

    const entity = this.repo.create({
      activityTypeId: dto.activityTypeId,
      activityDate,
      description: dto.description ?? null,
      hasExpense: dto.hasExpense,
      expenseAmount: dto.hasExpense ? dto.expenseAmount : null,
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

    const entityId = await this.getUserEntityId(userId);
    const available = await this.lockService.isDateAvailableForUser(
      entityId,
      userId,
      a.activityDate,
    );
    if (!available) {
      throw new ForbiddenException('Activity date is locked');
    }

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
      const newDateAvailable = await this.lockService.isDateAvailableForUser(
        entityId,
        userId,
        activityDate,
      );
      if (!newDateAvailable) {
        throw new ForbiddenException('Activity date is locked');
      }
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

    const entityId = await this.getUserEntityId(userId);
    const available = await this.lockService.isDateAvailableForUser(
      entityId,
      userId,
      a.activityDate,
    );
    if (!available) {
      throw new ForbiddenException('Activity date is locked');
    }

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

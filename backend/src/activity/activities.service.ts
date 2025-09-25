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

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity) private readonly repo: Repository<Activity>,
    @InjectRepository(ActivityType) private readonly typesRepo: Repository<ActivityType>,
  ) {}

  private ensureOwnershipOrThrow(activity: Activity, userId: string) {
    if (activity.userId !== userId) {
      throw new ForbiddenException('You can only access your own activities.');
    }
  }

  private async ensureTypeOrThrow(typeId: string): Promise<ActivityType> {
    const t = await this.typesRepo.findOne({ where: { id: typeId } });
    if (!t) throw new BadRequestException('activityTypeId does not exist.');
    return t;
  }

  async create(dto: CreateActivityDto, actorUserId: string): Promise<Activity> {
    await this.ensureTypeOrThrow(dto.activityTypeId);

    if (dto.hasExpense && (dto.expenseAmount == null || dto.expenseAmount === '')) {
      throw new BadRequestException('expenseAmount is required when hasExpense is true.');
    }

    const entity = this.repo.create({
      activityTypeId: dto.activityTypeId,
      activityDate: dto.activityDate,
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

    if (dto.activityTypeId) {
      await this.ensureTypeOrThrow(dto.activityTypeId);
      a.activityTypeId = dto.activityTypeId;
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
      .andWhere('activity.activityDate >= :startDate', { startDate: startDate.toISOString().split('T')[0] })
      .andWhere('activity.activityDate <= :endDate', { endDate: endDate.toISOString().split('T')[0] })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Activity } from '../../activity/activity.entity';
import { User } from '../../users/user.entity';
import { Entity } from '../../entities/entity.entity';
import { PeriodInfo } from '../../periods/period-calculator';
import { UserStatus } from '../../users/user-status.enum';
import { ActivityStatus } from '../../activity/activity-status.enum';
import { RankingsResponse } from '../dto/report-responses.dto';

@Injectable()
export class RankingsCalculator {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Entity)
    private readonly entityRepo: Repository<Entity>,
  ) {}

  async calculate(
    activities: Activity[],
    entityIds: string[],
    recentPeriods: PeriodInfo[],
    limit: number,
  ): Promise<RankingsResponse> {
    const userPerformance = new Map<
      string,
      { name: string; entity: string; count: number; expenses: number }
    >();
    for (const activity of activities) {
      const userId = activity.userId;
      const existing = userPerformance.get(userId) || {
        name: activity.user.full_name || activity.user.username,
        entity: activity.user.entity.name,
        count: 0,
        expenses: 0,
      };
      existing.count++;
      existing.expenses += activity.expenseAmount ? parseFloat(activity.expenseAmount) : 0;
      userPerformance.set(userId, existing);
    }

    const topPerformers = Array.from(userPerformance.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([userId, data]) => ({
        userId,
        name: data.name,
        entity: data.entity,
        count: data.count,
        expenses: Math.round(data.expenses * 100) / 100,
      }));

    const childEntities = await this.entityRepo.find({
      where: { id: In(entityIds) },
    });

    const allUsers = await this.userRepo.find({
      where: { entity_id: In(entityIds), status: UserStatus.ACTIVE },
    });

    const usersByEntity = new Map<string, User[]>();
    for (const user of allUsers) {
      if (!usersByEntity.has(user.entity_id)) {
        usersByEntity.set(user.entity_id, []);
      }
      const entityUsers = usersByEntity.get(user.entity_id);
      if (entityUsers) {
        entityUsers.push(user);
      }
    }

    const entityCompliance = childEntities.map((entity) => {
      const usersInEntity = usersByEntity.get(entity.id) || [];
      const userIdsInEntity = usersInEntity.map((u) => u.id);
      const usersSubmitted = new Set(
        activities.filter((a) => userIdsInEntity.includes(a.userId)).map((a) => a.userId),
      ).size;

      const rate = usersInEntity.length > 0 ? usersSubmitted / usersInEntity.length : 0;
      const missing = usersInEntity.length - usersSubmitted;

      return {
        entityId: entity.id,
        name: entity.name,
        rate: Math.round(rate * 100) / 100,
        missing,
      };
    });

    const lowestEngagement = entityCompliance
      .filter((e) => e.missing > 0)
      .sort((a, b) => a.rate - b.rate)
      .slice(0, limit);

    const inactiveUsers: Array<{
      userId: string;
      name: string;
      entity: string;
      periodsInactive: number;
    }> = [];

    if (recentPeriods.length > 0) {
      const usersInScope = await this.userRepo.find({
        where: { entity_id: In(entityIds), status: UserStatus.ACTIVE },
        relations: ['entity'],
      });

      const userIds = usersInScope.map((u) => u.id);

      // For each recent period, query activities by date range instead of FK
      const periodActivitiesMap = new Map<number, Set<string>>();

      for (let i = 0; i < recentPeriods.length; i++) {
        const period = recentPeriods[i];
        const periodActivities = await this.activityRepo
          .createQueryBuilder('activity')
          .select('activity.userId')
          .where('activity.userId IN (:...userIds)', { userIds })
          .andWhere('activity.status = :status', { status: ActivityStatus.ACTIVE })
          .andWhere('activity.activityDate BETWEEN :startDate AND :endDate', {
            startDate: period.startDate,
            endDate: period.endDate,
          })
          .groupBy('activity.userId')
          .getRawMany();

        const activeUserIds = new Set<string>(
          periodActivities.map((a: { activity_userId: string }) => a.activity_userId),
        );
        periodActivitiesMap.set(i, activeUserIds);
      }

      for (const user of usersInScope) {
        let periodsInactive = 0;
        for (let i = 0; i < recentPeriods.length; i++) {
          const activeUserIds = periodActivitiesMap.get(i)!;
          if (!activeUserIds.has(user.id)) {
            periodsInactive++;
          } else {
            break;
          }
        }

        if (periodsInactive >= 2) {
          inactiveUsers.push({
            userId: user.id,
            name: user.full_name || user.username,
            entity: user.entity.name,
            periodsInactive,
          });
        }
      }
    }

    const sortedInactiveUsers = inactiveUsers
      .sort((a, b) => b.periodsInactive - a.periodsInactive)
      .slice(0, limit);

    return {
      topPerformers,
      lowestEngagement,
      inactiveUsers: sortedInactiveUsers,
    };
  }
}

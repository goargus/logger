import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Activity } from '../../activity/activity.entity';
import { User } from '../../users/user.entity';
import { UserStatus } from '../../users/user-status.enum';
import { EngagementResponse } from '../dto/report-responses.dto';

@Injectable()
export class EngagementCalculator {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async calculate(
    currentActivities: Activity[],
    previousActivities: Activity[],
    entityIds: string[],
  ): Promise<EngagementResponse> {
    const usersInScope = await this.userRepo.find({
      where: { entity_id: In(entityIds), status: UserStatus.ACTIVE },
      relations: ['entity', 'role'],
    });

    // Build per-user current period metrics
    const currentMetrics = new Map<string, { count: number; lastDate: string | null }>();
    for (const a of currentActivities) {
      const m = currentMetrics.get(a.userId) || { count: 0, lastDate: null };
      m.count++;
      if (!m.lastDate || a.activityDate > m.lastDate) {
        m.lastDate = a.activityDate;
      }
      currentMetrics.set(a.userId, m);
    }

    // Build per-user previous period counts for trend
    const previousCounts = new Map<string, number>();
    for (const a of previousActivities) {
      previousCounts.set(a.userId, (previousCounts.get(a.userId) || 0) + 1);
    }

    const totalActivities = currentActivities.length;

    const users = usersInScope.map((u) => {
      const current = currentMetrics.get(u.id) || { count: 0, lastDate: null };
      const previousCount = previousCounts.get(u.id) || 0;

      let trend: number | null = null;
      if (previousCount > 0) {
        trend = Math.round(((current.count - previousCount) / previousCount) * 100);
      }
      // If previous = 0, trend stays null (no baseline)

      return {
        userId: u.id,
        name: u.full_name || u.username,
        roles: u.role ? [u.role.name] : [],
        entity: u.entity.name,
        activityCount: current.count,
        lastActivityDate: current.lastDate,
        trend,
      };
    });

    const activeUsers = users.filter((u) => u.activityCount > 0).length;

    return {
      users,
      summary: {
        totalUsers: usersInScope.length,
        activeUsers,
        inactiveUsers: usersInScope.length - activeUsers,
        avgActivitiesPerUser:
          usersInScope.length > 0
            ? Math.round((totalActivities / usersInScope.length) * 100) / 100
            : 0,
      },
    };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Activity } from '../../activity/activity.entity';
import { User } from '../../users/user.entity';
import { PeriodInfo } from '../../periods/period-calculator';
import { UserStatus } from '../../users/user-status.enum';
import { TrendsResponse } from '../dto/report-responses.dto';

@Injectable()
export class TrendsCalculator {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async calculate(
    periodsData: Array<{ period: PeriodInfo; activities: Activity[] }>,
    entityIds: string[],
    canViewReports: boolean,
    isUserFiltered: boolean,
  ): Promise<TrendsResponse> {
    let usersInScope: User[] = [];
    if (canViewReports && !isUserFiltered) {
      usersInScope = await this.userRepo.find({
        where: { entity_id: In(entityIds), status: UserStatus.ACTIVE },
      });
    }

    const trendsData = periodsData.map(({ period, activities }) => {
      const totalExpenses = activities.reduce((sum, a) => {
        return sum + (a.expenseAmount ? parseFloat(a.expenseAmount) : 0);
      }, 0);

      let totalUsers = 0;
      let activeUsers = 0;

      if (canViewReports && !isUserFiltered) {
        totalUsers = usersInScope.length;
        activeUsers = new Set(activities.map((a) => a.userId)).size;
      } else {
        totalUsers = 1;
        activeUsers = activities.length > 0 ? 1 : 0;
      }

      const activeRate = totalUsers > 0 ? activeUsers / totalUsers : 0;

      return {
        periodId: period.label,
        startDate: period.startDate,
        endDate: period.endDate,
        activities: activities.length,
        expenses: Math.round(totalExpenses * 100) / 100,
        activeRate: Math.round(activeRate * 100) / 100,
        activeUsers,
        totalUsers,
      };
    });

    return {
      periods: trendsData.reverse(),
    };
  }
}

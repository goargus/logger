import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Activity } from '../../activity/activity.entity';
import { User } from '../../users/user.entity';
import { ReportingPeriod } from '../../reporting-periods/reporting-period.entity';
import { UserStatus } from '../../users/user-status.enum';
import { TrendsResponse } from '../dto/report-responses.dto';

@Injectable()
export class TrendsCalculator {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async calculate(
    periodsData: Array<{ period: ReportingPeriod; activities: Activity[] }>,
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

      let usersExpected = 0;
      let usersSubmitted = 0;

      if (canViewReports && !isUserFiltered) {
        usersExpected = usersInScope.length;
        usersSubmitted = new Set(activities.map((a) => a.userId)).size;
      } else {
        usersExpected = 1;
        usersSubmitted = activities.length > 0 ? 1 : 0;
      }

      const complianceRate = usersExpected > 0 ? usersSubmitted / usersExpected : 0;

      return {
        periodId: period.id,
        startDate: period.startDate,
        endDate: period.endDate,
        activities: activities.length,
        expenses: Math.round(totalExpenses * 100) / 100,
        complianceRate: Math.round(complianceRate * 100) / 100,
        usersSubmitted,
        usersExpected,
      };
    });

    return {
      periods: trendsData.reverse(),
    };
  }
}

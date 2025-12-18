import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Activity } from '../../activity/activity.entity';
import { User } from '../../users/user.entity';
import { ReportingPeriod } from '../../reporting-periods/reporting-period.entity';
import { UserStatus } from '../../users/user-status.enum';
import { ComparisonResponse } from '../dto/report-responses.dto';

@Injectable()
export class ComparisonCalculator {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async calculate(
    currentPeriod: ReportingPeriod,
    previousPeriod: ReportingPeriod,
    currentActivities: Activity[],
    previousActivities: Activity[],
    entityIds: string[],
    canViewReports: boolean,
    isUserFiltered: boolean,
  ): Promise<ComparisonResponse> {
    let usersInScope: User[] = [];
    if (canViewReports && !isUserFiltered) {
      usersInScope = await this.userRepo.find({
        where: { entity_id: In(entityIds), status: UserStatus.ACTIVE },
      });
    }

    const formatDate = (date: string) => {
      const d = new Date(date);
      return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    };

    const getPeriodData = (period: ReportingPeriod, activities: Activity[]) => {
      const totalExpenses = activities.reduce((sum, a) => {
        return sum + (a.expenseAmount ? parseFloat(a.expenseAmount) : 0);
      }, 0);

      let usersExpected = 0;
      let usersActive = 0;

      if (canViewReports && !isUserFiltered) {
        usersExpected = usersInScope.length;
        usersActive = new Set(activities.map((a) => a.userId)).size;
      } else {
        usersExpected = 1;
        usersActive = activities.length > 0 ? 1 : 0;
      }

      const complianceRate = usersExpected > 0 ? usersActive / usersExpected : 0;

      return {
        periodId: period.id,
        dates: `${formatDate(period.startDate)}-${formatDate(period.endDate)}`,
        activities: activities.length,
        expenses: Math.round(totalExpenses * 100) / 100,
        complianceRate: Math.round(complianceRate * 100) / 100,
        usersActive,
      };
    };

    const current = getPeriodData(currentPeriod, currentActivities);
    const previous = getPeriodData(previousPeriod, previousActivities);

    const calculateChange = (current: number, previous: number) => {
      const value = current - previous;
      const percent = previous !== 0 ? (value / previous) * 100 : 0;
      return {
        value: Math.round(value * 100) / 100,
        percent: Math.round(percent * 100) / 100,
      };
    };

    return {
      current,
      previous,
      changes: {
        activities: calculateChange(current.activities, previous.activities),
        expenses: calculateChange(current.expenses, previous.expenses),
        complianceRate: calculateChange(current.complianceRate, previous.complianceRate),
        usersActive: calculateChange(current.usersActive, previous.usersActive),
      },
    };
  }
}

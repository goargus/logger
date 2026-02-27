import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Activity } from '../../activity/activity.entity';
import { User } from '../../users/user.entity';
import { Entity } from '../../entities/entity.entity';
import { UserStatus } from '../../users/user-status.enum';
import { SummaryResponse } from '../dto/report-responses.dto';
import { getCurrentDateString } from '../../common/date.utils';

@Injectable()
export class SummaryCalculator {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Entity)
    private readonly entityRepo: Repository<Entity>,
  ) {}

  async calculate(
    activities: Activity[],
    targetEntityId: string,
    entityIds: string[],
    canViewReports: boolean,
    isUserFiltered: boolean,
    timeScope: {
      dateFrom?: string;
      dateTo?: string;
    },
  ): Promise<SummaryResponse> {
    const scope: 'personal' | 'entity' = canViewReports && !isUserFiltered ? 'entity' : 'personal';

    const totalActivities = activities.length;
    const totalExpenses = activities.reduce((sum, a) => {
      return sum + (a.expenseAmount ? parseFloat(a.expenseAmount) : 0);
    }, 0);

    let usersExpected = 0;
    let usersSubmitted = 0;
    let complianceRate = 0;

    if (canViewReports && !isUserFiltered) {
      const usersInScope = await this.userRepo.find({
        where: { entity_id: In(entityIds), status: UserStatus.ACTIVE },
      });
      usersExpected = usersInScope.length;

      const userIdsWithActivities = new Set(activities.map((a) => a.userId));
      usersSubmitted = userIdsWithActivities.size;
      complianceRate = usersExpected > 0 ? usersSubmitted / usersExpected : 0;
    } else {
      usersExpected = 1;
      usersSubmitted = totalActivities > 0 ? 1 : 0;
      complianceRate = usersSubmitted;
    }

    const entity = await this.entityRepo.findOne({ where: { id: targetEntityId } });
    if (!entity) {
      throw new NotFoundException('Entity not found');
    }

    return {
      period: {
        id: '',
        startDate: timeScope.dateFrom || '',
        endDate: timeScope.dateTo || '',
        status: timeScope.dateTo && timeScope.dateTo < getCurrentDateString() ? 'locked' : 'active',
      },
      scope,
      entity: {
        id: entity.id,
        name: entity.name,
        type: entity.type,
      },
      totals: {
        activities: totalActivities,
        expenses: Math.round(totalExpenses * 100) / 100,
        usersExpected,
        usersSubmitted,
        complianceRate: Math.round(complianceRate * 100) / 100,
      },
    };
  }
}

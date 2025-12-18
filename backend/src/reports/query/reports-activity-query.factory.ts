import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Activity } from '../../activity/activity.entity';
import { ActivityStatus } from '../../activity/activity-status.enum';

@Injectable()
export class ReportsActivityQueryFactory {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
  ) {}

  buildActivityQuery(
    actorUserId: string,
    entityIds: string[],
    timeScope: { periodIds?: string[]; dateFrom?: string; dateTo?: string },
    filterUserId?: string,
  ): SelectQueryBuilder<Activity> {
    const qb = this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .leftJoinAndSelect('user.entity', 'entity')
      .leftJoinAndSelect('activity.activityType', 'activityType')
      .where('activity.status = :status', { status: ActivityStatus.ACTIVE });

    if (filterUserId) {
      qb.andWhere('activity.userId = :filterUserId', { filterUserId });
    } else {
      qb.andWhere('user.entity_id IN (:...entityIds)', { entityIds });
    }

    if (timeScope.periodIds) {
      qb.andWhere('activity.reportingPeriodId IN (:...periodIds)', {
        periodIds: timeScope.periodIds,
      });
    } else if (timeScope.dateFrom && timeScope.dateTo) {
      qb.andWhere('activity.activityDate BETWEEN :dateFrom AND :dateTo', {
        dateFrom: timeScope.dateFrom,
        dateTo: timeScope.dateTo,
      });
    }

    return qb;
  }
}

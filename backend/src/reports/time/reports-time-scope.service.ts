import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportingPeriod } from '../../reporting-periods/reporting-period.entity';
import { ReportingPeriodStatus } from '../../reporting-periods/reporting-period-status.enum';
import { ReportQueryDto } from '../dto/report-query.dto';

@Injectable()
export class ReportsTimeScopeService {
  constructor(
    @InjectRepository(ReportingPeriod)
    private readonly periodRepo: Repository<ReportingPeriod>,
  ) {}

  async getOrDetermineTimeScope(
    query: ReportQueryDto,
    userEntityId: string,
  ): Promise<{
    periodIds?: string[];
    dateFrom?: string;
    dateTo?: string;
    period?: ReportingPeriod;
  }> {
    if (query.periodId) {
      const period = await this.periodRepo.findOne({
        where: { id: query.periodId },
      });
      if (!period) {
        throw new NotFoundException('Reporting period not found');
      }
      return { periodIds: [query.periodId], period };
    }

    if (query.dateFrom && query.dateTo) {
      return { dateFrom: query.dateFrom, dateTo: query.dateTo };
    }

    const activePeriod = await this.periodRepo.findOne({
      where: { entityId: userEntityId, status: ReportingPeriodStatus.ACTIVE },
    });

    if (!activePeriod) {
      throw new NotFoundException('No active reporting period found for your entity');
    }

    return { periodIds: [activePeriod.id], period: activePeriod };
  }
}

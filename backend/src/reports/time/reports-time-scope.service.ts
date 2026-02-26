import { Injectable } from '@nestjs/common';
import { PeriodCalculator } from '../../periods/period-calculator';
import { ReportQueryDto } from '../dto/report-query.dto';

@Injectable()
export class ReportsTimeScopeService {
  constructor(private readonly periodCalculator: PeriodCalculator) {}

  getOrDetermineTimeScope(
    query: ReportQueryDto,
    _userEntityId: string,
  ): {
    dateFrom: string;
    dateTo: string;
  } {
    if (query.dateFrom && query.dateTo) {
      return { dateFrom: query.dateFrom, dateTo: query.dateTo };
    }

    const currentPeriod = this.periodCalculator.getCurrentPeriod();
    return { dateFrom: currentPeriod.startDate, dateTo: currentPeriod.endDate };
  }
}

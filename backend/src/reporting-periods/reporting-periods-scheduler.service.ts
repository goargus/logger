import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReportingPeriodsService } from './reporting-periods.service';

@Injectable()
export class ReportingPeriodsSchedulerService {
  private readonly logger = new Logger(ReportingPeriodsSchedulerService.name);
  private readonly SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

  constructor(private readonly reportingPeriodsService: ReportingPeriodsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyPeriodTransition() {
    this.logger.log('Starting daily reporting period transition check');

    try {
      const transitioned = await this.reportingPeriodsService.transitionExpiredPeriods(
        this.SYSTEM_USER_ID,
      );

      this.logger.log(`Daily transition complete: ${transitioned} periods transitioned`);
    } catch (error) {
      this.logger.error('Error during daily period transition:', error);
    }
  }

  async triggerManualTransition(actorUserId: string): Promise<number> {
    this.logger.log(`Manual period transition triggered by user ${actorUserId}`);

    try {
      const transitioned = await this.reportingPeriodsService.transitionExpiredPeriods(actorUserId);

      this.logger.log(`Manual transition complete: ${transitioned} periods transitioned`);
      return transitioned;
    } catch (error) {
      this.logger.error('Error during manual period transition:', error);
      throw error;
    }
  }
}

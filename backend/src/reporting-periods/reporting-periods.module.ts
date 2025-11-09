import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportingPeriodsService } from './reporting-periods.service';
import { ReportingPeriodsController } from './reporting-periods.controller';
import { ReportingPeriodsSchedulerService } from './reporting-periods-scheduler.service';
import { ReportingPeriod } from './reporting-period.entity';
import { ReportingPeriodException } from './reporting-period-exception.entity';
import { AuthModule } from '../auth/auth.modules';
import { Term } from '../terms/term.entity';
import { Entity } from '../entities/entity.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportingPeriod, ReportingPeriodException, Term, Entity, User]),
    ScheduleModule.forRoot(),
    AuthModule,
  ],
  controllers: [ReportingPeriodsController],
  providers: [ReportingPeriodsService, ReportingPeriodsSchedulerService],
  exports: [ReportingPeriodsService],
})
export class ReportingPeriodsModule {}

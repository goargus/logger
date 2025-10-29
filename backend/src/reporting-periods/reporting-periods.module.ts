import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportingPeriodsService } from './reporting-periods.service';
import { ReportingPeriodsController } from './reporting-periods.controller';
import { ReportingPeriodsSchedulerService } from './reporting-periods-scheduler.service';
import { ReportingPeriod } from './reporting-period.entity';
import { AuthModule } from '../auth/auth.modules';
import { Term } from '../terms/term.entity';
import { Entity } from '../entities/entity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportingPeriod, Term, Entity]),
    ScheduleModule.forRoot(),
    AuthModule,
  ],
  controllers: [ReportingPeriodsController],
  providers: [ReportingPeriodsService, ReportingPeriodsSchedulerService],
  exports: [ReportingPeriodsService],
})
export class ReportingPeriodsModule {}

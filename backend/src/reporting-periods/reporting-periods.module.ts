import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportingPeriodsService } from './reporting-periods.service';
import { ReportingPeriodsController } from './reporting-periods.controller';
import { ReportingPeriod } from './reporting-period.entity';
import { AuthModule } from '../auth/auth.modules';

@Module({
  imports: [TypeOrmModule.forFeature([ReportingPeriod]), AuthModule],
  controllers: [ReportingPeriodsController],
  providers: [ReportingPeriodsService],
  exports: [ReportingPeriodsService],
})
export class ReportingPeriodsModule {}

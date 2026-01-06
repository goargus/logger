import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Activity } from '../activity/activity.entity';
import { User } from '../users/user.entity';
import { Entity } from '../entities/entity.entity';
import { ReportingPeriod } from '../reporting-periods/reporting-period.entity';
import { ActivityType } from '../activities-type/activity-type.entity';
import { UserRoleAssignment } from '../roles/user-role-assignment.entity';
import { AuthModule } from '../auth/auth.modules';
import { ReportsAccessService } from './access/reports-access.service';
import { ReportsTimeScopeService } from './time/reports-time-scope.service';
import { ReportsActivityQueryFactory } from './query/reports-activity-query.factory';
import { SummaryCalculator } from './calculators/summary.calculator';
import { BreakdownsCalculator } from './calculators/breakdowns.calculator';
import { ComplianceCalculator } from './calculators/compliance.calculator';
import { TrendsCalculator } from './calculators/trends.calculator';
import { ComparisonCalculator } from './calculators/comparison.calculator';
import { RankingsCalculator } from './calculators/rankings.calculator';
import { ExpensesCalculator } from './calculators/expenses.calculator';
import { PeriodBoundaryCalculator } from './time/period-boundary.calculator';
import { BreakdownComparisonCalculator } from './calculators/breakdown-comparison.calculator';
import { HierarchyBreakdownCalculator } from './calculators/hierarchy-breakdown.calculator';
import { CsvExporter } from './export/csv-exporter';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Activity,
      User,
      Entity,
      ReportingPeriod,
      ActivityType,
      UserRoleAssignment,
    ]),
    AuthModule,
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportsAccessService,
    ReportsTimeScopeService,
    ReportsActivityQueryFactory,
    SummaryCalculator,
    BreakdownsCalculator,
    ComplianceCalculator,
    TrendsCalculator,
    ComparisonCalculator,
    RankingsCalculator,
    ExpensesCalculator,
    PeriodBoundaryCalculator,
    BreakdownComparisonCalculator,
    HierarchyBreakdownCalculator,
    CsvExporter,
  ],
  exports: [ReportsService],
})
export class ReportsModule {}

import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { ReportingPeriod } from '../reporting-periods/reporting-period.entity';
import { Activity } from '../activity/activity.entity';
import { ReportQueryDto, RankingsQueryDto } from './dto/report-query.dto';
import { PermissionsService } from '../auth/permissions/permissions.service';
import { Permission } from '../auth/permissions/permission.enum';
import {
  SummaryResponse,
  BreakdownsResponse,
  ComplianceResponse,
  TrendsResponse,
  ComparisonResponse,
  RankingsResponse,
  ExpensesResponse,
  BreakdownsComparisonResponse,
} from './dto/report-responses.dto';
import { UserActivitiesQueryDto, UserActivitiesResponse } from './dto/user-activities.dto';
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
import { ReportPeriodType } from './enums/report-period-type.enum';
import {
  ExportReportQueryDto,
  ExportFormat,
  ExportReportType,
  ExportResult,
} from './dto/export-report.dto';
import {
  UsersReportQueryDto,
  UsersReportResponse,
  UserReportItem,
  ComplianceFilter,
} from './dto/users-report.dto';
import { CsvExporter } from './export/csv-exporter';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ReportingPeriod)
    private readonly periodRepo: Repository<ReportingPeriod>,
    private readonly accessService: ReportsAccessService,
    private readonly timeScopeService: ReportsTimeScopeService,
    private readonly queryFactory: ReportsActivityQueryFactory,
    private readonly summaryCalculator: SummaryCalculator,
    private readonly breakdownsCalculator: BreakdownsCalculator,
    private readonly complianceCalculator: ComplianceCalculator,
    private readonly trendsCalculator: TrendsCalculator,
    private readonly comparisonCalculator: ComparisonCalculator,
    private readonly rankingsCalculator: RankingsCalculator,
    private readonly expensesCalculator: ExpensesCalculator,
    private readonly periodBoundaryCalculator: PeriodBoundaryCalculator,
    private readonly breakdownComparisonCalculator: BreakdownComparisonCalculator,
    private readonly hierarchyBreakdownCalculator: HierarchyBreakdownCalculator,
    private readonly csvExporter: CsvExporter,
    private readonly permissionsService: PermissionsService,
  ) {}

  /**
   * Check if user has REPORT_VIEW_HIERARCHY permission at any of their assigned entities.
   */
  private async canViewReports(userId: string): Promise<boolean> {
    return this.permissionsService.userHasPermission(userId, Permission.REPORT_VIEW_HIERARCHY);
  }

  async getSummary(actorUserId: string, query: ReportQueryDto): Promise<SummaryResponse> {
    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
      relations: ['entity'],
    });

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const canViewReports = await this.canViewReports(actorUserId);

    const targetEntityId = query.entityId || actor.entity_id;
    if (query.entityId && canViewReports) {
      const isInScope = await this.accessService.validateEntityInUserScope(
        actorUserId,
        query.entityId,
      );
      if (!isInScope) {
        throw new ForbiddenException('Entity is not in your scope');
      }
    } else if (query.entityId && !canViewReports) {
      throw new ForbiddenException('You do not have permission to view entity reports');
    }

    if (query.userId) {
      if (!canViewReports && query.userId !== actorUserId) {
        throw new ForbiddenException('You can only view your own data');
      }
      if (canViewReports) {
        const isInScope = await this.accessService.validateUserInScope(actorUserId, query.userId);
        if (!isInScope) {
          throw new ForbiddenException('User is not in your scope');
        }
      }
    }

    const entityIds =
      canViewReports && !query.userId
        ? await this.accessService.getEntityHierarchy(targetEntityId)
        : [targetEntityId];

    const timeScope = await this.timeScopeService.getOrDetermineTimeScope(query, actor.entity_id);
    const filterUserId = query.userId || (!canViewReports ? actorUserId : undefined);
    const qb = this.queryFactory.buildActivityQuery(
      actorUserId,
      entityIds,
      timeScope,
      filterUserId,
    );

    const activities = await qb.getMany();

    const summary = await this.summaryCalculator.calculate(
      activities,
      targetEntityId,
      entityIds,
      canViewReports,
      !!filterUserId,
      timeScope,
    );

    // Include hierarchy breakdown if requested and user has permission
    if (query.includeHierarchyBreakdown && canViewReports && !filterUserId) {
      const breakdown = await this.hierarchyBreakdownCalculator.calculate(activities, entityIds);
      return {
        ...summary,
        hierarchyBreakdown: breakdown,
      };
    }

    return summary;
  }

  async getBreakdowns(actorUserId: string, query: ReportQueryDto): Promise<BreakdownsResponse> {
    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
      relations: ['entity'],
    });

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const canViewReports = await this.canViewReports(actorUserId);

    const targetEntityId = query.entityId || actor.entity_id;
    if (query.entityId && canViewReports) {
      const isInScope = await this.accessService.validateEntityInUserScope(
        actorUserId,
        query.entityId,
      );
      if (!isInScope) {
        throw new ForbiddenException('Entity is not in your scope');
      }
    } else if (query.entityId && !canViewReports) {
      throw new ForbiddenException('You do not have permission to view entity reports');
    }

    if (query.userId) {
      if (!canViewReports && query.userId !== actorUserId) {
        throw new ForbiddenException('You can only view your own data');
      }
      if (canViewReports) {
        const isInScope = await this.accessService.validateUserInScope(actorUserId, query.userId);
        if (!isInScope) {
          throw new ForbiddenException('User is not in your scope');
        }
      }
    }

    const entityIds =
      canViewReports && !query.userId
        ? await this.accessService.getEntityHierarchy(targetEntityId)
        : [targetEntityId];

    const timeScope = await this.timeScopeService.getOrDetermineTimeScope(query, actor.entity_id);
    const filterUserId = query.userId || (!canViewReports ? actorUserId : undefined);
    const qb = this.queryFactory.buildActivityQuery(
      actorUserId,
      entityIds,
      timeScope,
      filterUserId,
    );

    const activities = await qb.getMany();

    return this.breakdownsCalculator.calculate(activities, canViewReports, !!filterUserId);
  }

  async getCompliance(actorUserId: string, query: ReportQueryDto): Promise<ComplianceResponse> {
    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
      relations: ['entity'],
    });

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const canViewReports = await this.canViewReports(actorUserId);
    if (!canViewReports) {
      throw new ForbiddenException('You do not have permission to view compliance reports');
    }

    const targetEntityId = query.entityId || actor.entity_id;
    if (query.entityId) {
      const isInScope = await this.accessService.validateEntityInUserScope(
        actorUserId,
        query.entityId,
      );
      if (!isInScope) {
        throw new ForbiddenException('Entity is not in your scope');
      }
    }

    const entityIds = await this.accessService.getEntityHierarchy(targetEntityId);
    const timeScope = await this.timeScopeService.getOrDetermineTimeScope(query, actor.entity_id);

    const qb = this.queryFactory.buildActivityQuery(actorUserId, entityIds, timeScope);
    const activities = await qb.getMany();

    return this.complianceCalculator.calculate(activities, entityIds);
  }

  async getTrends(actorUserId: string, query: ReportQueryDto): Promise<TrendsResponse> {
    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
      relations: ['entity'],
    });

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const canViewReports = await this.canViewReports(actorUserId);
    const targetEntityId = query.entityId || actor.entity_id;

    if (query.entityId && canViewReports) {
      const isInScope = await this.accessService.validateEntityInUserScope(
        actorUserId,
        query.entityId,
      );
      if (!isInScope) {
        throw new ForbiddenException('Entity is not in your scope');
      }
    } else if (query.entityId && !canViewReports) {
      throw new ForbiddenException('You do not have permission to view entity reports');
    }

    const periods = await this.periodRepo.find({
      where: { entityId: targetEntityId },
      order: { startDate: 'DESC' },
      take: 5,
    });

    if (periods.length === 0) {
      throw new NotFoundException('No reporting periods found');
    }

    const entityIds =
      canViewReports && !query.userId
        ? await this.accessService.getEntityHierarchy(targetEntityId)
        : [targetEntityId];

    const periodsData = await Promise.all(
      periods.map(async (period) => {
        const qb = this.queryFactory.buildActivityQuery(
          actorUserId,
          entityIds,
          { periodIds: [period.id] },
          query.userId || (!canViewReports ? actorUserId : undefined),
        );
        const activities = await qb.getMany();

        return { period, activities };
      }),
    );

    return this.trendsCalculator.calculate(periodsData, entityIds, canViewReports, !!query.userId);
  }

  async getComparison(actorUserId: string, query: ReportQueryDto): Promise<ComparisonResponse> {
    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
      relations: ['entity'],
    });

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const canViewReports = await this.canViewReports(actorUserId);
    const targetEntityId = query.entityId || actor.entity_id;

    if (query.entityId && canViewReports) {
      const isInScope = await this.accessService.validateEntityInUserScope(
        actorUserId,
        query.entityId,
      );
      if (!isInScope) {
        throw new ForbiddenException('Entity is not in your scope');
      }
    } else if (query.entityId && !canViewReports) {
      throw new ForbiddenException('You do not have permission to view entity reports');
    }

    const periods = await this.periodRepo.find({
      where: { entityId: targetEntityId },
      order: { startDate: 'DESC' },
      take: 2,
    });

    if (periods.length < 2) {
      throw new BadRequestException('Not enough periods for comparison');
    }

    const [currentPeriod, previousPeriod] = periods;
    const entityIds =
      canViewReports && !query.userId
        ? await this.accessService.getEntityHierarchy(targetEntityId)
        : [targetEntityId];

    const currentQb = this.queryFactory.buildActivityQuery(
      actorUserId,
      entityIds,
      { periodIds: [currentPeriod.id] },
      query.userId || (!canViewReports ? actorUserId : undefined),
    );
    const currentActivities = await currentQb.getMany();

    const previousQb = this.queryFactory.buildActivityQuery(
      actorUserId,
      entityIds,
      { periodIds: [previousPeriod.id] },
      query.userId || (!canViewReports ? actorUserId : undefined),
    );
    const previousActivities = await previousQb.getMany();

    return this.comparisonCalculator.calculate(
      currentPeriod,
      previousPeriod,
      currentActivities,
      previousActivities,
      entityIds,
      canViewReports,
      !!query.userId,
    );
  }

  async getRankings(actorUserId: string, query: RankingsQueryDto): Promise<RankingsResponse> {
    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
      relations: ['entity'],
    });

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const canViewReports = await this.canViewReports(actorUserId);
    if (!canViewReports) {
      throw new ForbiddenException('You do not have permission to view rankings');
    }

    const targetEntityId = query.entityId || actor.entity_id;
    if (query.entityId) {
      const isInScope = await this.accessService.validateEntityInUserScope(
        actorUserId,
        query.entityId,
      );
      if (!isInScope) {
        throw new ForbiddenException('Entity is not in your scope');
      }
    }

    const entityIds = await this.accessService.getEntityHierarchy(targetEntityId);
    const timeScope = await this.timeScopeService.getOrDetermineTimeScope(query, actor.entity_id);
    const limit = query.limit || 5;

    const qb = this.queryFactory.buildActivityQuery(actorUserId, entityIds, timeScope);
    const activities = await qb.getMany();

    const recentPeriods = await this.periodRepo.find({
      where: { entityId: targetEntityId },
      order: { startDate: 'DESC' },
      take: 3,
    });

    return this.rankingsCalculator.calculate(activities, entityIds, recentPeriods, limit);
  }

  async getExpenses(actorUserId: string, query: ReportQueryDto): Promise<ExpensesResponse> {
    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
      relations: ['entity'],
    });

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const canViewReports = await this.canViewReports(actorUserId);
    const targetEntityId = query.entityId || actor.entity_id;

    if (query.entityId && canViewReports) {
      const isInScope = await this.accessService.validateEntityInUserScope(
        actorUserId,
        query.entityId,
      );
      if (!isInScope) {
        throw new ForbiddenException('Entity is not in your scope');
      }
    } else if (query.entityId && !canViewReports) {
      throw new ForbiddenException('You do not have permission to view entity reports');
    }

    if (query.userId) {
      if (!canViewReports && query.userId !== actorUserId) {
        throw new ForbiddenException('You can only view your own data');
      }
      if (canViewReports) {
        const isInScope = await this.accessService.validateUserInScope(actorUserId, query.userId);
        if (!isInScope) {
          throw new ForbiddenException('User is not in your scope');
        }
      }
    }

    const entityIds =
      canViewReports && !query.userId
        ? await this.accessService.getEntityHierarchy(targetEntityId)
        : [targetEntityId];

    const timeScope = await this.timeScopeService.getOrDetermineTimeScope(query, actor.entity_id);
    const qb = this.queryFactory.buildActivityQuery(
      actorUserId,
      entityIds,
      timeScope,
      query.userId || (!canViewReports ? actorUserId : undefined),
    );

    const activities = await qb.getMany();

    return this.expensesCalculator.calculate(activities, canViewReports, !!query.userId);
  }

  async getBreakdownsWithComparison(
    actorUserId: string,
    query: ReportQueryDto,
  ): Promise<BreakdownsComparisonResponse> {
    if (!query.periodType || !query.year) {
      throw new BadRequestException('periodType and year are required for comparison');
    }

    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
      relations: ['entity'],
    });

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const canViewReports = await this.canViewReports(actorUserId);
    const targetEntityId = query.entityId || actor.entity_id;

    if (query.entityId && canViewReports) {
      const isInScope = await this.accessService.validateEntityInUserScope(
        actorUserId,
        query.entityId,
      );
      if (!isInScope) {
        throw new ForbiddenException('Entity is not in your scope');
      }
    } else if (query.entityId && !canViewReports) {
      throw new ForbiddenException('You do not have permission to view entity reports');
    }

    if (query.userId) {
      if (!canViewReports && query.userId !== actorUserId) {
        throw new ForbiddenException('You can only view your own data');
      }
      if (canViewReports) {
        const isInScope = await this.accessService.validateUserInScope(actorUserId, query.userId);
        if (!isInScope) {
          throw new ForbiddenException('User is not in your scope');
        }
      }
    }

    const entityIds =
      canViewReports && !query.userId
        ? await this.accessService.getEntityHierarchy(targetEntityId)
        : [targetEntityId];

    const periodIndex = this.periodBoundaryCalculator.getPeriodIndexFromQuery(
      query.periodType,
      query.month,
      query.quarter,
      query.half,
    );

    const currentPeriod = this.periodBoundaryCalculator.calculateBoundaries(
      query.periodType,
      query.year,
      periodIndex,
    );

    const previousRef = this.periodBoundaryCalculator.getPreviousPeriod(
      query.periodType,
      query.year,
      periodIndex,
    );

    const previousPeriod = this.periodBoundaryCalculator.calculateBoundaries(
      query.periodType,
      previousRef.year,
      previousRef.periodIndex,
    );

    const currentQb = this.queryFactory.buildActivityQuery(
      actorUserId,
      entityIds,
      {
        dateFrom: currentPeriod.dateFrom.toISOString(),
        dateTo: currentPeriod.dateTo.toISOString(),
      },
      query.userId || (!canViewReports ? actorUserId : undefined),
    );
    const currentActivities = await currentQb.getMany();

    const previousQb = this.queryFactory.buildActivityQuery(
      actorUserId,
      entityIds,
      {
        dateFrom: previousPeriod.dateFrom.toISOString(),
        dateTo: previousPeriod.dateTo.toISOString(),
      },
      query.userId || (!canViewReports ? actorUserId : undefined),
    );
    const previousActivities = await previousQb.getMany();

    return this.breakdownComparisonCalculator.calculate(
      currentActivities,
      previousActivities,
      currentPeriod,
      previousPeriod,
      canViewReports,
      !!query.userId,
    );
  }

  async getUserActivities(
    actorUserId: string,
    targetUserId: string,
    query: UserActivitiesQueryDto,
  ): Promise<UserActivitiesResponse> {
    // Load actor to check permissions
    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
      relations: ['entity'],
    });

    if (!actor) {
      throw new NotFoundException('Actor user not found');
    }

    // Load target user with role and entity
    const targetUser = await this.userRepo.findOne({
      where: { id: targetUserId },
      relations: ['role', 'entity'],
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Check access: actor can view own data OR actor can view reports AND target is in hierarchy
    const isOwnData = actorUserId === targetUserId;
    const canViewReports = await this.canViewReports(actorUserId);

    if (!isOwnData) {
      if (!canViewReports) {
        throw new ForbiddenException("You do not have permission to view other users' activities");
      }

      const isInScope = await this.accessService.validateUserInScope(actorUserId, targetUserId);
      if (!isInScope) {
        throw new ForbiddenException('Target user is not in your hierarchy');
      }
    }

    // Build time scope
    const timeScope = query.periodId
      ? { periodIds: [query.periodId] }
      : query.dateFrom && query.dateTo
        ? { dateFrom: query.dateFrom, dateTo: query.dateTo }
        : await this.timeScopeService.getOrDetermineTimeScope({}, targetUser.entity_id);

    // Query activities for the target user
    const qb = this.queryFactory.buildActivityQuery(
      actorUserId,
      [targetUser.entity_id],
      timeScope,
      targetUserId,
    );

    // Get total count for pagination
    const total = await qb.getCount();

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    qb.orderBy('activity.activityDate', 'DESC')
      .addOrderBy('activity.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    const activities = await qb.getMany();

    // Calculate totals (from all activities, not paginated)
    const totalsQb = this.queryFactory.buildActivityQuery(
      actorUserId,
      [targetUser.entity_id],
      timeScope,
      targetUserId,
    );
    const allActivities = await totalsQb.getMany();
    const totalExpenses = allActivities.reduce((sum, a) => {
      return sum + (a.hasExpense && a.expenseAmount ? parseFloat(a.expenseAmount) : 0);
    }, 0);

    return {
      user: {
        id: targetUser.id,
        name:
          targetUser.full_name ||
          `${targetUser.first_name || ''} ${targetUser.family_name || ''}`.trim() ||
          targetUser.username,
        email: targetUser.email,
        entityName: targetUser.entity?.name || 'Unknown',
        entityType: targetUser.entity?.type || 'Unknown',
        roleName: targetUser.role?.name || 'Unknown',
      },
      activities: activities.map((a) => ({
        id: a.id,
        date: a.activityDate,
        typeName: a.activityType?.name || 'Unknown',
        typeId: a.activityTypeId,
        description: a.description,
        hasExpense: a.hasExpense,
        expenseAmount: a.expenseAmount,
        status: a.status,
        createdAt: a.createdAt.toISOString(),
      })),
      totals: {
        count: total,
        expenses: totalExpenses,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async exportReport(actorUserId: string, query: ExportReportQueryDto): Promise<ExportResult> {
    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
      relations: ['entity'],
    });

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const canViewReports = await this.canViewReports(actorUserId);
    const targetEntityId = query.entityId || actor.entity_id;

    // Validate entity access if specified
    if (query.entityId && canViewReports) {
      const isInScope = await this.accessService.validateEntityInUserScope(
        actorUserId,
        query.entityId,
      );
      if (!isInScope) {
        throw new ForbiddenException('Entity is not in your scope');
      }
    } else if (query.entityId && !canViewReports) {
      throw new ForbiddenException('You do not have permission to view entity reports');
    }

    // Get entity IDs based on permission
    const entityIds = canViewReports
      ? await this.accessService.getEntityHierarchy(targetEntityId)
      : [targetEntityId];

    // Determine time scope
    const timeScope = query.periodId
      ? { periodIds: [query.periodId] }
      : query.dateFrom && query.dateTo
        ? { dateFrom: query.dateFrom, dateTo: query.dateTo }
        : await this.timeScopeService.getOrDetermineTimeScope({}, actor.entity_id);

    const dateStr = new Date().toISOString().split('T')[0];
    let data: string | object;
    let filename: string;
    let contentType: string;

    switch (query.reportType) {
      case ExportReportType.ACTIVITIES: {
        const qb = this.queryFactory.buildActivityQuery(
          actorUserId,
          entityIds,
          timeScope,
          !canViewReports ? actorUserId : undefined,
        );
        const activities = await qb.getMany();

        if (query.format === ExportFormat.CSV) {
          data = this.csvExporter.exportActivities(activities);
          filename = `actividades-${dateStr}.csv`;
          contentType = 'text/csv; charset=utf-8';
        } else {
          data = activities.map((a) => ({
            date: a.activityDate,
            userName:
              a.user?.full_name ||
              `${a.user?.first_name || ''} ${a.user?.family_name || ''}`.trim(),
            userEmail: a.user?.email,
            entityName: a.user?.entity?.name,
            activityType: a.activityType?.name,
            description: a.description,
            hasExpense: a.hasExpense,
            expenseAmount: a.expenseAmount,
            status: a.status,
            createdAt: a.createdAt?.toISOString(),
          }));
          filename = `actividades-${dateStr}.json`;
          contentType = 'application/json; charset=utf-8';
        }
        break;
      }

      case ExportReportType.SUMMARY: {
        const summaryQuery = {
          entityId: query.entityId,
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
          periodId: query.periodId,
          includeHierarchyBreakdown: query.includeHierarchy ?? true,
        };
        const summary = await this.getSummary(actorUserId, summaryQuery);

        if (query.format === ExportFormat.CSV) {
          data = this.csvExporter.exportSummary(summary);
          filename = `resumen-${dateStr}.csv`;
          contentType = 'text/csv; charset=utf-8';
        } else {
          data = summary;
          filename = `resumen-${dateStr}.json`;
          contentType = 'application/json; charset=utf-8';
        }
        break;
      }

      case ExportReportType.COMPLIANCE: {
        if (!canViewReports) {
          throw new ForbiddenException('You do not have permission to export compliance reports');
        }

        const complianceQuery = {
          entityId: query.entityId,
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
          periodId: query.periodId,
        };
        const compliance = await this.getCompliance(actorUserId, complianceQuery);

        if (query.format === ExportFormat.CSV) {
          data = this.csvExporter.exportCompliance(compliance);
          filename = `cumplimiento-${dateStr}.csv`;
          contentType = 'text/csv; charset=utf-8';
        } else {
          data = compliance;
          filename = `cumplimiento-${dateStr}.json`;
          contentType = 'application/json; charset=utf-8';
        }
        break;
      }

      default:
        throw new BadRequestException(`Unknown report type: ${query.reportType}`);
    }

    return { data, filename, contentType };
  }

  async getUsersReport(
    actorUserId: string,
    query: UsersReportQueryDto,
  ): Promise<UsersReportResponse> {
    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
      relations: ['entity'],
    });

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const canViewReports = await this.canViewReports(actorUserId);
    if (!canViewReports) {
      throw new ForbiddenException('You do not have permission to view user reports');
    }

    const targetEntityId = query.entityId || actor.entity_id;

    // Validate entity access if specified
    if (query.entityId) {
      const isInScope = await this.accessService.validateEntityInUserScope(
        actorUserId,
        query.entityId,
      );
      if (!isInScope) {
        throw new ForbiddenException('Entity is not in your scope');
      }
    }

    // Get entity hierarchy
    const entityIds = await this.accessService.getEntityHierarchy(targetEntityId);

    // Get users in hierarchy with pagination
    const { users, total } = await this.accessService.getUsersInHierarchy(entityIds, {
      page: query.page || 1,
      limit: query.limit || 20,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    // Determine time scope
    const timeScope = query.periodId
      ? { periodIds: [query.periodId] }
      : query.dateFrom && query.dateTo
        ? { dateFrom: query.dateFrom, dateTo: query.dateTo }
        : await this.timeScopeService.getOrDetermineTimeScope({}, actor.entity_id);

    // Get activities for all users in hierarchy to calculate metrics
    const activitiesQb = this.queryFactory.buildActivityQuery(actorUserId, entityIds, timeScope);
    const allActivities = await activitiesQb.getMany();

    // Calculate per-user metrics
    const userMetrics = new Map<
      string,
      { count: number; expenses: number; lastDate: string | null }
    >();

    for (const activity of allActivities) {
      const userId = activity.userId;
      const current = userMetrics.get(userId) || { count: 0, expenses: 0, lastDate: null };

      current.count++;
      if (activity.hasExpense && activity.expenseAmount) {
        current.expenses += parseFloat(activity.expenseAmount);
      }
      if (!current.lastDate || activity.activityDate > current.lastDate) {
        current.lastDate = activity.activityDate;
      }

      userMetrics.set(userId, current);
    }

    // Fetch role assignments for all users
    const userIds = users.map((u) => u.id);
    const roleAssignmentsMap = await this.accessService.getRoleAssignmentsForUsers(userIds);

    // Build user report items
    let userItems: UserReportItem[] = users.map((user) => {
      const metrics = userMetrics.get(user.id) || { count: 0, expenses: 0, lastDate: null };
      const assignments = roleAssignmentsMap.get(user.id) || [];

      return {
        userId: user.id,
        name:
          user.full_name ||
          `${user.first_name || ''} ${user.family_name || ''}`.trim() ||
          user.username,
        email: user.email,
        entityId: user.entity_id,
        entityName: user.entity?.name || 'Unknown',
        entityType: user.entity?.type || 'Unknown',
        roleId: user.role?.id || '',
        roleName: user.role?.name || 'Unknown',
        roleAssignments: assignments.map((ra) => ({
          roleId: ra.role?.id || '',
          roleName: ra.role?.name || 'Unknown',
          entityId: ra.entity?.id || '',
          entityName: ra.entity?.name || 'Unknown',
          startDate: ra.start_date,
          endDate: ra.end_date,
          isActive: ra.isActive(),
        })),
        activitiesCount: metrics.count,
        totalExpenses: metrics.expenses,
        lastActivityDate: metrics.lastDate,
        hasSubmitted: metrics.count > 0,
      };
    });

    // Apply compliance filter
    if (query.compliance === ComplianceFilter.SUBMITTED) {
      userItems = userItems.filter((u) => u.hasSubmitted);
    } else if (query.compliance === ComplianceFilter.NOT_SUBMITTED) {
      userItems = userItems.filter((u) => !u.hasSubmitted);
    }

    // Calculate summary from all users (before pagination filtering)
    const allUsersMetrics = Array.from(userMetrics.values());
    const usersWithSubmissions = allUsersMetrics.filter((m) => m.count > 0).length;

    return {
      users: userItems,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 20,
        total,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
      summary: {
        totalUsers: total,
        usersSubmitted: usersWithSubmissions,
        usersNotSubmitted: total - usersWithSubmissions,
        totalActivities: allActivities.length,
        totalExpenses: allActivities.reduce((sum, a) => {
          return sum + (a.hasExpense && a.expenseAmount ? parseFloat(a.expenseAmount) : 0);
        }, 0),
      },
    };
  }
}

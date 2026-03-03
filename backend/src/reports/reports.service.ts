import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Activity } from '../activity/activity.entity';
import { PeriodCalculator, PeriodInfo } from '../periods/period-calculator';
import { ReportQueryDto, RankingsQueryDto } from './dto/report-query.dto';
import { PermissionsService } from '../auth/permissions/permissions.service';
import { Permission } from '../auth/permissions/permission.enum';
import {
  SummaryResponse,
  BreakdownsResponse,
  EngagementResponse,
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
import { EngagementCalculator } from './calculators/engagement.calculator';
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
  UsersSortField,
  SortOrder,
  EngagementFilter,
} from './dto/users-report.dto';
import { CsvExporter } from './export/csv-exporter';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly periodCalculator: PeriodCalculator,
    private readonly accessService: ReportsAccessService,
    private readonly timeScopeService: ReportsTimeScopeService,
    private readonly queryFactory: ReportsActivityQueryFactory,
    private readonly summaryCalculator: SummaryCalculator,
    private readonly breakdownsCalculator: BreakdownsCalculator,
    private readonly engagementCalculator: EngagementCalculator,
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

  private async canViewReports(userId: string): Promise<boolean> {
    return this.permissionsService.userHasPermission(userId, Permission.REPORT_VIEW_HIERARCHY);
  }

  private async resolveReportScope(
    actorUserId: string,
    query: ReportQueryDto,
    canViewReports: boolean,
    targetEntityId: string,
  ): Promise<{
    entityIds: string[];
    filterUserId?: string;
    isUserFiltered: boolean;
  }> {
    const isEntityReport = canViewReports && !!query.entityId && !query.userId;
    const filterUserId = query.userId || (isEntityReport ? undefined : actorUserId);
    const entityIds = isEntityReport
      ? await this.accessService.getEntityHierarchy(targetEntityId)
      : [targetEntityId];

    return {
      entityIds,
      filterUserId,
      isUserFiltered: !!filterUserId,
    };
  }

  private buildEmptyComparisonResponse(): ComparisonResponse {
    return {
      current: {
        periodId: '',
        dates: '',
        activities: 0,
        expenses: 0,
        activeRate: 0,
        usersActive: 0,
      },
      previous: {
        periodId: '',
        dates: '',
        activities: 0,
        expenses: 0,
        activeRate: 0,
        usersActive: 0,
      },
      changes: {
        activities: { value: 0, percent: 0 },
        expenses: { value: 0, percent: 0 },
        activeRate: { value: 0, percent: 0 },
        usersActive: { value: 0, percent: 0 },
      },
    };
  }

  private createComparisonPeriodInfo(start: Date, end: Date, id: string): PeriodInfo {
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      periodNumber: 0,
      label: id,
    };
  }

  private resolveComparisonDateRanges(query: ReportQueryDto): {
    current: { start: Date; end: Date; id: string };
    previous: { start: Date; end: Date; id: string };
  } | null {
    if (query.periodType && query.year) {
      const periodIndex = this.periodBoundaryCalculator.getPeriodIndexFromQuery(
        query.periodType,
        query.month,
        query.quarter,
        query.half,
      );

      const current = this.periodBoundaryCalculator.calculateBoundaries(
        query.periodType,
        query.year,
        periodIndex,
      );
      const previousRef = this.periodBoundaryCalculator.getPreviousPeriod(
        query.periodType,
        query.year,
        periodIndex,
      );
      const previous = this.periodBoundaryCalculator.calculateBoundaries(
        query.periodType,
        previousRef.year,
        previousRef.periodIndex,
      );

      return {
        current: {
          start: current.dateFrom,
          end: current.dateTo,
          id: `current-${query.periodType}-${query.year}-${periodIndex}`,
        },
        previous: {
          start: previous.dateFrom,
          end: previous.dateTo,
          id: `previous-${query.periodType}-${previousRef.year}-${previousRef.periodIndex}`,
        },
      };
    }

    if (query.dateFrom && query.dateTo) {
      const currentStart = new Date(`${query.dateFrom}T00:00:00.000Z`);
      const currentEnd = new Date(`${query.dateTo}T23:59:59.999Z`);

      if (Number.isNaN(currentStart.getTime()) || Number.isNaN(currentEnd.getTime())) {
        throw new BadRequestException('Invalid date range for comparison');
      }
      if (currentStart > currentEnd) {
        throw new BadRequestException('dateFrom must be before or equal to dateTo');
      }

      const totalDays =
        Math.floor((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const previousEnd = new Date(currentStart);
      previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
      const previousStart = new Date(previousEnd);
      previousStart.setUTCDate(previousStart.getUTCDate() - (totalDays - 1));

      return {
        current: {
          start: currentStart,
          end: currentEnd,
          id: `current-range-${query.dateFrom}-${query.dateTo}`,
        },
        previous: {
          start: previousStart,
          end: previousEnd,
          id: `previous-range-${previousStart.toISOString().split('T')[0]}-${previousEnd.toISOString().split('T')[0]}`,
        },
      };
    }

    return null;
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
    } else if (query.entityId && !canViewReports && query.entityId !== actor.entity_id) {
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

    const timeScope = this.timeScopeService.getOrDetermineTimeScope(query, actor.entity_id);
    const { entityIds, filterUserId, isUserFiltered } = await this.resolveReportScope(
      actorUserId,
      query,
      canViewReports,
      targetEntityId,
    );
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
      isUserFiltered,
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

    const timeScope = this.timeScopeService.getOrDetermineTimeScope(query, actor.entity_id);
    const { entityIds, filterUserId, isUserFiltered } = await this.resolveReportScope(
      actorUserId,
      query,
      canViewReports,
      targetEntityId,
    );
    const qb = this.queryFactory.buildActivityQuery(
      actorUserId,
      entityIds,
      timeScope,
      filterUserId,
    );

    const activities = await qb.getMany();

    return this.breakdownsCalculator.calculate(activities, canViewReports, isUserFiltered);
  }

  async getEngagement(actorUserId: string, query: ReportQueryDto): Promise<EngagementResponse> {
    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
      relations: ['entity'],
    });

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const canViewReports = await this.canViewReports(actorUserId);
    if (!canViewReports) {
      throw new ForbiddenException('You do not have permission to view engagement reports');
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
    const timeScope = this.timeScopeService.getOrDetermineTimeScope(query, actor.entity_id);

    const qb = this.queryFactory.buildActivityQuery(actorUserId, entityIds, timeScope);
    const currentActivities = await qb.getMany();

    // Get previous period activities for trend calculation
    const previousPeriods = this.periodCalculator.getPreviousPeriods(1);
    let previousActivities: Activity[] = [];

    if (previousPeriods.length > 0) {
      const prevPeriod = previousPeriods[0];
      const prevQb = this.queryFactory.buildActivityQuery(actorUserId, entityIds, {
        dateFrom: prevPeriod.startDate,
        dateTo: prevPeriod.endDate,
      });
      previousActivities = await prevQb.getMany();
    }

    return this.engagementCalculator.calculate(currentActivities, previousActivities, entityIds);
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

    const periods = this.periodCalculator.getPreviousPeriods(5);

    if (periods.length === 0) {
      return { periods: [] };
    }

    const { entityIds, filterUserId, isUserFiltered } = await this.resolveReportScope(
      actorUserId,
      query,
      canViewReports,
      targetEntityId,
    );

    const periodsData = await Promise.all(
      periods.map(async (period) => {
        const qb = this.queryFactory.buildActivityQuery(
          actorUserId,
          entityIds,
          { dateFrom: period.startDate, dateTo: period.endDate },
          filterUserId,
        );
        const activities = await qb.getMany();

        return { period, activities };
      }),
    );

    return this.trendsCalculator.calculate(periodsData, entityIds, canViewReports, isUserFiltered);
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

    const { entityIds, filterUserId, isUserFiltered } = await this.resolveReportScope(
      actorUserId,
      query,
      canViewReports,
      targetEntityId,
    );
    const resolvedRanges = this.resolveComparisonDateRanges(query);

    let currentPeriod: PeriodInfo;
    let previousPeriod: PeriodInfo;
    let currentActivities: Activity[];
    let previousActivities: Activity[];

    if (resolvedRanges) {
      currentPeriod = this.createComparisonPeriodInfo(
        resolvedRanges.current.start,
        resolvedRanges.current.end,
        resolvedRanges.current.id,
      );
      previousPeriod = this.createComparisonPeriodInfo(
        resolvedRanges.previous.start,
        resolvedRanges.previous.end,
        resolvedRanges.previous.id,
      );

      const currentQb = this.queryFactory.buildActivityQuery(
        actorUserId,
        entityIds,
        {
          dateFrom: resolvedRanges.current.start.toISOString(),
          dateTo: resolvedRanges.current.end.toISOString(),
        },
        filterUserId,
      );
      currentActivities = await currentQb.getMany();

      const previousQb = this.queryFactory.buildActivityQuery(
        actorUserId,
        entityIds,
        {
          dateFrom: resolvedRanges.previous.start.toISOString(),
          dateTo: resolvedRanges.previous.end.toISOString(),
        },
        filterUserId,
      );
      previousActivities = await previousQb.getMany();
    } else {
      // Use PeriodCalculator to get current and previous period
      const currentPeriodInfo = this.periodCalculator.getCurrentPeriod();
      const previousPeriods = this.periodCalculator.getPreviousPeriods(1);

      if (previousPeriods.length === 0) {
        return this.buildEmptyComparisonResponse();
      }

      currentPeriod = currentPeriodInfo;
      previousPeriod = previousPeriods[0];

      const currentQb = this.queryFactory.buildActivityQuery(
        actorUserId,
        entityIds,
        { dateFrom: currentPeriod.startDate, dateTo: currentPeriod.endDate },
        filterUserId,
      );
      currentActivities = await currentQb.getMany();

      const previousQb = this.queryFactory.buildActivityQuery(
        actorUserId,
        entityIds,
        { dateFrom: previousPeriod.startDate, dateTo: previousPeriod.endDate },
        filterUserId,
      );
      previousActivities = await previousQb.getMany();
    }

    return this.comparisonCalculator.calculate(
      currentPeriod,
      previousPeriod,
      currentActivities,
      previousActivities,
      entityIds,
      canViewReports,
      isUserFiltered,
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
    const timeScope = this.timeScopeService.getOrDetermineTimeScope(query, actor.entity_id);
    const limit = query.limit ?? query.topN ?? 5;

    const qb = this.queryFactory.buildActivityQuery(actorUserId, entityIds, timeScope);
    const activities = await qb.getMany();

    const recentPeriods = this.periodCalculator.getPreviousPeriods(3);

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

    const timeScope = this.timeScopeService.getOrDetermineTimeScope(query, actor.entity_id);
    const { entityIds, filterUserId, isUserFiltered } = await this.resolveReportScope(
      actorUserId,
      query,
      canViewReports,
      targetEntityId,
    );
    const qb = this.queryFactory.buildActivityQuery(
      actorUserId,
      entityIds,
      timeScope,
      filterUserId,
    );

    const activities = await qb.getMany();

    return this.expensesCalculator.calculate(activities, canViewReports, isUserFiltered);
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

    const { entityIds, filterUserId, isUserFiltered } = await this.resolveReportScope(
      actorUserId,
      query,
      canViewReports,
      targetEntityId,
    );

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
      filterUserId,
    );
    const currentActivities = await currentQb.getMany();

    const previousQb = this.queryFactory.buildActivityQuery(
      actorUserId,
      entityIds,
      {
        dateFrom: previousPeriod.dateFrom.toISOString(),
        dateTo: previousPeriod.dateTo.toISOString(),
      },
      filterUserId,
    );
    const previousActivities = await previousQb.getMany();

    return this.breakdownComparisonCalculator.calculate(
      currentActivities,
      previousActivities,
      currentPeriod,
      previousPeriod,
      canViewReports,
      isUserFiltered,
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
    const timeScope =
      query.dateFrom && query.dateTo
        ? { dateFrom: query.dateFrom, dateTo: query.dateTo }
        : this.timeScopeService.getOrDetermineTimeScope({}, targetUser.entity_id);

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
    const isEntityReport = canViewReports && !!query.entityId;
    const entityIds = isEntityReport
      ? await this.accessService.getEntityHierarchy(targetEntityId)
      : [targetEntityId];
    const filterUserId = isEntityReport ? undefined : actorUserId;

    // Determine time scope
    const timeScope =
      query.dateFrom && query.dateTo
        ? { dateFrom: query.dateFrom, dateTo: query.dateTo }
        : this.timeScopeService.getOrDetermineTimeScope({}, actor.entity_id);

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
          filterUserId,
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

      case ExportReportType.ENGAGEMENT: {
        if (!canViewReports) {
          throw new ForbiddenException('You do not have permission to export engagement reports');
        }

        const engagementQuery = {
          entityId: query.entityId,
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
        };
        const engagement = await this.getEngagement(actorUserId, engagementQuery);

        if (query.format === ExportFormat.CSV) {
          data = this.csvExporter.exportEngagement(engagement);
          filename = `participacion-${dateStr}.csv`;
          contentType = 'text/csv; charset=utf-8';
        } else {
          data = engagement;
          filename = `participacion-${dateStr}.json`;
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

    // Determine if sorting by a computed field (requires in-memory sort)
    const computedSortFields = ['activities', 'expenses', 'lastActivity', 'trend'];
    const isComputedSort = computedSortFields.includes(query.sortBy);

    // For computed sort fields, fetch all users (no pagination) so we can sort in-memory
    // For DB-sortable fields, use efficient DB-level sort + pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const { users, total: dbTotal } = await this.accessService.getUsersInHierarchy(entityIds, {
      page: isComputedSort ? 1 : page,
      limit: isComputedSort ? Number.MAX_SAFE_INTEGER : limit,
      search: query.search,
      sortBy: isComputedSort ? undefined : query.sortBy,
      sortOrder: isComputedSort ? undefined : query.sortOrder,
    });

    // Determine time scope
    const timeScope =
      query.dateFrom && query.dateTo
        ? { dateFrom: query.dateFrom, dateTo: query.dateTo }
        : this.timeScopeService.getOrDetermineTimeScope({}, actor.entity_id);

    // Get activities for all users in hierarchy to calculate metrics
    const activitiesQb = this.queryFactory.buildActivityQuery(actorUserId, entityIds, timeScope);
    const allActivities = await activitiesQb.getMany();

    // Get previous period activities for trend calculation
    const previousPeriods = this.periodCalculator.getPreviousPeriods(1);
    let previousActivities: Activity[] = [];

    if (previousPeriods.length > 0) {
      const prevPeriod = previousPeriods[0];
      const prevQb = this.queryFactory.buildActivityQuery(actorUserId, entityIds, {
        dateFrom: prevPeriod.startDate,
        dateTo: prevPeriod.endDate,
      });
      previousActivities = await prevQb.getMany();
    }

    // Build per-user previous period counts for trend
    const previousCounts = new Map<string, number>();
    for (const activity of previousActivities) {
      previousCounts.set(activity.userId, (previousCounts.get(activity.userId) || 0) + 1);
    }

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
      const previousCount = previousCounts.get(user.id) || 0;

      let trend: number | null = null;
      if (previousCount > 0) {
        trend = Math.round(((metrics.count - previousCount) / previousCount) * 100);
      }

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
        trend,
      };
    });

    // Apply engagement filter
    if (query.engagement === EngagementFilter.ACTIVE) {
      userItems = userItems.filter((u) => u.activitiesCount > 0);
    } else if (query.engagement === EngagementFilter.INACTIVE) {
      userItems = userItems.filter((u) => u.activitiesCount === 0);
    }

    // For computed sort fields, sort in-memory and paginate the result
    let total = dbTotal;
    if (isComputedSort) {
      const sortOrder = query.sortOrder === SortOrder.DESC ? -1 : 1;
      userItems.sort((a, b) => {
        switch (query.sortBy) {
          case UsersSortField.ACTIVITIES:
            return (a.activitiesCount - b.activitiesCount) * sortOrder;
          case UsersSortField.EXPENSES:
            return (a.totalExpenses - b.totalExpenses) * sortOrder;
          case UsersSortField.LAST_ACTIVITY: {
            const dateA = a.lastActivityDate || '';
            const dateB = b.lastActivityDate || '';
            return dateA.localeCompare(dateB) * sortOrder;
          }
          case UsersSortField.TREND: {
            const trendA = a.trend ?? -Infinity;
            const trendB = b.trend ?? -Infinity;
            return (trendA - trendB) * sortOrder;
          }
          default:
            return 0;
        }
      });
      total = userItems.length;
      const offset = (page - 1) * limit;
      userItems = userItems.slice(offset, offset + limit);
    }

    // Calculate summary from all users (before pagination filtering)
    const allUsersMetrics = Array.from(userMetrics.values());
    const activeUsersCount = allUsersMetrics.filter((m) => m.count > 0).length;
    const totalExpenses = allActivities.reduce((sum, a) => {
      return sum + (a.hasExpense && a.expenseAmount ? parseFloat(a.expenseAmount) : 0);
    }, 0);

    return {
      users: userItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalUsers: total,
        activeUsers: activeUsersCount,
        inactiveUsers: total - activeUsersCount,
        totalActivities: allActivities.length,
        totalExpenses,
        avgActivitiesPerUser:
          total > 0 ? Math.round((allActivities.length / total) * 100) / 100 : 0,
      },
    };
  }
}

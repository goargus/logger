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
import { ReportQueryDto, RankingsQueryDto } from './dto/report-query.dto';
import {
  SummaryResponse,
  BreakdownsResponse,
  ComplianceResponse,
  TrendsResponse,
  ComparisonResponse,
  RankingsResponse,
  ExpensesResponse,
} from './dto/report-responses.dto';
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
  ) {}

  async getSummary(actorUserId: string, query: ReportQueryDto): Promise<SummaryResponse> {
    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
      relations: ['role', 'entity'],
    });

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const canViewReports = actor.role.canViewReports;

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

    return this.summaryCalculator.calculate(
      activities,
      targetEntityId,
      entityIds,
      canViewReports,
      !!query.userId,
      timeScope,
    );
  }

  async getBreakdowns(actorUserId: string, query: ReportQueryDto): Promise<BreakdownsResponse> {
    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
      relations: ['role', 'entity'],
    });

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const canViewReports = actor.role.canViewReports;

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

    return this.breakdownsCalculator.calculate(activities, canViewReports, !!query.userId);
  }

  async getCompliance(actorUserId: string, query: ReportQueryDto): Promise<ComplianceResponse> {
    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
      relations: ['role', 'entity'],
    });

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    if (!actor.role.canViewReports) {
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
      relations: ['role', 'entity'],
    });

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const canViewReports = actor.role.canViewReports;
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
      relations: ['role', 'entity'],
    });

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const canViewReports = actor.role.canViewReports;
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
      relations: ['role', 'entity'],
    });

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    if (!actor.role.canViewReports) {
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
      relations: ['role', 'entity'],
    });

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const canViewReports = actor.role.canViewReports;
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
}

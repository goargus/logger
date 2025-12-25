import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Activity } from '../../activity/activity.entity';
import { ActivityType, GrowthDirection } from '../../activities-type/activity-type.entity';
import { User } from '../../users/user.entity';
import { UserStatus } from '../../users/user-status.enum';
import {
  BreakdownsComparisonResponse,
  TypeBreakdownWithComparison,
  EntityBreakdown,
  UserBreakdown,
  Change,
} from '../dto/report-responses.dto';
import { PeriodBoundaries } from '../time/period-boundary.calculator';

interface ActivityAggregation {
  name: string;
  count: number;
  expenses: number;
  growthDirection: GrowthDirection;
}

@Injectable()
export class BreakdownComparisonCalculator {
  constructor(
    @InjectRepository(ActivityType)
    private readonly activityTypeRepo: Repository<ActivityType>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async calculate(
    currentActivities: Activity[],
    previousActivities: Activity[],
    currentPeriod: PeriodBoundaries,
    previousPeriod: PeriodBoundaries,
    canViewReports: boolean,
    isUserFiltered: boolean,
  ): Promise<BreakdownsComparisonResponse> {
    const activityTypes = await this.activityTypeRepo.find();
    const typeGrowthMap = new Map<string, GrowthDirection>();
    for (const type of activityTypes) {
      typeGrowthMap.set(type.id, type.growth_direction);
    }

    const currentTypeMap = this.aggregateByType(currentActivities, typeGrowthMap);
    const previousTypeMap = this.aggregateByType(previousActivities, typeGrowthMap);

    const byType = this.buildTypeComparison(currentTypeMap, previousTypeMap);

    const byEntity = await this.buildEntityBreakdown(
      currentActivities,
      canViewReports,
      isUserFiltered,
    );

    const byUser = this.buildUserBreakdown(currentActivities);

    const currentTotals = this.calculateTotals(currentActivities);
    const previousTotals = this.calculateTotals(previousActivities);

    return {
      current: {
        periodLabel: currentPeriod.label,
        dateFrom: currentPeriod.dateFrom.toISOString().split('T')[0],
        dateTo: currentPeriod.dateTo.toISOString().split('T')[0],
        byType,
        byEntity,
        byUser,
      },
      previous: {
        periodLabel: previousPeriod.label,
        dateFrom: previousPeriod.dateFrom.toISOString().split('T')[0],
        dateTo: previousPeriod.dateTo.toISOString().split('T')[0],
      },
      totals: {
        current: currentTotals,
        previous: previousTotals,
        change: {
          count: this.calculateChange(currentTotals.count, previousTotals.count),
          expenses: this.calculateChange(currentTotals.expenses, previousTotals.expenses),
        },
      },
    };
  }

  private aggregateByType(
    activities: Activity[],
    typeGrowthMap: Map<string, GrowthDirection>,
  ): Map<string, ActivityAggregation> {
    const typeMap = new Map<string, ActivityAggregation>();

    for (const activity of activities) {
      const typeId = activity.activityTypeId;
      const typeName = activity.activityType?.name || 'Unknown';
      const growthDirection = typeGrowthMap.get(typeId) || GrowthDirection.POSITIVE;

      const existing = typeMap.get(typeId) || {
        name: typeName,
        count: 0,
        expenses: 0,
        growthDirection,
      };

      existing.count++;
      existing.expenses += activity.expenseAmount ? parseFloat(activity.expenseAmount) : 0;
      typeMap.set(typeId, existing);
    }

    return typeMap;
  }

  private buildTypeComparison(
    currentMap: Map<string, ActivityAggregation>,
    previousMap: Map<string, ActivityAggregation>,
  ): TypeBreakdownWithComparison[] {
    const allTypeIds = new Set([...currentMap.keys(), ...previousMap.keys()]);
    const result: TypeBreakdownWithComparison[] = [];

    for (const typeId of allTypeIds) {
      const current = currentMap.get(typeId);
      const previous = previousMap.get(typeId);

      if (!current) {
        continue;
      }

      const item: TypeBreakdownWithComparison = {
        typeId,
        name: current.name,
        count: current.count,
        expenses: Math.round(current.expenses * 100) / 100,
        growthDirection: current.growthDirection,
      };

      if (previous) {
        item.previous = {
          count: previous.count,
          expenses: Math.round(previous.expenses * 100) / 100,
        };
        item.change = {
          count: this.calculateChange(current.count, previous.count),
          expenses: this.calculateChange(current.expenses, previous.expenses),
        };
      }

      result.push(item);
    }

    return result.sort((a, b) => b.count - a.count);
  }

  private async buildEntityBreakdown(
    activities: Activity[],
    canViewReports: boolean,
    isUserFiltered: boolean,
  ): Promise<EntityBreakdown[]> {
    if (!canViewReports || isUserFiltered) {
      return [];
    }

    const entityMap = new Map<
      string,
      { name: string; type: string; count: number; expenses: number }
    >();

    for (const activity of activities) {
      const entityId = activity.user.entity_id;
      const entity = activity.user.entity;
      const existing = entityMap.get(entityId) || {
        name: entity.name,
        type: entity.type,
        count: 0,
        expenses: 0,
      };
      existing.count++;
      existing.expenses += activity.expenseAmount ? parseFloat(activity.expenseAmount) : 0;
      entityMap.set(entityId, existing);
    }

    const entityIds = Array.from(entityMap.keys());
    const allUsers = await this.userRepo.find({
      where: { entity_id: In(entityIds), status: UserStatus.ACTIVE },
    });

    const usersByEntity = new Map<string, User[]>();
    for (const user of allUsers) {
      if (!usersByEntity.has(user.entity_id)) {
        usersByEntity.set(user.entity_id, []);
      }
      usersByEntity.get(user.entity_id)!.push(user);
    }

    const result: EntityBreakdown[] = [];
    for (const [entityId, data] of entityMap.entries()) {
      const usersInEntity = usersByEntity.get(entityId) || [];
      const userIdsInEntity = usersInEntity.map((u) => u.id);
      const usersSubmitted = new Set(
        activities.filter((a) => userIdsInEntity.includes(a.userId)).map((a) => a.userId),
      ).size;

      result.push({
        entityId,
        name: data.name,
        type: data.type,
        count: data.count,
        expenses: Math.round(data.expenses * 100) / 100,
        compliance: {
          submitted: usersSubmitted,
          total: usersInEntity.length,
        },
      });
    }

    return result;
  }

  private buildUserBreakdown(activities: Activity[]): UserBreakdown[] {
    const userMap = new Map<string, { name: string; count: number; expenses: number }>();

    for (const activity of activities) {
      const userId = activity.userId;
      const userName = activity.user.full_name || activity.user.username;
      const existing = userMap.get(userId) || { name: userName, count: 0, expenses: 0 };
      existing.count++;
      existing.expenses += activity.expenseAmount ? parseFloat(activity.expenseAmount) : 0;
      userMap.set(userId, existing);
    }

    return Array.from(userMap.entries()).map(([userId, data]) => ({
      userId,
      name: data.name,
      count: data.count,
      expenses: Math.round(data.expenses * 100) / 100,
    }));
  }

  private calculateTotals(activities: Activity[]): { count: number; expenses: number } {
    let count = 0;
    let expenses = 0;

    for (const activity of activities) {
      count++;
      expenses += activity.expenseAmount ? parseFloat(activity.expenseAmount) : 0;
    }

    return {
      count,
      expenses: Math.round(expenses * 100) / 100,
    };
  }

  private calculateChange(current: number, previous: number): Change {
    const value = Math.round((current - previous) * 100) / 100;
    const percent =
      previous === 0
        ? current > 0
          ? 100
          : 0
        : Math.round(((current - previous) / previous) * 10000) / 100;

    return { value, percent };
  }
}

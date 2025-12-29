import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Activity } from '../../activity/activity.entity';
import { User } from '../../users/user.entity';
import { Entity } from '../../entities/entity.entity';
import { UserStatus } from '../../users/user-status.enum';
import { HierarchicalEntityBreakdown } from '../dto/hierarchy-breakdown.dto';

@Injectable()
export class HierarchyBreakdownCalculator {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Entity)
    private readonly entityRepo: Repository<Entity>,
  ) {}

  /**
   * Calculate per-entity breakdown of activities for hierarchical reports.
   * Groups activities by the user's entity and calculates metrics for each.
   *
   * @param activities - Array of activities to analyze
   * @param entityIds - Array of entity IDs in scope
   * @returns Array of per-entity breakdown metrics
   */
  async calculate(
    activities: Activity[],
    entityIds: string[],
  ): Promise<HierarchicalEntityBreakdown[]> {
    if (activities.length === 0) {
      return [];
    }

    // Group activities by user's entity
    const entityActivityMap = new Map<string, Activity[]>();
    for (const activity of activities) {
      const entityId = activity.user?.entity_id;
      if (!entityId) continue;

      if (!entityActivityMap.has(entityId)) {
        entityActivityMap.set(entityId, []);
      }
      entityActivityMap.get(entityId)!.push(activity);
    }

    // Get unique entity IDs that have activities
    const activeEntityIds = Array.from(entityActivityMap.keys());
    if (activeEntityIds.length === 0) {
      return [];
    }

    // Get all entities with their metadata
    const entities = await this.entityRepo.find({
      where: { id: In(activeEntityIds) },
    });

    // Get user counts per entity
    const userCounts = await this.userRepo
      .createQueryBuilder('user')
      .select('user.entity_id', 'entityId')
      .addSelect('COUNT(*)', 'count')
      .where('user.entity_id IN (:...entityIds)', { entityIds: activeEntityIds })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .groupBy('user.entity_id')
      .getRawMany();

    const userCountMap = new Map<string, number>(
      userCounts.map((r) => [r.entityId, parseInt(r.count, 10)]),
    );

    // Build breakdown per entity
    return entities.map((entity) => {
      const entityActivities = entityActivityMap.get(entity.id) || [];
      const usersExpected = userCountMap.get(entity.id) || 0;
      const usersSubmitted = new Set(entityActivities.map((a) => a.userId)).size;

      const expenses = entityActivities.reduce((sum, a) => {
        return sum + (a.expenseAmount ? parseFloat(a.expenseAmount) : 0);
      }, 0);

      return {
        entityId: entity.id,
        entityName: entity.name,
        entityType: entity.type,
        parentId: entity.parent_id || null,
        activities: entityActivities.length,
        expenses: Math.round(expenses * 100) / 100,
        usersExpected,
        usersSubmitted,
        complianceRate:
          usersExpected > 0
            ? Math.round((usersSubmitted / usersExpected) * 100) / 100
            : 0,
      };
    });
  }
}

import { EntityType } from '../../entities/entity.entity';

/**
 * Per-entity breakdown for hierarchical reports.
 * Shows aggregated metrics for each entity in the hierarchy.
 */
export interface HierarchicalEntityBreakdown {
  /** Entity UUID */
  entityId: string;

  /** Entity display name */
  entityName: string;

  /** Entity type (PLATFORM, UNION, ASSOCIATION, FIELD) */
  entityType: EntityType;

  /** Parent entity UUID, null for root entities */
  parentId: string | null;

  /** Number of activities logged by users in this entity */
  activities: number;

  /** Total expenses from activities in this entity */
  expenses: number;

  /** Total number of active users in this entity */
  totalUsers: number;

  /** Number of users who logged at least one activity */
  activeUsers: number;

  /** Active rate (activeUsers / totalUsers), 0-1 */
  activeRate: number;

  /** Average number of activities per user */
  avgActivitiesPerUser: number;
}

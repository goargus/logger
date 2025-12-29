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

  /** Number of active users expected to submit */
  usersExpected: number;

  /** Number of users who submitted at least one activity */
  usersSubmitted: number;

  /** Compliance rate (usersSubmitted / usersExpected), 0-1 */
  complianceRate: number;
}

import { EntityType } from '../entity.entity';

/**
 * Represents a node in the entity hierarchy tree.
 * Used by getHierarchyTree() to return a nested structure.
 */
export interface EntityTreeNode {
  id: string;
  name: string;
  type: EntityType;
  code?: string;
  is_active: boolean;
  children: EntityTreeNode[];
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { EntityType } from './entity.entity';

@Injectable()
export class HierarchyValidationService {
  private readonly hierarchyRules: Record<EntityType, EntityType[]> = {
    [EntityType.PLATFORM]: [],
    [EntityType.UNION]: [EntityType.PLATFORM],
    [EntityType.ASSOCIATION]: [EntityType.UNION],
    [EntityType.FIELD]: [EntityType.ASSOCIATION],
  };

  validateHierarchy(childType: EntityType, parentType?: EntityType): void {
    if (!parentType) {
      if (childType !== EntityType.PLATFORM) {
        throw new BadRequestException(
          `${childType} entities must have a parent. Only Platform entities can exist without a parent.`,
        );
      }
      return;
    }

    const allowedParents = this.hierarchyRules[childType];
    if (!allowedParents.includes(parentType)) {
      throw new BadRequestException(
        `${childType} entities can only be created under ${allowedParents.join(' or ')} entities.`,
      );
    }
  }

  getAllowedParentTypes(childType: EntityType): EntityType[] {
    return this.hierarchyRules[childType];
  }

  getAllowedChildTypes(parentType: EntityType): EntityType[] {
    return Object.entries(this.hierarchyRules)
      .filter(([_, allowedParents]) => allowedParents.includes(parentType))
      .map(([childType]) => childType as EntityType);
  }

  canHaveChildren(entityType: EntityType): boolean {
    return this.getAllowedChildTypes(entityType).length > 0;
  }
}

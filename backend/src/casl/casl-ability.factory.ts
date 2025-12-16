import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { Action, Subjects, AppAbility } from './types';
import { User } from '../users/user.entity';
import { UserRoleAssignment } from '../roles/user-role-assignment.entity';
import { Entity } from '../entities/entity.entity';
import { Activity } from '../activity/activity.entity';
import { ReportingPeriod } from '../reporting-periods/reporting-period.entity';
import { Role } from '../roles/role.entity';
import { ActivityType } from '../activities-type/activity-type.entity';
import { getCurrentDateString, isDateInRange } from '../common/date.utils';

export interface UserWithRoles extends User {
  roleAssignments?: UserRoleAssignment[];
}

@Injectable()
export class CaslAbilityFactory {
  constructor(
    @InjectRepository(UserRoleAssignment)
    private readonly userRoleAssignmentRepo: Repository<UserRoleAssignment>,
    @InjectRepository(Entity)
    private readonly entityRepo: Repository<Entity>,
  ) {}

  async createForUser(user: UserWithRoles): Promise<AppAbility> {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (!user) {
      return build();
    }

    const roleAssignments = user.roleAssignments || (await this.loadActiveRoleAssignments(user.id));

    const isSystemAdmin = roleAssignments.some((ra) => ra.role.isSystemAdmin);
    if (isSystemAdmin) {
      can(Action.Manage, 'all');
      return build();
    }

    const uniqueEntityIds = [...new Set(roleAssignments.map((ra) => ra.entity.id))];
    const entityHierarchyMap = await this.buildEntityHierarchyMap(uniqueEntityIds);

    for (const assignment of roleAssignments) {
      const role = assignment.role;
      const entityId = assignment.entity.id;

      const accessibleEntityIds = entityHierarchyMap.get(entityId) || [entityId];

      if (role.canViewReports) {
        can(Action.Read, Activity, { userId: { $in: accessibleEntityIds } } as never);
        can(Action.Read, ReportingPeriod, { entityId: { $in: accessibleEntityIds } } as never);
        can(Action.Read, Entity, { id: { $in: accessibleEntityIds } } as never);
        can(Action.Read, User, { entityId: { $in: accessibleEntityIds } } as never);
      }

      if (role.canManageOwnActivities) {
        can(Action.Create, Activity, { userId: user.id } as never);
        can(Action.Read, Activity, { userId: user.id } as never);
        can(Action.Update, Activity, { userId: user.id } as never);
        can(Action.Delete, Activity, { userId: user.id } as never);
        can(Action.Read, User, { id: user.id } as never);
        can(Action.Read, ActivityType);
        can(Action.Read, Entity, { id: entityId } as never);
        can(Action.Read, ReportingPeriod, { entityId: entityId } as never);
      }

      if (role.canManageHierarchyActivities) {
        can(Action.Create, Activity, { entityId: { $in: accessibleEntityIds } } as never);
        can(Action.Read, Activity, { entityId: { $in: accessibleEntityIds } } as never);
        can(Action.Update, Activity, { entityId: { $in: accessibleEntityIds } } as never);
        can(Action.Read, Entity, { id: { $in: accessibleEntityIds } } as never);
        can(Action.Read, User, { entityId: { $in: accessibleEntityIds } } as never);
      }

      if (role.canManageEntities) {
        can(Action.Read, Entity, { id: { $in: accessibleEntityIds } } as never);
        can(Action.Update, Entity, { id: entityId } as never);
        can(Action.Read, User, { entityId: { $in: accessibleEntityIds } } as never);
        can(Action.Update, User, { entityId: entityId } as never);
        can(Action.Read, Role);
      }
    }

    return build();
  }

  private async loadActiveRoleAssignments(userId: string): Promise<UserRoleAssignment[]> {
    const today = getCurrentDateString();

    return this.userRoleAssignmentRepo
      .find({
        where: {
          user: { id: userId },
        },
        relations: ['role', 'entity', 'user'],
      })
      .then((assignments) =>
        assignments.filter((a) => isDateInRange(today, a.start_date, a.end_date)),
      );
  }

  private async buildEntityHierarchyMap(entityIds: string[]): Promise<Map<string, string[]>> {
    if (entityIds.length === 0) {
      return new Map();
    }

    const allEntities = await this.entityRepo.find({
      select: ['id', 'parent_id'],
    });

    const childrenMap = new Map<string, string[]>();
    for (const entity of allEntities) {
      if (entity.parent_id) {
        if (!childrenMap.has(entity.parent_id)) {
          childrenMap.set(entity.parent_id, []);
        }
        childrenMap.get(entity.parent_id)?.push(entity.id);
      }
    }

    const hierarchyMap = new Map<string, string[]>();
    for (const entityId of entityIds) {
      hierarchyMap.set(entityId, this.getDownstreamEntityIdsFromMap(entityId, childrenMap));
    }

    return hierarchyMap;
  }

  private getDownstreamEntityIdsFromMap(
    entityId: string,
    childrenMap: Map<string, string[]>,
  ): string[] {
    const result: string[] = [entityId];
    const children = childrenMap.get(entityId) || [];

    for (const childId of children) {
      result.push(...this.getDownstreamEntityIdsFromMap(childId, childrenMap));
    }

    return result;
  }

  private async getDownstreamEntityIds(entityId: string): Promise<string[]> {
    const hierarchyMap = await this.buildEntityHierarchyMap([entityId]);
    return hierarchyMap.get(entityId) || [entityId];
  }

  async can(user: UserWithRoles, action: Action, subject: Subjects): Promise<boolean> {
    const ability = await this.createForUser(user);
    return ability.can(action, subject as never);
  }

  async cannot(user: UserWithRoles, action: Action, subject: Subjects): Promise<boolean> {
    const ability = await this.createForUser(user);
    return ability.cannot(action, subject as never);
  }
}

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
    const isSystemAdmin = roleAssignments.some((ra) => ra.role.name === 'System Admin');
    if (isSystemAdmin) {
      can(Action.Manage, 'all');
      return build();
    }

    for (const assignment of roleAssignments) {
      const role = assignment.role;
      const entityId = assignment.entity.id;

      const accessibleEntityIds = await this.getDownstreamEntityIds(entityId);
      if (role.canViewReports) {
        can(Action.Read, Activity, { userId: { $in: accessibleEntityIds } } as never);
        can(Action.Read, ReportingPeriod, { entityId: { $in: accessibleEntityIds } } as never);
        can(Action.Read, Entity, { id: { $in: accessibleEntityIds } } as never);
        can(Action.Read, User, { entityId: { $in: accessibleEntityIds } } as never);
      }

      const missionaryRoles = ['Missionary', 'Field Secretary', 'Association Secretary'];
      if (missionaryRoles.includes(role.name)) {
        can(Action.Create, Activity, { userId: user.id } as never);
        can(Action.Read, Activity, { userId: user.id } as never);
        can(Action.Update, Activity, { userId: user.id } as never);
        can(Action.Delete, Activity, { userId: user.id } as never);
        can(Action.Read, User, { id: user.id } as never);
        can(Action.Read, ActivityType);
        can(Action.Read, Entity, { id: entityId } as never);
        can(Action.Read, ReportingPeriod, { entityId: entityId } as never);
      }

      switch (role.name) {
        case 'Union President':
        case 'Association President':
        case 'Field Director':
          can(Action.Read, Entity, { id: { $in: accessibleEntityIds } } as never);
          can(Action.Update, Entity, { id: entityId } as never);
          can(Action.Read, User, { entityId: { $in: accessibleEntityIds } } as never);
          can(Action.Update, User, { entityId: entityId } as never);
          can(Action.Read, Role);
          break;

        case 'Union Secretary':
        case 'Association Secretary':
        case 'Field Secretary':
          can(Action.Create, Activity, { entityId: { $in: accessibleEntityIds } } as never);
          can(Action.Read, Activity, { entityId: { $in: accessibleEntityIds } } as never);
          can(Action.Update, Activity, { entityId: { $in: accessibleEntityIds } } as never);
          can(Action.Read, Entity, { id: { $in: accessibleEntityIds } } as never);
          can(Action.Read, User, { entityId: { $in: accessibleEntityIds } } as never);
          break;
      }
    }

    return build();
  }

  private async loadActiveRoleAssignments(userId: string): Promise<UserRoleAssignment[]> {
    const today = new Date().toISOString().split('T')[0];

    return this.userRoleAssignmentRepo
      .find({
        where: {
          user: { id: userId },
        },
        relations: ['role', 'entity', 'user'],
      })
      .then((assignments) =>
        assignments.filter((a) => a.start_date <= today && today <= a.end_date),
      );
  }

  private async getDownstreamEntityIds(entityId: string): Promise<string[]> {
    const entityIds: string[] = [entityId];
    const children = await this.entityRepo.find({
      where: { parent_id: entityId },
      select: ['id'],
    });

    for (const child of children) {
      const childIds = await this.getDownstreamEntityIds(child.id);
      entityIds.push(...childIds);
    }

    return entityIds;
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

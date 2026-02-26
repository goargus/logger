import { InferSubjects, MongoAbility } from '@casl/ability';
import { Activity } from '../activity/activity.entity';
import { Entity } from '../entities/entity.entity';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { ActivityType } from '../activities-type/activity-type.entity';

export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

export type Subjects =
  | InferSubjects<typeof Activity | typeof Entity | typeof User | typeof Role | typeof ActivityType>
  | 'all';

export type AppAbility = MongoAbility<[Action, Subjects]>;

export interface IPolicyHandler {
  handle(ability: AppAbility): boolean;
}

export type PolicyHandlerCallback = (ability: AppAbility) => boolean;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;

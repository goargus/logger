import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityType } from './activity-type.entity';
import { ActivityTypesService } from './activity-types.service';
import { ActivityTypesController } from './activity-types.controller';
import { Role } from '../roles/role.entity';
import { UserRoleAssignment } from '../roles/user-role-assignment.entity';
import { ACTIVITY_TYPE_USAGE_POLICY } from './usage/activity-type-usage.policy';
import type { ActivityTypeUsagePolicy } from './usage/activity-type-usage.policy';
import { NullActivityTypeUsagePolicy } from './usage/null-activity-type-usage.policy';
import { IdentityResolutionService } from '../auth/identity-resolution.service';
import { IdpIdentity } from '../idp-identities/idp-identity.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityType, Role, UserRoleAssignment, IdpIdentity, User])],
  controllers: [ActivityTypesController],
  providers: [
    ActivityTypesService,
    IdentityResolutionService,
    { provide: ACTIVITY_TYPE_USAGE_POLICY, useClass: NullActivityTypeUsagePolicy },
  ],
  exports: [ActivityTypesService],
})
export class ActivityTypesModule {}

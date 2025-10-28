import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { Activity } from './activity.entity';
import { IdentityResolutionService } from '../auth/identity-resolution.service';
import { IdpIdentity } from '../idp-identities/idp-identity.entity';
import { User } from '../users/user.entity';
import { ActivityType } from '../activities-type/activity-type.entity';
import { ReportingPeriod } from '../reporting-periods/reporting-period.entity';
import { UserRoleAssignment } from '../roles/user-role-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, ActivityType, IdpIdentity, User, ReportingPeriod, UserRoleAssignment])],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, IdentityResolutionService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}

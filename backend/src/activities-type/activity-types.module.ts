import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityType } from './activity-type.entity';
import { ActivityTypesService } from './activity-types.service';
import { ActivityTypesController } from './activity-types.controller';
import { Role } from '../roles/role.entity';
import { ACTIVITY_TYPE_USAGE_POLICY } from './usage/activity-type-usage.policy';
import type { ActivityTypeUsagePolicy } from './usage/activity-type-usage.policy';
import { NullActivityTypeUsagePolicy } from './usage/null-activity-type-usage.policy';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityType, Role])],
  controllers: [ActivityTypesController],
  providers: [
    ActivityTypesService,
    { provide: ACTIVITY_TYPE_USAGE_POLICY, useClass: NullActivityTypeUsagePolicy },
  ],
  exports: [ActivityTypesService],
})
export class ActivityTypesModule {}

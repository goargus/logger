import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { Reflector } from '@nestjs/core';
import { ActivitiesModule } from '../activity/activities.module';
import { PeriodsModule } from '../periods/periods.module';
import { User } from '../users/user.entity';
import { ActivityType } from '../activities-type/activity-type.entity';

@Module({
  imports: [ActivitiesModule, PeriodsModule, TypeOrmModule.forFeature([User, ActivityType])],
  controllers: [AdminController],
  providers: [Reflector],
})
export class AdminModule {}

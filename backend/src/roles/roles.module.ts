import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './role.entity';
import { RolePermission } from './role-permission.entity';
import { User } from '../users/user.entity';
import { Entity as OrgEntity } from '../entities/entity.entity';

import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';

import { UserRoleAssignment } from './user-role-assignment.entity';
import { RoleAssignmentService } from './role-assignment.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role, RolePermission, User, OrgEntity, UserRoleAssignment])],
  controllers: [RolesController],
  providers: [RolesService, RoleAssignmentService],
  exports: [RolesService, RoleAssignmentService],
})
export class RolesModule {}

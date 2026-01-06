import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePermission } from '../../roles/role-permission.entity';
import { UserRoleAssignment } from '../../roles/user-role-assignment.entity';
import { PermissionsService } from './permissions.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([RolePermission, UserRoleAssignment])],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}

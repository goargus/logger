import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Role } from '../roles/role.entity';
import { Entity as OrgEntity } from '../entities/entity.entity';
import { UserRoleAssignment } from '../roles/user-role-assignment.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AdminUsersController } from './admin-users.controller';
import { IdentityResolutionService } from '../auth/identity-resolution.service';
import { IdpIdentity } from '../idp-identities/idp-identity.entity';
import { RolesModule } from '../roles/roles.module';
import { EntitiesModule } from '../entities/entities.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, OrgEntity, UserRoleAssignment, IdpIdentity]),
    forwardRef(() => RolesModule),
    forwardRef(() => EntitiesModule),
  ],
  controllers: [UsersController, AdminUsersController],
  providers: [UsersService, IdentityResolutionService],
  exports: [UsersService],
})
export class UsersModule {}

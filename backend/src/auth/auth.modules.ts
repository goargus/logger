import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { IdentityResolutionService } from './identity-resolution.service';
import { IdpIdentitiesModule } from '../idp-identities/idp-identities.module';
import { User } from '../users/user.entity';
import { AuthController } from './auth.controller';
import { IdpIdentity } from '../idp-identities/idp-identity.entity';
import { UserRoleAssignment } from '../roles/user-role-assignment.entity';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([User]),
    IdpIdentitiesModule,
    TypeOrmModule.forFeature([IdpIdentity, User, UserRoleAssignment]),
    PermissionsModule,
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService, IdentityResolutionService, RolesGuard],
  exports: [AuthService, IdentityResolutionService, RolesGuard],
})
export class AuthModule {}

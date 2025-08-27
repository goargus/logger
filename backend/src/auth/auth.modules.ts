import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { IdpIdentitiesModule } from '../idp-identities/idp-identities.module';
import { User } from '../users/user.entity';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([User]),
    IdpIdentitiesModule,
  ],
  providers: [JwtStrategy, AuthService],
  exports: [AuthService],
})
export class AuthModule {}

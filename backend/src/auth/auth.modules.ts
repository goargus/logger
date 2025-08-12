import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';

@Module({
  imports: [ConfigModule, PassportModule, JwtModule.register({})],
  providers: [JwtStrategy, AuthService],
  exports: [AuthService],
})
export class AuthModule {}

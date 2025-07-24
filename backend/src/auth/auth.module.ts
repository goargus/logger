import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from '../auth/auth.controller';

@Module({
  imports: [PassportModule],
  providers: [JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}

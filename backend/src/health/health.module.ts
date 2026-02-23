import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { AdminGuard } from '../auth/admin.guard';

@Module({
  imports: [TerminusModule, HttpModule, ConfigModule],
  controllers: [HealthController],
  providers: [AdminGuard],
})
export class HealthModule {}

import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminGuard } from '../auth/admin.guard';
import { APP_GUARD, Reflector } from '@nestjs/core';

@Module({
  controllers: [AdminController],
  providers: [
    Reflector,
    {
      provide: APP_GUARD,
      useClass: AdminGuard,
    },
  ],
})
export class AdminModule {}

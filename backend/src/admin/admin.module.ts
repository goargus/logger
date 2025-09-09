import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { Reflector } from '@nestjs/core';

@Module({
  controllers: [AdminController],
  providers: [Reflector],
})
export class AdminModule {}

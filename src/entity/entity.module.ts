import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityController } from './entity.controller';
import { EntityService } from './entity.service';
import { Entity } from '../entity.entity'; // Assuming 'entities.ts' is in the same directory

@Module({
  imports: [TypeOrmModule.forFeature([Entity])],
  controllers: [EntityController],
  providers: [EntityService],
  exports: [EntityService],
})
export class EntityModule {}
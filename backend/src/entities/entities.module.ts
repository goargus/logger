import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entity } from './entity.entity';
import { EntitiesService } from './entities.service';
import { EntitiesController } from './entities.controller';
import { HierarchyValidationService } from './hierarchy-validation.service';
import { User } from '../users/user.entity';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [TypeOrmModule.forFeature([Entity, User]), CaslModule],
  controllers: [EntitiesController],
  providers: [EntitiesService, HierarchyValidationService],
  exports: [EntitiesService, HierarchyValidationService],
})
export class EntitiesModule {}

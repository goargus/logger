import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Entity } from "./entity.entity";
import { EntitiesService } from "./entities.service";
import { EntitiesController } from "./entities.controller";
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Entity, User])],
  controllers: [EntitiesController],
  providers: [EntitiesService],
  exports: [EntitiesService],
})
export class EntitiesModule {}

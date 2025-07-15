import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Entity } from "./entity.entity";
import { EntitiesService } from "./entities.service";
import { EntitiesController } from "./entities.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Entity])],
  controllers: [EntitiesController],
  providers: [EntitiesService],
  exports: [EntitiesService],
})
export class EntitiesModule {}

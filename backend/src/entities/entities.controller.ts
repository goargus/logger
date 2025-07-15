import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from "@nestjs/common";
import { EntitiesService } from "./entities.service";
import { Entity } from "./entity.entity";
import { UpdateEntityDto } from "./dto/update-entity.dto";
import { CreateEntityDto } from "./dto/create-entity.dto";

@Controller("entities")
export class EntitiesController {
  constructor(private readonly entitiesService: EntitiesService) {}

  @Post()
  create(@Body() body: CreateEntityDto): Promise<Entity> {
    return this.entitiesService.create(body);
  }

  @Get()
  findAll(): Promise<Entity[]> {
    return this.entitiesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string): Promise<Entity> {
    return this.entitiesService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateDto: UpdateEntityDto,
  ): Promise<Entity> {
    return this.entitiesService.update(id, updateDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string): Promise<{ deleted: boolean }> {
    return this.entitiesService.remove(id);
  }
}

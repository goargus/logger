import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    NotFoundException,
  } from '@nestjs/common';
  import { EntityService } from './entity.service';
  import { Entity, EntityType } from '../Entities'; // Assuming entities.ts is in the parent directory
  
  @Controller('entities')
  export class EntityController {
    constructor(private readonly entityService: EntityService) {}
  
    @Post()
    async create(@Body() createEntityDto: Omit<Entity, 'id' | 'created_at' | 'updated_at'>): Promise<Entity> {
      return this.entityService.create(createEntityDto);
    }
  
    @Get()
    async findAll(): Promise<Entity[]> {
      return this.entityService.findAll();
    }
  
    @Get(':id')
    async findOne(@Param('id') id: string): Promise<Entity> {
      const entity = await this.entityService.findOne(id);
      if (!entity) {
        throw new NotFoundException(`Entity with ID "${id}" not found`);
      }
      return entity;
    }
  
    @Put(':id')
    async update(@Param('id') id: string, @Body() updateEntityDto: Partial<Omit<Entity, 'id' | 'created_at' | 'updated_at'>>): Promise<Entity> {
      const updatedEntity = await this.entityService.update(id, updateEntityDto);
      if (!updatedEntity) {
        throw new NotFoundException(`Entity with ID "${id}" not found`);
      }
      return updatedEntity;
    }
  
    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
      const result = await this.entityService.remove(id);
      if (!result) {
        throw new NotFoundException(`Entity with ID "${id}" not found`);
      }
    }
  }
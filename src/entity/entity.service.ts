import { Injectable, NotFoundException } from '@nestjs/common';
import { Entity } from '../Entities'; 
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';

@Injectable()
export class EntityService {
  private entities: Entity[] = []; // Hypothetical in-memory storage

  async create(createEntityDto: CreateEntityDto): Promise<Entity> {
    const newEntity: Entity = {
        id: Math.random().toString(36).substring(2, 15),
        name: createEntityDto.name,
        type: createEntityDto.type,
        parent_id: createEntityDto.parent_id ?? null,
        code: createEntityDto.code ?? '',
        location: createEntityDto.location,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
    this.entities.push(newEntity);
    return newEntity;
  }

  async findAll(): Promise<Entity[]> {
    return this.entities;
  }

  async findOne(id: string): Promise<Entity> {
    const entity = this.entities.find((entity) => entity.id === id);
    if (!entity) {
      throw new NotFoundException(`Entity with ID "${id}" not found`);
    }
    return entity;
  }

  async update(id: string, updateEntityDto: UpdateEntityDto): Promise<Entity> {
    const entity = await this.findOne(id); // Reuse findOne for validation
    const updatedEntity = { ...entity, ...updateEntityDto, updated_at: new Date() };
    this.entities = this.entities.map((e) => (e.id === id ? updatedEntity : e));
    return updatedEntity;
  }

  async remove(id: string): Promise<boolean> {
    const initialLength = this.entities.length;
    this.entities = this.entities.filter((entity) => entity.id !== id);
    
    if (this.entities.length === initialLength) {
      throw new NotFoundException(`Entity with ID "${id}" not found`);
    }
  
    return true;
  }
}
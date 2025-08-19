import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Not, Repository } from 'typeorm';
import { Entity, EntityType } from './entity.entity';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';

@Injectable()
export class EntitiesService {
  constructor(
    @InjectRepository(Entity)
    private readonly repo: Repository<Entity>,
  ) {}

  private normalizeName(name?: string) {
    return (name ?? '').trim();
  }

  async create(dto: CreateEntityDto): Promise<Entity> {
    const name = this.normalizeName(dto.name);
    if (!name) {
      throw new BadRequestException('name is required');
    }

    const exists = await this.repo.exist({
      where: { name: ILike(name), type: dto.type },
    });
    if (exists) {
      throw new ConflictException('Entity name already exists for this type');
    }

    const entity = this.repo.create({ ...dto, name });
    return this.repo.save(entity);
  }

  async findAll(): Promise<Entity[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Entity> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Entity not found');
    return found;
  }

  async existsById(id: string): Promise<boolean> {
    return this.repo.exist({ where: { id } });
  }

  async update(id: string, dto: UpdateEntityDto): Promise<Entity> {
    const current = await this.findOne(id);

    const nextName = dto.name !== undefined ? this.normalizeName(dto.name) : current.name;
    const nextType = (dto.type ?? current.type) as EntityType;

    if (dto.name !== undefined && !nextName) {
      throw new BadRequestException('name cannot be empty');
    }

    if (nextName !== current.name || nextType !== current.type) {
      const conflict = await this.repo.exist({
        where: { id: Not(current.id), name: ILike(nextName), type: nextType },
      });
      if (conflict) {
        throw new ConflictException('Entity name already exists for this type');
      }
    }

    const toSave: Entity = {
      ...current,
      ...dto,
      name: nextName,
      type: nextType,
    } as Entity;

    return this.repo.save(toSave);
  }

  async remove(id: string): Promise<{ affected: number }> {
    try {
      const res = await this.repo.delete(id);
      if (!res.affected) {
        throw new NotFoundException('Entity not found');
      }
      return { affected: res.affected };
    } catch (e: any) {
      if (e?.code === '23503') {
        throw new BadRequestException(
          'Cannot delete entity: it is currently referenced by other records (e.g., users).',
        );
      }
      throw e;
    }
  }

  async findAllByType(type: EntityType): Promise<Entity[]> {
    return this.repo.find({ where: { type }, order: { name: 'ASC' } });
  }
}

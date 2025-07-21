import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Entity, EntityType } from "./entity.entity";
import { UpdateEntityDto } from "./dto/update-entity.dto";
import { CreateEntityDto } from "./dto/create-entity.dto";

@Injectable()
export class EntitiesService {
  async create(dto: CreateEntityDto): Promise<Entity> {
    const parent = await this.validateHierarchy(dto.type, dto.parentId);

    const entity = this.entityRepository.create({
      ...dto,
      parent,
      is_active: true,
    });

    return this.entityRepository.save(entity);
  }

  async findAll(): Promise<Entity[]> {
    return this.entityRepository.find({
      relations: ["parent"],
      order: { created_at: "DESC" },
    });
  }
  async findOne(id: string): Promise<Entity> {
    const entity = await this.entityRepository.findOne({
      where: { id },
      relations: ["parent"],
    });

    if (!entity) {
      throw new NotFoundException(`Entity with id '${id}' not found`);
    }

    return entity;
  }
  async update(id: string, dto: UpdateEntityDto): Promise<Entity> {
    const entity = await this.entityRepository.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException(`Entity with id '${id}' not found`);
    }

    if (dto.type && dto.parentId !== undefined) {
      const parent = await this.validateHierarchy(dto.type, dto.parentId);
      entity.parent = parent;
    }

    Object.assign(entity, dto);
    return this.entityRepository.save(entity);
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const entity = await this.entityRepository.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException(`Entity with id '${id}' not found`);
    }

    await this.entityRepository.remove(entity);

    return { deleted: true };
  }

  constructor(
    @InjectRepository(Entity)
    private readonly entityRepository: Repository<Entity>,
  ) {}

  async validateHierarchy(
    type: EntityType,
    parentId: string | null,
  ): Promise<Entity | null> {
    let parent: Entity | null = null;

    if (parentId) {
      parent = await this.entityRepository.findOne({ where: { id: parentId } });
      if (!parent) {
        throw new NotFoundException("Parent entity not found");
      }
    }

    if (type === EntityType.UNION && parent !== null) {
      throw new BadRequestException("A UNION cannot have a parent");
    }

    if (type === EntityType.ASSOCIATION) {
      if (!parent || parent.type !== EntityType.UNION) {
        throw new BadRequestException(
          "An ASSOCIATION must have a UNION as parent",
        );
      }
    }

    if (type === EntityType.FIELD) {
      if (!parent || parent.type !== EntityType.ASSOCIATION) {
        throw new BadRequestException(
          "A FIELD must have an ASSOCIATION as parent",
        );
      }
    }

    return parent;
  }
}

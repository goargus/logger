import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Not, Repository } from 'typeorm';
import { Entity, EntityType } from './entity.entity';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { HierarchyValidationService } from './hierarchy-validation.service';
import { ReportingPeriodsService } from '../reporting-periods/reporting-periods.service';
import { TermsService } from '../terms/terms.service';

@Injectable()
export class EntitiesService {
  constructor(
    @InjectRepository(Entity)
    private readonly repo: Repository<Entity>,
    private readonly hierarchyValidation: HierarchyValidationService,
    @Optional()
    @Inject(forwardRef(() => ReportingPeriodsService))
    private readonly reportingPeriodsService?: ReportingPeriodsService,
    @Optional()
    @Inject(forwardRef(() => TermsService))
    private readonly termsService?: TermsService,
  ) {}

  private normalizeName(name?: string) {
    return (name ?? '').trim();
  }

  async create(dto: CreateEntityDto): Promise<Entity> {
    const name = this.normalizeName(dto.name);
    if (!name) {
      throw new BadRequestException('name is required');
    }
    if (dto.parentId) {
      const parent = await this.repo.findOne({ where: { id: dto.parentId } });
      if (!parent) {
        throw new NotFoundException('Parent entity not found');
      }
      if (!parent.is_active) {
        throw new BadRequestException('Cannot create entity under an inactive parent');
      }
      this.hierarchyValidation.validateHierarchy(dto.type, parent.type);
    } else {
      this.hierarchyValidation.validateHierarchy(dto.type);
    }

    const exists = await this.repo.exist({
      where: { name: ILike(name), type: dto.type },
    });
    if (exists) {
      throw new ConflictException('Entity name already exists for this type');
    }

    const entityData = {
      name,
      type: dto.type,
      code: dto.code,
      description: dto.description,
      location: dto.location,
      parent_id: dto.parentId || null,
    };
    const entity = this.repo.create(entityData);
    const saved = await this.repo.save(entity);

    if (this.termsService && this.reportingPeriodsService) {
      try {
        const activeTerm = await this.termsService.getActiveTermForEntity(saved.id);
        if (activeTerm) {
          await this.reportingPeriodsService.createFirstPeriodForEntity(
            saved.id,
            activeTerm.id,
            'system',
          );
        }
      } catch (error) {
        console.error('Failed to create first reporting period:', error);
      }
    }

    return saved;
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

    if (dto.is_active === false && current.is_active) {
      const activeChildren = await this.repo.count({
        where: { parent_id: id, is_active: true },
      });
      if (activeChildren > 0) {
        throw new BadRequestException(
          'Cannot deactivate entity: it has active child entities. Please deactivate child entities first.',
        );
      }
      const activeUsers = await this.repo
        .createQueryBuilder('entity')
        .leftJoin('entity.users', 'user')
        .where('entity.id = :id', { id })
        .andWhere('user.status = :status', { status: 'active' })
        .getCount();

      if (activeUsers > 0) {
        throw new BadRequestException(
          'Cannot deactivate entity: it has active user assignments. Please reassign users first.',
        );
      }
    }

    const nextName = dto.name !== undefined ? this.normalizeName(dto.name) : current.name;
    const nextType = (dto.type ?? current.type) as EntityType;
    const nextParentId = dto.parentId !== undefined ? dto.parentId : current.parent_id;

    if (dto.name !== undefined && !nextName) {
      throw new BadRequestException('name cannot be empty');
    }

    if (dto.type !== undefined || dto.parentId !== undefined) {
      if (nextParentId) {
        const parent = await this.repo.findOne({ where: { id: nextParentId } });
        if (!parent) {
          throw new NotFoundException('Parent entity not found');
        }
        if (!parent.is_active) {
          throw new BadRequestException('Cannot assign entity to an inactive parent');
        }
        this.hierarchyValidation.validateHierarchy(nextType, parent.type);
      } else {
        this.hierarchyValidation.validateHierarchy(nextType);
      }
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
      parent_id: nextParentId,
    } as Entity;

    return this.repo.save(toSave);
  }

  async remove(id: string): Promise<{ affected: number }> {
    await this.findOne(id);
    const activeChildren = await this.repo.count({
      where: { parent_id: id, is_active: true },
    });
    if (activeChildren > 0) {
      throw new BadRequestException(
        'Cannot delete entity: it has active child entities. Please deactivate or delete child entities first.',
      );
    }
    const activeUsers = await this.repo
      .createQueryBuilder('entity')
      .leftJoin('entity.users', 'user')
      .where('entity.id = :id', { id })
      .andWhere('user.status = :status', { status: 'active' })
      .getCount();

    if (activeUsers > 0) {
      throw new BadRequestException(
        'Cannot delete entity: it has active user assignments. Please reassign users first.',
      );
    }
    const result = await this.repo.update(id, { is_active: false });
    if (!result.affected) {
      throw new NotFoundException('Entity not found');
    }
    return { affected: result.affected };
  }

  async findAllByType(type: EntityType): Promise<Entity[]> {
    return this.repo.find({ where: { type }, order: { name: 'ASC' } });
  }

  async findValidParentsForType(childType: EntityType): Promise<Entity[]> {
    const allowedParentTypes = this.hierarchyValidation.getAllowedParentTypes(childType);
    if (allowedParentTypes.length === 0) {
      return [];
    }
    return this.repo.find({
      where: {
        type: allowedParentTypes[0],
        is_active: true,
      },
      order: { name: 'ASC' },
    });
  }

  async findChildren(id: string): Promise<Entity[]> {
    return this.repo.find({
      where: { parent_id: id, is_active: true },
      order: { name: 'ASC' },
    });
  }

  async softDelete(id: string): Promise<{ affected: number }> {
    return this.remove(id);
  }
}

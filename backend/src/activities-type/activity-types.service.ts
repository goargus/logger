import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ActivityType } from './activity-type.entity';
import { CreateActivityTypeDto } from './dto/create-activity-type.dto';
import { UpdateActivityTypeDto } from './dto/update-activity-type.dto';
import { Role } from '../roles/role.entity';
import {
  ACTIVITY_TYPE_USAGE_POLICY,
  ActivityTypeUsagePolicy,
} from './usage/activity-type-usage.policy';

@Injectable()
export class ActivityTypesService {
  constructor(
    @InjectRepository(ActivityType) private readonly repo: Repository<ActivityType>,
    @InjectRepository(Role) private readonly rolesRepo: Repository<Role>,
    @Inject(ACTIVITY_TYPE_USAGE_POLICY) private readonly usagePolicy: ActivityTypeUsagePolicy,
  ) {}

  private async ensureNameUnique(name: string, ignoreId?: string) {
    const existing = await this.repo.findOne({ where: { name } });
    if (existing && existing.id !== ignoreId) {
      throw new BadRequestException('Activity type name must be unique.');
    }
  }

  private async loadRolesOrThrow(roleIds: string[]): Promise<Role[]> {
    const roles = await this.rolesRepo.find({ where: { id: In(roleIds) } });
    if (roles.length !== roleIds.length) {
      throw new BadRequestException('One or more provided role_ids do not exist.');
    }
    return roles;
  }

  async create(dto: CreateActivityTypeDto): Promise<ActivityType> {
    const name = dto.name.trim();
    const description = dto.description.trim();

    await this.ensureNameUnique(name);

    const roles = await this.loadRolesOrThrow(dto.role_ids);

    const entity = this.repo.create({
      name,
      description,
      allowed_roles: roles,
    });

    return this.repo.save(entity);
  }

  async findAll(): Promise<ActivityType[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<ActivityType> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Activity type not found.');
    return found;
  }

  async update(id: string, dto: UpdateActivityTypeDto): Promise<ActivityType> {
    const entity = await this.findOne(id);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      await this.ensureNameUnique(name, id);
      entity.name = name;
    }

    if (dto.description !== undefined) {
      const description = dto.description.trim();
      if (!description) throw new BadRequestException('Description cannot be empty.');
      entity.description = description;
    }

    if (dto.role_ids !== undefined) {
      const roles = await this.loadRolesOrThrow(dto.role_ids);
      entity.allowed_roles = roles;
    }

    return this.repo.save(entity);
  }

  async remove(id: string): Promise<void> {
    const inUse = await this.usagePolicy.isInUse(id);
    if (inUse) {
      throw new BadRequestException(
        'Cannot delete this activity type because it is currently in use by existing activities.',
      );
    }

    const entity = await this.findOne(id);
    await this.repo.remove(entity);
  }
}

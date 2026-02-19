import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ActivityType } from './activity-type.entity';
import { CreateActivityTypeDto } from './dto/create-activity-type.dto';
import { UpdateActivityTypeDto } from './dto/update-activity-type.dto';
import { Role } from '../roles/role.entity';
import { UserRoleAssignment } from '../roles/user-role-assignment.entity';
import {
  ACTIVITY_TYPE_USAGE_POLICY,
  ActivityTypeUsagePolicy,
} from './usage/activity-type-usage.policy';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { buildPagination, normalizePagination } from '../common/pagination';

@Injectable()
export class ActivityTypesService {
  constructor(
    @InjectRepository(ActivityType) private readonly repo: Repository<ActivityType>,
    @InjectRepository(Role) private readonly rolesRepo: Repository<Role>,
    @InjectRepository(UserRoleAssignment) private readonly uraRepo: Repository<UserRoleAssignment>,
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

  async findAll(
    query?: PaginationQueryDto,
  ): Promise<{
    data: ActivityType[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page, limit, skip, take } = normalizePagination(query);
    const [data, total] = await this.repo.findAndCount({
      order: { name: 'ASC' },
      skip,
      take,
    });
    return { data, pagination: buildPagination(page, limit, total) };
  }

  async findAllByUserRole(userRoleId: string): Promise<ActivityType[]> {
    return this.repo
      .createQueryBuilder('activity_type')
      .leftJoinAndSelect('activity_type.allowed_roles', 'role')
      .where('role.id = :roleId', { roleId: userRoleId })
      .getMany();
  }

  async findAllByUserRoleAssignments(userId: string): Promise<ActivityType[]> {
    // Get all role IDs from user's active role assignments
    const roleAssignments = await this.uraRepo.find({
      where: { user: { id: userId } },
      relations: ['role'],
    });

    if (roleAssignments.length === 0) {
      return [];
    }

    const roleIds = roleAssignments.map((assignment) => assignment.role.id);

    // Get all activity types that match any of the user's roles
    return this.repo
      .createQueryBuilder('activity_type')
      .leftJoinAndSelect('activity_type.allowed_roles', 'role')
      .where('role.id IN (:...roleIds)', { roleIds })
      .getMany();
  }

  async getUserRoleAssignments(userId: string): Promise<UserRoleAssignment[]> {
    return this.uraRepo.find({
      where: { user: { id: userId } },
      relations: ['role', 'entity'],
    });
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

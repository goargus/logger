import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserStatus } from './user-status.enum';

import { EntitiesService } from '../entities/entities.service';
import { RolesService } from '../roles/roles.service';
import { UserRoleAssignment } from '../roles/user-role-assignment.entity';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { buildPagination, normalizePagination } from '../common/pagination';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(UserRoleAssignment)
    private readonly userRoleAssignmentRepo: Repository<UserRoleAssignment>,
    private readonly entitiesService: EntitiesService,
    private readonly rolesService: RolesService,
  ) {}

  private async assertRoleExists(role_id: string): Promise<void> {
    try {
      await this.rolesService.findOne(role_id);
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw new BadRequestException('Invalid role_id: role does not exist.');
      }
      throw e;
    }
  }

  private async assertEntityExists(entity_id: string): Promise<void> {
    try {
      await this.entitiesService.findOne(entity_id);
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw new BadRequestException('Invalid entity_id: entity does not exist.');
      }
      throw e;
    }
  }

  async create(dto: CreateUserDto): Promise<User> {
    const dup = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (dup) throw new BadRequestException('A user with this email already exists.');

    await this.assertRoleExists(dto.role_id);
    await this.assertEntityExists(dto.entity_id);

    const user = this.usersRepo.create({
      username: dto.username,
      email: dto.email,
      role_id: dto.role_id,
      entity_id: dto.entity_id,
      full_name: dto.full_name ?? null,
      first_name: dto.first_name ?? null,
      family_name: dto.family_name ?? null,
      status: UserStatus.ACTIVE,
      archived_at: null,
    });

    return this.usersRepo.save(user);
  }

  async findAll(query?: PaginationQueryDto): Promise<{
    data: User[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page, limit, skip, take } = normalizePagination(query);
    const [data, total] = await this.usersRepo.findAndCount({
      order: { username: 'ASC' },
      skip,
      take,
    });
    return { data, pagination: buildPagination(page, limit, total) };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (user.status === UserStatus.ARCHIVED) {
      if (dto.role_id || dto.entity_id || dto.status === UserStatus.ACTIVE) {
        throw new ForbiddenException(
          'Archived users cannot be assigned new roles/entities or reactivated here.',
        );
      }
    }

    if (dto.email) {
      const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
      if (existing && existing.id !== user.id) {
        throw new BadRequestException('Another user already uses this email.');
      }
    }

    if (dto.role_id) {
      await this.assertRoleExists(dto.role_id);
      user.role_id = dto.role_id;
    }
    if (dto.entity_id) {
      await this.assertEntityExists(dto.entity_id);
      user.entity_id = dto.entity_id;
    }

    if (dto.username !== undefined) user.username = dto.username;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.full_name !== undefined) user.full_name = dto.full_name ?? null;
    if (dto.first_name !== undefined) user.first_name = dto.first_name ?? null;
    if (dto.family_name !== undefined) user.family_name = dto.family_name ?? null;

    if (dto.status !== undefined) {
      user.status = dto.status;
      if (dto.status === UserStatus.ARCHIVED) {
        user.archived_at = new Date();
      }
    }

    return this.usersRepo.save(user);
  }

  async findUserProfile(userId: string): Promise<{
    user: User;
    roleAssignments: UserRoleAssignment[];
  }> {
    const user = await this.findOne(userId);
    const roleAssignments = await this.userRoleAssignmentRepo.find({
      where: { user: { id: userId } },
      relations: ['role', 'entity', 'user'],
    });

    return {
      user,
      roleAssignments,
    };
  }
}

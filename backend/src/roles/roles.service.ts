import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, Repository } from 'typeorm';
import { Role } from './role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResult, buildPagination, normalizePagination } from '../common/pagination';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
  ) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    const rawName = dto.name ?? '';
    const name = rawName.trim();

    if (!name) {
      throw new BadRequestException('Name is required.');
    }

    const exists = await this.rolesRepo.exist({
      where: {
        name: Raw((alias) => `LOWER(${alias}) = LOWER(:name)`, { name }),
      },
    });
    if (exists) {
      throw new ConflictException('Role name already exists (case-insensitive).');
    }

    const rawDesc = dto.description ?? null;
    const description = rawDesc ? rawDesc.trim() : null;

    const role = this.rolesRepo.create({ name, description });
    return this.rolesRepo.save(role);
  }

  async findAll(query?: PaginationQueryDto): Promise<PaginatedResult<Role>> {
    const { page, limit, skip } = normalizePagination(query);
    const [data, total] = await this.rolesRepo.findAndCount({
      order: { name: 'ASC' },
      skip,
      take: limit,
    });
    return { data, pagination: buildPagination(page, limit, total) };
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.rolesRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found.');
    return role;
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    if (typeof dto.name !== 'undefined') {
      const newName = (dto.name ?? '').trim();

      if (!newName) {
        throw new BadRequestException('Name cannot be empty.');
      }

      if (newName !== role.name) {
        const dup = await this.rolesRepo.exist({
          where: {
            name: Raw((alias) => `LOWER(${alias}) = LOWER(:name)`, { name: newName }),
          },
        });
        if (dup) {
          throw new ConflictException('Role name already exists (case-insensitive).');
        }
        role.name = newName;
      }
    }

    if (typeof dto.description !== 'undefined') {
      const newDesc = dto.description ?? null;
      role.description = newDesc ? newDesc.trim() : null;
    }

    return this.rolesRepo.save(role);
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const role = await this.rolesRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found.');

    try {
      await this.rolesRepo.delete(id);
      return { deleted: true };
    } catch (e: any) {
      if (e?.code === '23503') {
        throw new BadRequestException(
          'Cannot delete role: it is currently assigned to one or more users.',
        );
      }
      throw e;
    }
  }
}

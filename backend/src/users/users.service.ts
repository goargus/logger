import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStatus } from './user-status.enum';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../roles/role.entity';
import { Entity as OrgEntity } from '../entities/entity.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Role) private readonly rolesRepo: Repository<Role>,
    @InjectRepository(OrgEntity) private readonly entitiesRepo: Repository<OrgEntity>,
  ) {}

  private async assertRoleExists(role_id: string): Promise<Role> {
    const role = await this.rolesRepo.findOne({ where: { id: role_id } });
    if (!role) throw new BadRequestException('Invalid role_id: role does not exist.');
    return role;
  }

  private async assertEntityExists(entity_id: string): Promise<OrgEntity> {
    const ent = await this.entitiesRepo.findOne({ where: { id: entity_id } });
    if (!ent) throw new BadRequestException('Invalid entity_id: entity does not exist.');
    return ent;
  }

  async create(dto: CreateUserDto): Promise<User> {
    // no duplicados por email
    const exists = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('A user with this email already exists.');

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

    const saved = await this.usersRepo.save(user);
    return saved;
  }

  async findAll(): Promise<User[]> {
    return this.usersRepo.find();
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
}

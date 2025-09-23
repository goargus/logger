import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, ILike } from 'typeorm';

import { User } from '../users/user.entity';
import { UserStatus } from '../users/user-status.enum';
import { Role } from './role.entity';
import { Entity as OrgEntity } from '../entities/entity.entity';

import { UserRoleAssignment } from './user-role-assignment.entity';
import { AssignRoleDto, RoleEnum } from './dto/assign-role.dto';
import { RemoveRoleDto } from './dto/remove-role.dto';

@Injectable()
export class RoleAssignmentService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Role) private readonly rolesRepo: Repository<Role>,
    @InjectRepository(OrgEntity) private readonly entitiesRepo: Repository<OrgEntity>,
    @InjectRepository(UserRoleAssignment) private readonly uraRepo: Repository<UserRoleAssignment>,
    private readonly dataSource: DataSource,
  ) {}

  async assign(dto: AssignRoleDto, adminUserId?: string) {
    const user = await this.usersRepo.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Cannot assign roles to inactive users');
    }

    if (!Object.values(RoleEnum).includes(dto.role)) {
      throw new BadRequestException('Invalid role enum value');
    }
    const role = await this.rolesRepo.findOne({ where: { name: ILike(dto.role) } });
    if (!role) throw new NotFoundException('Role not found');

    const entity = await this.entitiesRepo.findOne({ where: { id: dto.entityId } });
    if (!entity) throw new NotFoundException('Entity not found');
    if (entity.is_active === false) {
      throw new BadRequestException('Cannot assign roles to inactive entities');
    }

    const existing = await this.uraRepo.findOne({
      where: { user: { id: user.id }, role: { id: role.id }, entity: { id: entity.id } },
    });
    if (existing) throw new ConflictException('This user already has that role in this entity');

    return this.dataSource.transaction(async (manager) => {
      const assignment = manager.create(UserRoleAssignment, {
        user,
        role,
        entity,
        created_by: adminUserId,
        updated_by: adminUserId,
      });
      return manager.save(assignment);
    });
  }

  async remove(dto: RemoveRoleDto, adminUserId?: string) {
    const assignment = await this.uraRepo.findOne({ where: { id: dto.assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.uraRepo.remove({ ...assignment, updated_by: adminUserId } as any);
    return { deleted: true };
  }

  async listUsersByRole(roleName: string) {
    const normalized = String(roleName).trim();
    const role = await this.rolesRepo.findOne({
      where: { name: ILike(normalized) },
    });
    if (!role) throw new NotFoundException('Role not found');

    const rows = await this.uraRepo.find({ where: { role: { id: role.id } } });
    const byUser = new Map<string, any>();
    for (const r of rows) byUser.set(r.user.id, r.user);
    return Array.from(byUser.values());
  }

  async listUsersByEntity(entityId: string) {
    const entity = await this.entitiesRepo.findOne({ where: { id: entityId } });
    if (!entity) throw new NotFoundException('Entity not found');
    const rows = await this.uraRepo.find({ where: { entity: { id: entity.id } } });
    const map = new Map<string, { user: any; roles: string[] }>();
    for (const r of rows) {
      const entry = map.get(r.user.id) ?? { user: r.user, roles: [] };
      entry.roles.push(r.role.name);
      map.set(r.user.id, entry);
    }
    return Array.from(map.values());
  }

  async listAssignmentsForUser(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.uraRepo.find({ where: { user: { id: userId } } });
  }
}

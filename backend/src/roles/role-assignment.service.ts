import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, ILike, In } from 'typeorm';

import { User } from '../users/user.entity';
import { UserStatus } from '../users/user-status.enum';
import { Role } from './role.entity';
import { Entity as OrgEntity } from '../entities/entity.entity';

import { UserRoleAssignment } from './user-role-assignment.entity';
import { AssignRoleDto, RoleEnum } from './dto/assign-role.dto';
import { RemoveRoleDto } from './dto/remove-role.dto';
import { BulkAssignRoleDto } from './dto/bulk-assign-role.dto';
import { GetUserEntitiesByRoleDto } from './dto/get-user-entities-by-role.dto';
import { formatDateToString, getCurrentDateString } from '../common/date.utils';

@Injectable()
export class RoleAssignmentService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Role) private readonly rolesRepo: Repository<Role>,
    @InjectRepository(OrgEntity) private readonly entitiesRepo: Repository<OrgEntity>,
    @InjectRepository(UserRoleAssignment) private readonly uraRepo: Repository<UserRoleAssignment>,
    private readonly dataSource: DataSource,
  ) {}

  private calculateEndDate(startDate: string, termLengthYears: number): string {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + termLengthYears);
    end.setDate(end.getDate() - 1);
    return formatDateToString(end);
  }

  private async checkOverlap(
    userId: string,
    roleId: string,
    entityId: string,
    startDate: string,
    endDate: string,
    excludeId?: string,
  ): Promise<void> {
    const qb = this.uraRepo
      .createQueryBuilder('assignment')
      .where('assignment.user_id = :userId', { userId })
      .andWhere('assignment.role_id = :roleId', { roleId })
      .andWhere('assignment.entity_id = :entityId', { entityId })
      .andWhere(
        '(assignment.start_date <= :endDate AND assignment.end_date >= :startDate)',
        { startDate, endDate },
      );

    if (excludeId) {
      qb.andWhere('assignment.id != :excludeId', { excludeId });
    }

    const overlapping = await qb.getOne();

    if (overlapping) {
      throw new ConflictException(
        `An overlapping assignment already exists for this user, role, and entity from ${overlapping.start_date} to ${overlapping.end_date}`,
      );
    }
  }

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

    const startDate = dto.startDate || getCurrentDateString();
    const endDate = this.calculateEndDate(startDate, entity.term_length_years);

    // Check for overlapping assignments
    await this.checkOverlap(user.id, role.id, entity.id, startDate, endDate);

    return this.dataSource.transaction(async (manager) => {
      const assignment = manager.create(UserRoleAssignment, {
        user,
        role,
        entity,
        start_date: startDate,
        end_date: endDate,
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

  async bulkAssign(dto: BulkAssignRoleDto, adminUserId?: string) {
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

    const entities = await this.entitiesRepo.find({
      where: dto.entityIds.map((id) => ({ id })),
    });
    if (entities.length !== dto.entityIds.length) {
      throw new NotFoundException('One or more entities not found');
    }
    const inactiveEntities = entities.filter((entity) => entity.is_active === false);
    if (inactiveEntities.length > 0) {
      throw new BadRequestException('Cannot assign roles to inactive entities');
    }

    const existingAssignments = await this.uraRepo.find({
      where: {
        user: { id: user.id },
        role: { id: role.id },
        entity: { id: In(dto.entityIds) },
      },
    });

    const existingEntityIds = existingAssignments.map((assignment) => assignment.entity.id);
    const newEntityIds = dto.entityIds.filter((id) => !existingEntityIds.includes(id));

    if (newEntityIds.length === 0) {
      return {
        message: 'User already has this role in all specified entities',
        skipped: existingEntityIds.length,
        created: 0,
      };
    }

    const startDate = dto.startDate || getCurrentDateString();

    // Check for overlaps in all entities
    for (const entityId of newEntityIds) {
      const entity = entities.find((e) => e.id === entityId);
      if (entity) {
        const endDate = this.calculateEndDate(startDate, entity.term_length_years);
        await this.checkOverlap(user.id, role.id, entity.id, startDate, endDate);
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const newAssignments = newEntityIds.map((entityId) => {
        const entity = entities.find((e) => e.id === entityId);
        if (!entity) {
          throw new NotFoundException(`Entity ${entityId} not found`);
        }
        const endDate = this.calculateEndDate(startDate, entity.term_length_years);
        return manager.create(UserRoleAssignment, {
          user,
          role,
          entity,
          start_date: startDate,
          end_date: endDate,
          created_by: adminUserId,
          updated_by: adminUserId,
        });
      });

      const saved = await manager.save(newAssignments);
      return {
        message: `Successfully assigned ${newAssignments.length} roles`,
        created: newAssignments.length,
        skipped: existingEntityIds.length,
        assignments: saved,
      };
    });
  }

  async getUserEntitiesByRole(dto: GetUserEntitiesByRoleDto) {
    const user = await this.usersRepo.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    const role = await this.rolesRepo.findOne({ where: { name: ILike(dto.role) } });
    if (!role) throw new NotFoundException('Role not found');

    const assignments = await this.uraRepo.find({
      where: {
        user: { id: user.id },
        role: { id: role.id },
      },
    });

    return {
      user,
      role: role.name,
      entities: assignments.map((assignment) => assignment.entity),
      totalEntities: assignments.length,
    };
  }

  async listAssignments(entityId?: string, userId?: string, active?: boolean) {
    const where: any = {};
    if (entityId) where.entity = { id: entityId };
    if (userId) where.user = { id: userId };

    const assignments = await this.uraRepo.find({ where });

    if (active !== undefined) {
      const today = getCurrentDateString();
      return assignments.filter((a) => {
        const isActive = a.end_date >= today;
        return active ? isActive : !isActive;
      });
    }

    return assignments;
  }

  async getAssignment(id: string) {
    const assignment = await this.uraRepo.findOne({ where: { id } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async updateAssignment(id: string, endDate: string, adminUserId?: string) {
    const assignment = await this.uraRepo.findOne({ where: { id } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    if (endDate < assignment.start_date) {
      throw new BadRequestException('End date cannot be before start date');
    }

    // Check for overlaps when extending the assignment
    await this.checkOverlap(
      assignment.user.id,
      assignment.role.id,
      assignment.entity.id,
      assignment.start_date,
      endDate,
      id, // Exclude current assignment
    );

    assignment.end_date = endDate;
    assignment.updated_by = adminUserId;

    return this.uraRepo.save(assignment);
  }

  async deleteAssignment(id: string) {
    const assignment = await this.uraRepo.findOne({ where: { id } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    await this.uraRepo.remove(assignment);
    return { deleted: true };
  }
}

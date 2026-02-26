import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Entity } from '../../entities/entity.entity';
import { User } from '../../users/user.entity';
import { UserRoleAssignment } from '../../roles/user-role-assignment.entity';
import { getCurrentDateString } from '../../common/date.utils';
import { fetchEntityHierarchyIds } from '../../entities/entity-hierarchy.query';

@Injectable()
export class ReportsAccessService {
  constructor(
    @InjectRepository(Entity)
    private readonly entityRepo: Repository<Entity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserRoleAssignment)
    private readonly roleAssignmentRepo: Repository<UserRoleAssignment>,
  ) {}

  async getEntityHierarchy(entityId: string): Promise<string[]> {
    const entityIds = await fetchEntityHierarchyIds(this.entityRepo, entityId);

    if (entityIds.length === 0) {
      throw new NotFoundException('Entity not found');
    }

    return entityIds;
  }

  async validateEntityInUserScope(actorUserId: string, targetEntityId: string): Promise<boolean> {
    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
      relations: ['entity'],
    });

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const allowedEntityIds = await this.getEntityHierarchy(actor.entity_id);
    return allowedEntityIds.includes(targetEntityId);
  }

  async validateUserInScope(actorUserId: string, targetUserId: string): Promise<boolean> {
    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
      relations: ['entity'],
    });
    const target = await this.userRepo.findOne({
      where: { id: targetUserId },
      relations: ['entity'],
    });

    if (!actor || !target) {
      throw new NotFoundException('User not found');
    }

    const allowedEntityIds = await this.getEntityHierarchy(actor.entity_id);
    return allowedEntityIds.includes(target.entity_id);
  }

  async getUsersInHierarchy(
    entityIds: string[],
    options: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {},
  ): Promise<{ users: User[]; total: number }> {
    // Return empty result if no entity IDs provided
    if (!entityIds || entityIds.length === 0) {
      return { users: [], total: 0 };
    }

    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const search = options.search;
    const sortBy = options.sortBy ?? 'name';
    const sortOrder = options.sortOrder ?? 'asc';

    const qb = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.entity', 'entity')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.entity_id IN (:...entityIds)', { entityIds })
      .andWhere('user.status = :status', { status: 'active' });

    if (search) {
      qb.andWhere(
        '(LOWER(user.full_name) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    // Map sort field to actual column
    const sortFieldMap: Record<string, string> = {
      name: 'user.full_name',
      email: 'user.email',
      entity: 'entity.name',
      role: 'role.name',
    };
    const sortColumn = sortFieldMap[sortBy] || 'user.full_name';
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Get count first without ordering
    const total = await qb.getCount();

    // Apply ordering and pagination
    qb.orderBy(sortColumn, sortDirection as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const users = await qb.getMany();

    return { users, total };
  }

  /**
   * Get role assignments for multiple users
   * Returns a map of userId -> role assignments
   */
  async getRoleAssignmentsForUsers(userIds: string[]): Promise<Map<string, UserRoleAssignment[]>> {
    if (!userIds || userIds.length === 0) {
      return new Map();
    }

    const today = getCurrentDateString();

    const assignments = await this.roleAssignmentRepo
      .createQueryBuilder('ra')
      .leftJoinAndSelect('ra.role', 'role')
      .leftJoinAndSelect('ra.entity', 'entity')
      .where('ra.user_id IN (:...userIds)', { userIds })
      .orderBy('ra.end_date', 'DESC')
      .getMany();

    const result = new Map<string, UserRoleAssignment[]>();

    for (const assignment of assignments) {
      const userId = (assignment as any).user_id || assignment.user?.id;
      if (!userId) continue;

      if (!result.has(userId)) {
        result.set(userId, []);
      }
      result.get(userId)!.push(assignment);
    }

    return result;
  }
}

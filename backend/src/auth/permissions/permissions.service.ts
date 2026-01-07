import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermission } from '../../roles/role-permission.entity';
import { UserRoleAssignment } from '../../roles/user-role-assignment.entity';
import { Permission } from './permission.enum';
import { getCurrentDateString, isDateInRange } from '../../common/date.utils';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
    @InjectRepository(UserRoleAssignment)
    private readonly userRoleAssignmentRepo: Repository<UserRoleAssignment>,
  ) {}

  /**
   * Get all permissions for a specific role.
   */
  async getPermissionsForRole(roleId: string): Promise<string[]> {
    const rolePerms = await this.rolePermissionRepo.find({
      where: { role: { id: roleId } },
    });
    return rolePerms.map((rp) => rp.permission);
  }

  /**
   * Get effective permissions for a user, aggregated from all active role assignments.
   * Returns a Map where key is entityId and value is a Set of permissions.
   */
  async getEffectivePermissionsForUser(userId: string): Promise<Map<string, Set<string>>> {
    const today = getCurrentDateString();

    const assignments = await this.userRoleAssignmentRepo.find({
      where: { user: { id: userId } },
      relations: ['role', 'role.rolePermissions', 'entity'],
    });

    const entityPermissions = new Map<string, Set<string>>();

    for (const assignment of assignments) {
      // Skip inactive assignments
      if (!isDateInRange(today, assignment.start_date, assignment.end_date)) {
        continue;
      }

      const entityId = assignment.entity.id;
      if (!entityPermissions.has(entityId)) {
        entityPermissions.set(entityId, new Set());
      }

      const perms = entityPermissions.get(entityId)!;
      for (const rp of assignment.role.rolePermissions || []) {
        perms.add(rp.permission);
      }
    }

    return entityPermissions;
  }

  /**
   * Check if a user has a specific permission.
   * If entityId is provided, checks permission for that specific entity.
   * If not provided, checks if the user has the permission for any entity.
   * SYSTEM_ADMIN permission grants all permissions.
   */
  async userHasPermission(
    userId: string,
    permission: Permission,
    entityId?: string,
  ): Promise<boolean> {
    const permsMap = await this.getEffectivePermissionsForUser(userId);

    // Check for SYSTEM_ADMIN first - grants all permissions
    for (const perms of permsMap.values()) {
      if (perms.has(Permission.SYSTEM_ADMIN)) {
        return true;
      }
    }

    if (entityId) {
      const entityPerms = permsMap.get(entityId);
      return entityPerms?.has(permission) || false;
    }

    // Check any entity
    for (const perms of permsMap.values()) {
      if (perms.has(permission)) {
        return true;
      }
    }

    return false;
  }
}

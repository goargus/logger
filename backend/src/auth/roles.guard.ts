import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from './permissions/permissions.service';
import { Permission } from './permissions/permission.enum';

/**
 * Maps role decorator values to database permissions.
 * Used for @Roles('admin') style decorators.
 */
const ROLE_TO_PERMISSION: Record<string, Permission> = {
  admin: Permission.SYSTEM_ADMIN,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check database-driven permissions
    for (const reqRoleOrPerm of required) {
      // First, check if it maps to a known permission
      const mappedPermission = ROLE_TO_PERMISSION[reqRoleOrPerm];
      if (mappedPermission) {
        const hasPermission = await this.permissionsService.userHasPermission(
          user.id,
          mappedPermission,
        );
        if (hasPermission) {
          return true;
        }
      }

      // Check if it's a Permission enum value directly
      if (Object.values(Permission).includes(reqRoleOrPerm as Permission)) {
        const hasPermission = await this.permissionsService.userHasPermission(
          user.id,
          reqRoleOrPerm as Permission,
        );
        if (hasPermission) {
          return true;
        }
      }
    }

    throw new ForbiddenException('Insufficient permissions');
  }
}

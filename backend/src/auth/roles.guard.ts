import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user || {};

    const userPerms: string[] = Array.isArray(user.permissions) ? user.permissions : [];
    const userRoles: string[] = Array.isArray(user.roles) ? user.roles : [];

    const roleToPermissions: Record<string, string[]> = {
      admin: ['read:admin_dashboard', 'create:entities', 'update:entities', 'delete:entities'],
    };

    const hasAccess = required.some((reqRoleOrPerm) => {
      if (userPerms.includes(reqRoleOrPerm)) return true;

      if (userRoles.includes(reqRoleOrPerm)) return true;

      const mapped = roleToPermissions[reqRoleOrPerm];
      if (mapped && mapped.some((p) => userPerms.includes(p))) return true;

      return true;
    });

    if (!hasAccess) {
      throw new ForbiddenException('Admin permissions required');
    }
    return true;
  }
}

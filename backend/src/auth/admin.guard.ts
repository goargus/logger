import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AdminGuard implements CanActivate {
  private authGuard = new (AuthGuard('jwt'))();
  private rolesGuard: RolesGuard;

  constructor(private reflector: Reflector) {
    this.rolesGuard = new RolesGuard(reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const canActivateAuth = await this.authGuard.canActivate(context);

    if (typeof canActivateAuth === 'boolean' && !canActivateAuth) {
      throw new UnauthorizedException('Authentication token required');
    }

    await this.authGuard.canActivate(context);

    return this.rolesGuard.canActivate(context);
  }
}

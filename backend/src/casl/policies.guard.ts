import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from './casl-ability.factory';
import { PolicyHandler, AppAbility } from './types';
import { CHECK_POLICIES_KEY } from './check-policies.decorator';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(CHECK_POLICIES_KEY, context.getHandler()) || [];

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      // If no policy handlers, allow unauthenticated access (other guards handle auth)
      if (policyHandlers.length === 0) {
        return true;
      }
      throw new ForbiddenException('User not authenticated');
    }

    // Always create and attach ability for authenticated users
    const ability = await this.caslAbilityFactory.createForUser(user);
    request.ability = ability;

    // If no policy handlers defined, allow access (ability is still attached)
    if (policyHandlers.length === 0) {
      return true;
    }

    const allowed = policyHandlers.every((handler) => {
      return this.execPolicyHandler(handler, ability);
    });

    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }

  private execPolicyHandler(handler: PolicyHandler, ability: AppAbility): boolean {
    if (typeof handler === 'function') {
      return handler(ability);
    }
    return handler.handle(ability);
  }
}

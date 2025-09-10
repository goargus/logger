import { RolesGuard } from '../../auth/roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  it('should allow user with correct role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const context = createMockContext({ roles: ['admin'], permissions: [] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny user without required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const context = createMockContext({ roles: ['user'], permissions: [] });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should deny user if no roles present in JWT', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const context = createMockContext({ roles: [], permissions: [] });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});

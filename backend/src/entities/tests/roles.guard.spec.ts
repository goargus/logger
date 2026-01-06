import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from '../../auth/roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PermissionsService } from '../../auth/permissions/permissions.service';
import { Permission } from '../../auth/permissions/permission.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let permissionsService: jest.Mocked<PermissionsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        Reflector,
        {
          provide: PermissionsService,
          useValue: {
            userHasPermission: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
    permissionsService = module.get(PermissionsService);
  });

  const createMockContext = (user: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  it('should allow access when user has required role via database permission', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    permissionsService.userHasPermission.mockResolvedValue(true);
    const context = createMockContext({ id: 'user-1', roles: [], permissions: [] });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(permissionsService.userHasPermission).toHaveBeenCalledWith(
      'user-1',
      Permission.SYSTEM_ADMIN,
    );
  });

  it('should deny user without required permission in database', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    permissionsService.userHasPermission.mockResolvedValue(false);
    const context = createMockContext({ id: 'user-1', roles: [], permissions: [] });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should allow access if no roles are required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ id: 'user-1', roles: [], permissions: [] });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
});

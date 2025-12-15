import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PoliciesGuard } from './policies.guard';
import { CaslAbilityFactory } from './casl-ability.factory';
import { Action } from './types';

describe('PoliciesGuard', () => {
  let guard: PoliciesGuard;
  let reflector: Reflector;
  let caslAbilityFactory: CaslAbilityFactory;

  const mockReflector = {
    get: jest.fn(),
  };

  const mockCaslAbilityFactory = {
    createForUser: jest.fn(),
  };

  const mockExecutionContext = {
    getHandler: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user: { id: 'user-1' },
      }),
    }),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoliciesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: CaslAbilityFactory,
          useValue: mockCaslAbilityFactory,
        },
      ],
    }).compile();

    guard = module.get<PoliciesGuard>(PoliciesGuard);
    reflector = module.get<Reflector>(Reflector);
    caslAbilityFactory = module.get<CaslAbilityFactory>(CaslAbilityFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access when no policies are defined', async () => {
      mockReflector.get.mockReturnValue([]);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockCaslAbilityFactory.createForUser).not.toHaveBeenCalled();
    });

    it('should allow access when all policies pass', async () => {
      const mockAbility = {
        can: jest.fn().mockReturnValue(true),
      };

      mockReflector.get.mockReturnValue([(ability: any) => ability.can(Action.Read, 'Activity')]);

      mockCaslAbilityFactory.createForUser.mockResolvedValue(mockAbility);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockCaslAbilityFactory.createForUser).toHaveBeenCalledWith({ id: 'user-1' });
      expect(mockAbility.can).toHaveBeenCalledWith(Action.Read, 'Activity');
    });

    it('should deny access when any policy fails', async () => {
      const mockAbility = {
        can: jest.fn().mockReturnValue(false),
      };

      mockReflector.get.mockReturnValue([(ability: any) => ability.can(Action.Delete, 'Entity')]);

      mockCaslAbilityFactory.createForUser.mockResolvedValue(mockAbility);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'Insufficient permissions',
      );
    });

    it('should deny access when user is not authenticated', async () => {
      const contextWithoutUser = {
        getHandler: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: null,
          }),
        }),
      } as unknown as ExecutionContext;

      mockReflector.get.mockReturnValue([(ability: any) => ability.can(Action.Read, 'Activity')]);

      await expect(guard.canActivate(contextWithoutUser)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(contextWithoutUser)).rejects.toThrow('User not authenticated');
    });

    it('should check multiple policies and all must pass', async () => {
      const mockAbility = {
        can: jest.fn(),
      };

      mockAbility.can.mockReturnValueOnce(true).mockReturnValueOnce(false);

      mockReflector.get.mockReturnValue([
        (ability: any) => ability.can(Action.Read, 'Activity'),
        (ability: any) => ability.can(Action.Create, 'Entity'),
      ]);

      mockCaslAbilityFactory.createForUser.mockResolvedValue(mockAbility);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(ForbiddenException);
    });

    it('should attach ability to request object', async () => {
      const mockAbility = {
        can: jest.fn().mockReturnValue(true),
      };

      const mockRequest = {
        user: { id: 'user-1' },
      };

      const contextWithRequest = {
        getHandler: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      mockReflector.get.mockReturnValue([(ability: any) => ability.can(Action.Read, 'Activity')]);

      mockCaslAbilityFactory.createForUser.mockResolvedValue(mockAbility);

      await guard.canActivate(contextWithRequest);

      expect(mockRequest).toHaveProperty('ability', mockAbility);
    });

    it('should handle class-based policy handlers', async () => {
      const mockAbility = {
        can: jest.fn().mockReturnValue(true),
      };

      class TestPolicyHandler {
        handle(ability: any) {
          return ability.can(Action.Update, 'User');
        }
      }

      const handler = new TestPolicyHandler();

      mockReflector.get.mockReturnValue([handler]);

      mockCaslAbilityFactory.createForUser.mockResolvedValue(mockAbility);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockAbility.can).toHaveBeenCalledWith(Action.Update, 'User');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { PeriodsController } from '../periods.controller';
import { LockService } from '../lock.service';
import { IdentityResolutionService } from '../../auth/identity-resolution.service';
import { BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AdminGuard } from '../../auth/admin.guard';

const noopGuard = { canActivate: () => true };

describe('PeriodsController', () => {
  let controller: PeriodsController;
  let lockService: Record<string, jest.Mock>;
  let identityService: Record<string, jest.Mock>;

  beforeEach(async () => {
    lockService = {
      getAvailability: jest.fn(),
      setAdminLock: jest.fn(),
      removeAdminLock: jest.fn(),
      grantException: jest.fn(),
      revokeException: jest.fn(),
    };
    identityService = {
      resolveUserBySubAndIssuer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PeriodsController],
      providers: [
        { provide: LockService, useValue: lockService },
        { provide: IdentityResolutionService, useValue: identityService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(noopGuard)
      .overrideGuard(AdminGuard)
      .useValue(noopGuard)
      .compile();

    controller = module.get<PeriodsController>(PeriodsController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('GET /periods/availability', () => {
    it('returns availability for a given month', async () => {
      identityService.resolveUserBySubAndIssuer.mockResolvedValue({
        id: 'user-1',
        entity_id: 'entity-1',
      });
      lockService.getAvailability.mockResolvedValue({
        currentPeriod: { startDate: '2026-03-16', endDate: '2026-03-31' },
        availableDates: [{ startDate: '2026-03-16', endDate: '2026-03-31' }],
      });

      const req = { user: { sub: 'auth0|123', iss: 'https://issuer/' } } as any;
      const result = await controller.getAvailability(req, '2026-03');

      expect(result.currentPeriod).toEqual({ startDate: '2026-03-16', endDate: '2026-03-31' });
      expect(lockService.getAvailability).toHaveBeenCalledWith('entity-1', 'user-1', '2026-03');
    });

    it('validates month format', async () => {
      identityService.resolveUserBySubAndIssuer.mockResolvedValue({
        id: 'user-1',
        entity_id: 'entity-1',
      });

      const req = { user: { sub: 'auth0|123', iss: 'https://issuer/' } } as any;
      await expect(controller.getAvailability(req, 'invalid')).rejects.toThrow(BadRequestException);
    });

    it('rejects empty month parameter', async () => {
      identityService.resolveUserBySubAndIssuer.mockResolvedValue({
        id: 'user-1',
        entity_id: 'entity-1',
      });

      const req = { user: { sub: 'auth0|123', iss: 'https://issuer/' } } as any;
      await expect(controller.getAvailability(req, '')).rejects.toThrow(BadRequestException);
    });
  });

  describe('PATCH /periods/admin-lock', () => {
    it('sets admin lock and returns the lock', async () => {
      identityService.resolveUserBySubAndIssuer.mockResolvedValue({
        id: 'admin-1',
        entity_id: 'entity-1',
      });
      const mockLock = {
        id: 'lock-1',
        entityId: 'entity-1',
        lockDate: '2026-03-15',
        lockedBy: 'admin-1',
      };
      lockService.setAdminLock.mockResolvedValue(mockLock);

      const req = { user: { sub: 'auth0|admin', iss: 'https://issuer/' } } as any;
      const result = await controller.setAdminLock(req, {
        entityId: 'entity-1',
        lockDate: '2026-03-15',
      });

      expect(result).toEqual(mockLock);
      expect(lockService.setAdminLock).toHaveBeenCalledWith('entity-1', '2026-03-15', 'admin-1');
    });
  });

  describe('DELETE /periods/admin-lock/:entityId', () => {
    it('removes admin lock and returns ok', async () => {
      lockService.removeAdminLock.mockResolvedValue(undefined);

      const result = await controller.removeAdminLock('entity-1');

      expect(result).toEqual({ ok: true });
      expect(lockService.removeAdminLock).toHaveBeenCalledWith('entity-1');
    });
  });

  describe('POST /periods/exceptions', () => {
    it('grants an exception and returns it', async () => {
      identityService.resolveUserBySubAndIssuer.mockResolvedValue({
        id: 'admin-1',
        entity_id: 'entity-1',
      });
      const mockException = {
        id: 'exc-1',
        userId: 'user-1',
        entityId: 'entity-1',
        startDate: '2026-03-01',
        endDate: '2026-03-15',
        grantedBy: 'admin-1',
        reason: 'Late submission',
      };
      lockService.grantException.mockResolvedValue(mockException);

      const req = { user: { sub: 'auth0|admin', iss: 'https://issuer/' } } as any;
      const result = await controller.grantException(req, {
        userId: 'user-1',
        entityId: 'entity-1',
        startDate: '2026-03-01',
        endDate: '2026-03-15',
        reason: 'Late submission',
      });

      expect(result).toEqual(mockException);
      expect(lockService.grantException).toHaveBeenCalledWith(
        'user-1',
        'entity-1',
        '2026-03-01',
        '2026-03-15',
        'admin-1',
        'Late submission',
      );
    });
  });

  describe('DELETE /periods/exceptions/:id', () => {
    it('revokes an exception and returns ok', async () => {
      lockService.revokeException.mockResolvedValue(undefined);

      const result = await controller.revokeException('exc-1');

      expect(result).toEqual({ ok: true });
      expect(lockService.revokeException).toHaveBeenCalledWith('exc-1');
    });
  });
});

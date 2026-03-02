import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { IdentityResolutionService } from './identity-resolution.service';
import { IdpIdentity } from '../idp-identities/idp-identity.entity';
import { User } from '../users/user.entity';
import { UserStatus } from '../users/user-status.enum';

describe('IdentityResolutionService', () => {
  let service: IdentityResolutionService;
  let idpRepo: Record<string, jest.Mock>;
  let userRepo: Record<string, jest.Mock>;

  const activeUser: Partial<User> = {
    id: 'user-1',
    username: 'jdoe',
    email: 'jdoe@example.com',
    status: UserStatus.ACTIVE,
    role: { id: 'role-1', name: 'user' } as any,
    entity: { id: 'entity-1', name: 'TestOrg' } as any,
  };

  beforeEach(async () => {
    idpRepo = { findOne: jest.fn() };
    userRepo = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentityResolutionService,
        { provide: getRepositoryToken(IdpIdentity), useValue: idpRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<IdentityResolutionService>(IdentityResolutionService);
  });

  describe('resolveUserBySubAndIssuer', () => {
    it('returns user when found with sub and issuer', async () => {
      idpRepo.findOne.mockResolvedValue({ user: activeUser });

      const result = await service.resolveUserBySubAndIssuer(
        'auth0|abc',
        'https://auth0.example.com/',
      );

      expect(result).toEqual(activeUser);
      expect(idpRepo.findOne).toHaveBeenCalledWith({
        where: { issuer: 'https://auth0.example.com/', subject: 'auth0|abc' },
        relations: ['user', 'user.role', 'user.entity'],
      });
    });

    it('returns user when found with sub only (no issuer)', async () => {
      idpRepo.findOne.mockResolvedValue({ user: activeUser });

      const result = await service.resolveUserBySubAndIssuer('auth0|abc');

      expect(result).toEqual(activeUser);
      expect(idpRepo.findOne).toHaveBeenCalledWith({
        where: { subject: 'auth0|abc' },
        relations: ['user', 'user.role', 'user.entity'],
      });
    });

    it('throws UnauthorizedException when sub is missing', async () => {
      await expect(service.resolveUserBySubAndIssuer(undefined)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when no identity found', async () => {
      idpRepo.findOne.mockResolvedValue(null);

      await expect(
        service.resolveUserBySubAndIssuer('auth0|missing', 'https://auth0.example.com/'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when identity has no user', async () => {
      idpRepo.findOne.mockResolvedValue({ user: null });

      await expect(
        service.resolveUserBySubAndIssuer('auth0|orphan', 'https://auth0.example.com/'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('loads user with role and entity relations', async () => {
      idpRepo.findOne.mockResolvedValue({ user: activeUser });

      const result = await service.resolveUserBySubAndIssuer(
        'auth0|abc',
        'https://auth0.example.com/',
      );

      expect(result.role).toBeDefined();
      expect(result.entity).toBeDefined();
    });
  });
});

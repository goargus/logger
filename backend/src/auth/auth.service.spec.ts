import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthService, JwtClaims } from './auth.service';
import { IdpIdentitiesService } from '../idp-identities/idp-identities.service';
import { User } from '../users/user.entity';
import { UserStatus } from '../users/user-status.enum';

describe('AuthService', () => {
  let service: AuthService;
  let idpIdentitiesService: Record<string, jest.Mock>;
  let userRepo: Record<string, jest.Mock>;

  const activeUser: Partial<User> = {
    id: 'user-1',
    username: 'jdoe',
    email: 'jdoe@example.com',
    status: UserStatus.ACTIVE,
  };

  const baseClaims: JwtClaims = {
    iss: 'https://auth0.example.com/',
    sub: 'auth0|abc123',
    aud: 'https://api.example.com',
    email: 'jdoe@example.com',
    email_verified: true,
    name: 'John Doe',
  };

  beforeEach(async () => {
    idpIdentitiesService = {
      findByIssuerAndSubject: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    userRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: IdpIdentitiesService, useValue: idpIdentitiesService },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('resolveUserFromJwt', () => {
    it('returns user when identity exists and user is active', async () => {
      const identity = {
        user: activeUser,
        user_id: 'user-1',
        email: 'jdoe@example.com',
        email_verified: true,
        name: 'John Doe',
        audience: 'https://api.example.com',
        last_seen_at: null,
      };
      idpIdentitiesService.findByIssuerAndSubject.mockResolvedValue(identity);
      idpIdentitiesService.save.mockResolvedValue(identity);

      const result = await service.resolveUserFromJwt(baseClaims);

      expect(result.user).toEqual(activeUser);
      expect(result.username).toBe('jdoe');
      expect(idpIdentitiesService.save).toHaveBeenCalled();
    });

    it('updates identity fields when they change', async () => {
      const identity = {
        user: activeUser,
        user_id: 'user-1',
        email: 'old@example.com',
        email_verified: false,
        name: 'Old Name',
        audience: null,
        last_seen_at: null,
      };
      idpIdentitiesService.findByIssuerAndSubject.mockResolvedValue(identity);
      idpIdentitiesService.save.mockResolvedValue(identity);

      await service.resolveUserFromJwt(baseClaims);

      expect(identity.email).toBe('jdoe@example.com');
      expect(identity.email_verified).toBe(true);
      expect(identity.name).toBe('John Doe');
      expect(identity.audience).toBe('https://api.example.com');
    });

    it('throws ForbiddenException when user is not active', async () => {
      const identity = {
        user: { ...activeUser, status: UserStatus.SUSPENDED },
        last_seen_at: null,
      };
      idpIdentitiesService.findByIssuerAndSubject.mockResolvedValue(identity);
      idpIdentitiesService.save.mockResolvedValue(identity);

      await expect(service.resolveUserFromJwt(baseClaims)).rejects.toThrow(ForbiddenException);
    });

    it('throws UnauthorizedException when iss is missing', async () => {
      await expect(
        service.resolveUserFromJwt({ ...baseClaims, iss: undefined }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when sub is missing', async () => {
      await expect(
        service.resolveUserFromJwt({ ...baseClaims, sub: undefined }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('auto-links by verified email when single active user matches', async () => {
      idpIdentitiesService.findByIssuerAndSubject.mockResolvedValue(null);
      userRepo.find.mockResolvedValue([activeUser]);
      idpIdentitiesService.create.mockResolvedValue({
        user_id: 'user-1',
        user: activeUser,
      });

      const result = await service.resolveUserFromJwt(baseClaims, 'auth0', {
        allowAutoLinkByVerifiedEmail: true,
      });

      expect(result.user).toEqual(activeUser);
      expect(idpIdentitiesService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          issuer: 'https://auth0.example.com/',
          subject: 'auth0|abc123',
        }),
      );
    });

    it('does not auto-link when multiple users match the email', async () => {
      idpIdentitiesService.findByIssuerAndSubject.mockResolvedValue(null);
      userRepo.find.mockResolvedValue([activeUser, { ...activeUser, id: 'user-2' }]);

      await expect(
        service.resolveUserFromJwt(baseClaims, 'auth0', {
          allowAutoLinkByVerifiedEmail: true,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('does not auto-link when email is not verified', async () => {
      idpIdentitiesService.findByIssuerAndSubject.mockResolvedValue(null);

      await expect(
        service.resolveUserFromJwt(
          { ...baseClaims, email_verified: false },
          'auth0',
          { allowAutoLinkByVerifiedEmail: true },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when no identity and auto-link disabled', async () => {
      idpIdentitiesService.findByIssuerAndSubject.mockResolvedValue(null);

      await expect(service.resolveUserFromJwt(baseClaims)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('linkIdentityToUser', () => {
    it('creates a new identity link', async () => {
      userRepo.findOne.mockResolvedValue(activeUser);
      idpIdentitiesService.findByIssuerAndSubject.mockResolvedValue(null);
      const created = { id: 'idp-1', user_id: 'user-1' };
      idpIdentitiesService.create.mockResolvedValue(created);

      const result = await service.linkIdentityToUser({
        user_id: 'user-1',
        provider: 'auth0',
        issuer: 'https://auth0.example.com/',
        subject: 'auth0|abc123',
      });

      expect(result).toEqual(created);
    });

    it('returns existing identity if already linked to same user', async () => {
      userRepo.findOne.mockResolvedValue(activeUser);
      const existing = { id: 'idp-1', user_id: 'user-1' };
      idpIdentitiesService.findByIssuerAndSubject.mockResolvedValue(existing);

      const result = await service.linkIdentityToUser({
        user_id: 'user-1',
        provider: 'auth0',
        issuer: 'https://auth0.example.com/',
        subject: 'auth0|abc123',
      });

      expect(result).toEqual(existing);
      expect(idpIdentitiesService.create).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException if identity is linked to another user', async () => {
      userRepo.findOne.mockResolvedValue(activeUser);
      idpIdentitiesService.findByIssuerAndSubject.mockResolvedValue({
        id: 'idp-1',
        user_id: 'user-2',
      });

      await expect(
        service.linkIdentityToUser({
          user_id: 'user-1',
          provider: 'auth0',
          issuer: 'https://auth0.example.com/',
          subject: 'auth0|abc123',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException if target user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.linkIdentityToUser({
          user_id: 'user-missing',
          provider: 'auth0',
          issuer: 'https://auth0.example.com/',
          subject: 'auth0|abc123',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

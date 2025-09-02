import { Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IdpIdentity } from '../idp-identities/idp-identity.entity';
import { IdpIdentitiesService } from '../idp-identities/idp-identities.service';
import { User } from '../users/user.entity';
import { UserStatus } from '../users/user-status.enum';

export type JwtClaims = {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  email?: string;
  email_verified?: boolean;
  name?: string;
  [k: string]: any;
};

export type ProviderHint = 'auth0' | 'google' | 'azuread' | 'generic';

@Injectable()
export class AuthService {
  constructor(
    private readonly idpIdentitiesService: IdpIdentitiesService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async resolveUserFromJwt(
    claims: JwtClaims,
    provider: ProviderHint = 'auth0',
    opts: { allowAutoLinkByVerifiedEmail?: boolean } = { allowAutoLinkByVerifiedEmail: false },
  ): Promise<{ user: User; username: string }> {
    const issuer = String(claims.iss ?? '').trim();
    const subject = String(claims.sub ?? '').trim();
    const audience = Array.isArray(claims.aud) ? claims.aud[0] : (claims.aud ?? null);
    const email = claims.email?.trim().toLowerCase() ?? null;
    const emailVerified = claims.email_verified ?? null;
    const name = claims.name ?? null;

    if (!issuer || !subject) {
      throw new UnauthorizedException('Token missing required iss/sub.');
    }

    let identity = await this.idpIdentitiesService.findByIssuerAndSubject(issuer, subject);

    if (identity) {
      identity.last_seen_at = new Date();
      const shouldSave = true;

      if (email && identity.email !== email) identity.email = email;
      if (typeof emailVerified === 'boolean' && identity.email_verified !== emailVerified) {
        identity.email_verified = emailVerified;
      }
      if (name && identity.name !== name) identity.name = name;
      if (audience && identity.audience !== audience) identity.audience = audience;

      if (shouldSave) {
        await this.idpIdentitiesService.save(identity);
      }

      if (identity.user?.status !== UserStatus.ACTIVE) {
        throw new ForbiddenException('Your account is not active.');
      }
      return { user: identity.user, username: identity.user.username };
    }

    if (opts.allowAutoLinkByVerifiedEmail && email && emailVerified === true) {
      const candidates = await this.userRepo.find({
        where: { email, status: UserStatus.ACTIVE },
        take: 2,
      });

      if (candidates.length === 1) {
        const user = candidates[0];
        identity = await this.idpIdentitiesService.create({
          user_id: user.id,
          provider,
          issuer,
          subject,
          audience,
          email,
          email_verified: true,
          name,
          last_seen_at: new Date(),
        });
        return { user, username: user.username };
      }
    }

    throw new ForbiddenException(
      'No linked identity found. Please contact support to link your account or sign in with the correct provider.',
    );
  }

  async linkIdentityToUser(params: {
    user_id: string;
    provider: string;
    issuer: string;
    subject: string;
    audience?: string | null;
    email?: string | null;
    email_verified?: boolean | null;
    name?: string | null;
  }): Promise<IdpIdentity> {
    const user = await this.userRepo.findOne({ where: { id: params.user_id } });
    if (!user) throw new ForbiddenException('Target user not found.');

    const existing = await this.idpIdentitiesService.findByIssuerAndSubject(
      params.issuer,
      params.subject,
    );

    if (existing) {
      if (existing.user_id !== user.id) {
        throw new ForbiddenException('This identity is already linked to another user.');
      }
      return existing;
    }

    const identity = await this.idpIdentitiesService.create({
      user_id: user.id,
      provider: params.provider,
      issuer: params.issuer,
      subject: params.subject,
      audience: params.audience ?? null,
      email: params.email?.toLowerCase() ?? null,
      email_verified: params.email_verified ?? null,
      name: params.name ?? null,
      last_seen_at: null,
    });

    return identity;
  }
}

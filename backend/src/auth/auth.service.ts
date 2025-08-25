import { Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdpIdentity } from './idp_identity.entity';
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
    @InjectRepository(IdpIdentity) private readonly idpRepo: Repository<IdpIdentity>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async resolveUserFromJwt(
    claims: JwtClaims,
    provider: ProviderHint = 'auth0',
    opts: { allowAutoLinkByVerifiedEmail?: boolean } = { allowAutoLinkByVerifiedEmail: true },
  ): Promise<{ user: User; username: string }> {
    const issuer = String(claims.iss ?? '').trim();
    const subject = String(claims.sub ?? '').trim();
    const audience = Array.isArray(claims.aud) ? claims.aud[0] : (claims.aud ?? null);
    const email = claims.email?.trim().toLowerCase() ?? null;
    const emailVerified = !!claims.email_verified;
    const name = claims.name ?? null;

    if (!issuer || !subject) {
      throw new UnauthorizedException('Token missing required iss/sub.');
    }

    let identity = await this.idpRepo.findOne({
      where: { issuer, subject },
      relations: { user: true },
    });
    if (identity) {
      identity.last_seen_at = new Date();
      await this.idpRepo.save(identity);

      if (identity.user?.status !== UserStatus.ACTIVE) {
        throw new ForbiddenException('Your account is not active.');
      }
      return { user: identity.user, username: identity.user.username };
    }

    if (opts.allowAutoLinkByVerifiedEmail && email && emailVerified) {
      const candidates = await this.userRepo.find({
        where: { email, status: UserStatus.ACTIVE },
        take: 2,
      });
      if (candidates.length === 1) {
        const user = candidates[0];
        identity = this.idpRepo.create({
          user_id: user.id,
          provider,
          issuer,
          subject,
          audience,
          email,
          email_verified: emailVerified,
          name,
          last_seen_at: new Date(),
        });
        await this.idpRepo.save(identity);
        return { user, username: user.username };
      }
    }

    throw new ForbiddenException(
      'No linked identity found. Please contact support to link your account or sign in with the correct provider.',
    );
  }
}

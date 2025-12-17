import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdentityResolutionService } from './identity-resolution.service';
import { UserRoleAssignment } from '../roles/user-role-assignment.entity';
import { User } from '../users/user.entity';
import { getCurrentDateString, isDateInRange } from '../common/date.utils';

export interface JwtValidatedUser extends User {
  sub: string;
  iss?: string;
  aud?: string | string[];
  roleAssignments?: UserRoleAssignment[];
  [k: string]: any;
}

function ensureTrailingSlash(url?: string): string | undefined {
  if (!url) return undefined;
  return url.endsWith('/') ? url : `${url}/`;
}

function firstDefined<T>(...getters: Array<() => T | undefined | null>): T | undefined {
  for (const g of getters) {
    const v = g();
    if (v !== undefined && v !== null && v !== '') return v as T;
  }
  return undefined;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly expectedIssuer: string;
  private readonly expectedAudience: string;

  constructor(
    config: ConfigService,
    private readonly identityResolution: IdentityResolutionService,
    @InjectRepository(UserRoleAssignment)
    private readonly userRoleAssignmentRepo: Repository<UserRoleAssignment>,
  ) {
    const issuerFromCfg =
      firstDefined<string>(
        () => config.get<string>('auth.issuer'),
        () => config.get<string>('AUTH0_ISSUER'),
        () => config.get<string>('AUTH_ISSUER'),
        () => {
          const domain = config.get<string>('AUTH0_DOMAIN');
          return domain ? `https://${domain}/` : undefined;
        },
      ) || '';

    const issuer = ensureTrailingSlash(issuerFromCfg) as string;
    const audience =
      firstDefined<string>(
        () => config.get<string>('auth.audience'),
        () => config.get<string>('AUTH0_AUDIENCE'),
        () => config.get<string>('AUTH_AUDIENCE'),
      ) || 'logger';

    const jwksUri = `${issuer}.well-known/jwks.json`;

    const opts: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        jwksUri,
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 10 * 60 * 1000,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
      }),
      algorithms: ['RS256'],
      ignoreExpiration: false,
    };

    super(opts);

    this.expectedIssuer = issuer;
    this.expectedAudience = audience;
  }

  private toArray(aud?: string | string[] | null): string[] {
    if (!aud) return [];
    return Array.isArray(aud) ? aud : [aud];
  }

  private readArrayClaim(payload: any, keys: string[]): string[] {
    for (const k of keys) {
      const v = payload?.[k];
      if (Array.isArray(v)) return v.filter((x) => typeof x === 'string');
    }
    return [];
  }

  async validate(payload: any): Promise<JwtValidatedUser> {
    const sub = payload?.sub ?? payload?.subject;
    if (!sub) throw new UnauthorizedException('Token has no sub');

    const iss: string | undefined = payload?.iss;
    const audList = this.toArray(payload?.aud);

    if (!iss) throw new UnauthorizedException('Invalid token: missing iss');
    if (iss !== this.expectedIssuer) throw new UnauthorizedException('Invalid token issuer');

    if (!audList.includes(this.expectedAudience)) {
      throw new UnauthorizedException('Invalid token audience');
    }

    const user = await this.identityResolution.resolveUserBySubAndIssuer(sub, iss);

    const today = getCurrentDateString();
    const roleAssignments = await this.userRoleAssignmentRepo
      .find({
        where: {
          user: { id: user.id },
        },
        relations: ['role', 'entity', 'user'],
      })
      .then((assignments) =>
        assignments.filter((a) => isDateInRange(today, a.start_date, a.end_date)),
      );

    return {
      ...user,
      sub,
      iss,
      aud: payload?.aud,
      roleAssignments,
    };
  }
}

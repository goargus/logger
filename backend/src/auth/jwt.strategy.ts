import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

export interface JwtValidatedUser {
  sub: string;
  iss?: string;
  aud?: string | string[];
  roles: string[];
  permissions: string[];
  [k: string]: any;
}

function ensureTrailingSlash(url?: string): string | undefined {
  if (!url) return undefined;
  return url.endsWith('/') ? url : `${url}/`;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly rolesClaimKeys: string[];
  private readonly permsClaimKeys: string[];

  constructor(private readonly config: ConfigService) {
    const domain = config.get<string>('auth.domain');
    const audience = config.get<string>('auth.audience');
    let issuer = config.get<string>('auth.issuer');
    if (!issuer && domain) issuer = `https://${domain}`;
    issuer = ensureTrailingSlash(issuer);

    if (!issuer) {
      throw new Error(
        'auth.issuer (o auth.domain) no está configurado. Define AUTH0_ISSUER o AUTH0_DOMAIN en tu config.',
      );
    }

    const jwksUri = `${issuer}.well-known/jwks.json`;

    const opts: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['RS256'],
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        jwksUri,
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
      }),
      issuer,
      audience,
      ignoreExpiration: false,
    };

    super(opts);

    const ns = this.config.get<string>('auth.claimsNamespace');
    this.rolesClaimKeys = [ns ? `${ns}/roles` : '', 'roles'].filter(Boolean);
    this.permsClaimKeys = [ns ? `${ns}/permissions` : '', 'permissions', 'perm'].filter(Boolean);
  }

  private readArrayClaim(payload: any, keys: string[]): string[] {
    for (const k of keys) {
      const v = payload?.[k];
      if (Array.isArray(v)) return v.map(String);
      if (typeof v === 'string' && (k === 'permissions' || k.endsWith('/permissions'))) {
        return v
          .split(' ')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    if (typeof payload?.scope === 'string') {
      return payload.scope
        .split(' ')
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    return [];
  }

  async validate(payload: any): Promise<JwtValidatedUser> {
    const sub = payload?.sub ?? payload?.subject;
    if (!sub) {
      throw new UnauthorizedException('Token has no sub.');
    }

    return {
      sub,
      iss: payload?.iss,
      aud: payload?.aud,
      roles: this.readArrayClaim(payload, this.rolesClaimKeys),
      permissions: this.readArrayClaim(payload, this.permsClaimKeys),
    };
  }
}

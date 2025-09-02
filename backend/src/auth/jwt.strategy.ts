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

function ensureTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly claimsNs?: string;
  private readonly rolesClaimKeys: string[];
  private readonly permsClaimKeys: string[];

  constructor(private readonly config: ConfigService) {
    const alg = (
      config.get<string>('auth.algorithm') ||
      process.env.JWT_ALG ||
      'RS256'
    ).toUpperCase();

    let issuer =
      config.get<string>('auth.issuer') ||
      process.env.AUTH_ISSUER ||
      process.env.AUTH0_DOMAIN ||
      '';

    if (issuer && !issuer.startsWith('http')) {
      issuer = `https://${issuer}`;
    }
    if (issuer) {
      issuer = ensureTrailingSlash(issuer);
    }

    const audience = config.get<string>('auth.audience') || process.env.AUTH_AUDIENCE || undefined;

    let opts: StrategyOptions;

    if (alg.startsWith('RS')) {
      const jwksUri = config.get<string>('auth.jwksUri') || `${issuer}.well-known/jwks.json`;

      opts = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        algorithms: ['RS256'],
        secretOrKeyProvider: jwksRsa.passportJwtSecret({
          jwksUri,
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 10,
        }),
        issuer: issuer || undefined,
        audience,
        ignoreExpiration: false,
      };
    } else {
      const secret = config.get<string>('auth.secret') || process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('Missing JWT secret. Set auth.secret or JWT_SECRET when using HS256.');
      }
      opts = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        algorithms: ['HS256'],
        secretOrKey: secret,
        issuer: issuer || undefined,
        audience,
        ignoreExpiration: false,
      };
    }

    super(opts);

    this.claimsNs = this.config.get<string>('auth.claimsNamespace') || process.env.JWT_CLAIMS_NS;

    this.rolesClaimKeys = [this.claimsNs ? `${this.claimsNs}/roles` : '', 'roles'].filter(Boolean);

    this.permsClaimKeys = [
      this.claimsNs ? `${this.claimsNs}/permissions` : '',
      'permissions',
      'perm',
    ].filter(Boolean);
  }

  private readArrayClaim(payload: any, keys: string[]): string[] {
    for (const k of keys) {
      const v = payload?.[k];
      if (Array.isArray(v)) return v.map(String);
      if (typeof v === 'string' && k === 'permissions') {
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

    const iss: string | undefined = payload?.iss;
    const aud: string | string[] | undefined = payload?.aud;

    const roles = this.readArrayClaim(payload, this.rolesClaimKeys);
    const permissions = this.readArrayClaim(payload, this.permsClaimKeys);

    return {
      sub,
      iss,
      aud,
      roles,
      permissions,
    };
  }
}

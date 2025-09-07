// src/auth/jwt.strategy.ts
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

  constructor(config: ConfigService) {
    // ⚠️ NO usar `this` antes de super(...)
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

    const issuer = ensureTrailingSlash(issuerFromCfg) as string; // ej.: 'https://dev-xxx.us.auth0.com/'
    const audience =
      firstDefined<string>(
        () => config.get<string>('auth.audience'),
        () => config.get<string>('AUTH0_AUDIENCE'),
        () => config.get<string>('AUTH_AUDIENCE'),
      ) || 'logger';

    const jwksUri = `${issuer}.well-known/jwks.json`;

    // ✅ Sin clockTolerance ni passReqToCallback; tipos correctos para passport-jwt
    const opts: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        jwksUri,
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 10 * 60 * 1000, // 10 min
        rateLimit: true,
        jwksRequestsPerMinute: 10,
      }),
      algorithms: ['RS256'],
      ignoreExpiration: false,
      // Importante: NO fijamos issuer/audience aquí para poder loguear el motivo si fallan.
      // Los validamos manualmente dentro de `validate()`.
    };

    super(opts);

    this.expectedIssuer = issuer;
    this.expectedAudience = audience;

    // Logs de arranque (puedes quitarlos en prod)
    // eslint-disable-next-line no-console
    console.log('[JwtStrategy] issuer =', this.expectedIssuer);
    // eslint-disable-next-line no-console
    console.log('[JwtStrategy] audience =', this.expectedAudience);
    // eslint-disable-next-line no-console
    console.log('[JwtStrategy] jwksUri =', jwksUri);
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
    // En este punto la FIRMA ya fue verificada (RS256 via JWKS).
    // Validamos issuer y audience manualmente para diagnosticar 401 con mensajes claros.

    const sub = payload?.sub ?? payload?.subject;
    if (!sub) throw new UnauthorizedException('Token has no sub');

    const iss: string | undefined = payload?.iss;
    const audList = this.toArray(payload?.aud);

    // Issuer
    if (!iss) {
      // eslint-disable-next-line no-console
      console.warn('[JwtStrategy] Missing iss in token payload');
      throw new UnauthorizedException('Invalid token: missing iss');
    }
    if (iss !== this.expectedIssuer) {
      // eslint-disable-next-line no-console
      console.warn('[JwtStrategy] Invalid iss:', iss, 'expected:', this.expectedIssuer);
      throw new UnauthorizedException('Invalid token issuer');
    }

    // Audience
    if (!audList.includes(this.expectedAudience)) {
      // eslint-disable-next-line no-console
      console.warn(
        '[JwtStrategy] Invalid aud:',
        audList,
        'expected to include:',
        this.expectedAudience,
      );
      throw new UnauthorizedException('Invalid token audience');
    }

    // Roles/permissions opcionales (ajusta namespaces si los usas)
    const roles = this.readArrayClaim(payload, ['roles', 'https://roles', 'https://app/roles']);
    const permissions = this.readArrayClaim(payload, [
      'permissions',
      'https://permissions',
      'https://app/permissions',
    ]);

    return { sub, iss, aud: payload?.aud, roles, permissions, ...payload };
  }
}

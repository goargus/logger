import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import * as jwksRsa from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly auth: AuthService,
  ) {
    const issuerFromEnv = config.get<string>('auth.issuer') || process.env.AUTH_ISSUER || '';
    const audienceFromEnv = config.get<string>('auth.audience') || process.env.AUTH_AUDIENCE || '';

    const issuer = issuerFromEnv.endsWith('/') ? issuerFromEnv : `${issuerFromEnv}/`;
    const jwksUri = `${issuer}.well-known/jwks.json`;

    const opts: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 10 * 60 * 1000,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri,
      }),
      algorithms: ['RS256'],
      issuer,
      audience: audienceFromEnv || undefined,
    };

    super(opts);
  }

  async validate(payload: any) {
    const provider = 'auth0' as const;

    const { user, username } = await this.auth.resolveUserFromJwt(payload, provider, {
      allowAutoLinkByVerifiedEmail: true,
    });

    return {
      id: user.id,
      username,
      email: (user as any).email ?? null,
      roles: (user as any).roles ?? [],
      permissions: (user as any).permissions ?? [],
    };
  }
}

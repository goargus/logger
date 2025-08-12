import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as jwksRsa from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const issuer = configService.get<string>('auth.issuer');
    const audience = configService.get<string>('auth.audience');

    if (!issuer || !audience) {
      throw new Error(`Auth config missing. Got issuer="${issuer}", audience="${audience}".`);
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${issuer}.well-known/jwks.json`,
      }) as any,
      audience,
      issuer,
      algorithms: ['RS256'],
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    const permissions: string[] = Array.isArray(payload?.permissions)
      ? payload.permissions
      : typeof payload?.scope === 'string'
        ? payload.scope.split(' ').filter(Boolean)
        : [];

    const roles: string[] = Array.isArray(payload?.roles) ? payload.roles : [];

    return {
      userId: payload.sub,
      email: payload.email,
      permissions,
      roles,
    };
  }
}

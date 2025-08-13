import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as jwksRsa from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const issuerCfg = config.get<string>('auth.issuer');
    const audienceCfg = config.get<string>('auth.audience');
    const issuerEnv = process.env.AUTH0_ISSUER;
    const audienceEnv = process.env.AUTH0_AUDIENCE;

    const issuer = issuerCfg ?? issuerEnv ?? '';
    const audience = audienceCfg ?? audienceEnv ?? '';

    if (!issuer) {
      throw new Error('JWT issuer is missing. Set auth.issuer or AUTH0_ISSUER.');
    }
    if (!audience) {
      throw new Error('JWT audience is missing. Set auth.audience or AUTH0_AUDIENCE.');
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
    let permissions: string[] = [];
    if (Array.isArray(payload?.permissions)) {
      permissions = payload.permissions.filter((p) => typeof p === 'string');
    } else if (typeof payload?.scope === 'string') {
      permissions = payload.scope.split(' ').filter(Boolean);
    }

    let roles: string[] = [];
    if (Array.isArray(payload?.roles)) {
      roles = payload.roles.filter((r) => typeof r === 'string');
    } else if (typeof payload?.roles === 'string') {
      roles = payload.roles
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);
    }

    return {
      userId: payload?.sub ?? payload?.userId ?? payload?.id ?? null,
      email: typeof payload?.email === 'string' ? payload.email : null,
      permissions,
      roles,
      ...payload,
    };
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { IdpRegistry, IdpConfig } from './idp-registry';
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

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly idpRegistry: IdpRegistry;
  private resolvedIdp: IdpConfig | undefined;

  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
    @InjectRepository(UserRoleAssignment)
    private readonly userRoleAssignmentRepo: Repository<UserRoleAssignment>,
  ) {
    const registry = new IdpRegistry();

    // Register Auth0
    const auth0Issuer =
      config.get<string>('auth.issuer') || config.get<string>('AUTH0_ISSUER') || '';
    const auth0Audience =
      config.get<string>('auth.audience') || config.get<string>('AUTH0_AUDIENCE') || 'logger';
    const auth0Domain =
      config.get<string>('auth.domain') || config.get<string>('AUTH0_DOMAIN') || '';

    if (auth0Issuer) {
      registry.register({
        name: 'Auth0',
        issuer: auth0Issuer,
        jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
        audience: auth0Audience,
        identityClaim: 'sub',
        provider: 'auth0',
        emailVerifiedByDefault: false,
      });
    }

    // Register Entra ID
    const entraTenantId =
      config.get<string>('auth.entraId.tenantId') || config.get<string>('ENTRA_TENANT_ID') || '';
    const entraClientId =
      config.get<string>('auth.entraId.clientId') || config.get<string>('ENTRA_CLIENT_ID') || '';

    if (entraTenantId && entraClientId) {
      registry.register({
        name: 'Entra ID',
        issuer: `https://login.microsoftonline.com/${entraTenantId}/v2.0`,
        jwksUri: `https://login.microsoftonline.com/${entraTenantId}/discovery/v2.0/keys`,
        audience: entraClientId,
        identityClaim: 'oid',
        provider: 'azuread',
        emailVerifiedByDefault: true,
        extraValidation: (payload: any) => {
          if (payload.tid !== entraTenantId) {
            throw new UnauthorizedException('Invalid token tenant');
          }
        },
      });
    }

    const strategy = { idpRegistry: registry, resolvedIdp: undefined as IdpConfig | undefined };

    const opts: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: (request: any, rawJwtToken: string, done: any) => {
        try {
          // Decode payload without verification to get issuer
          const parts = rawJwtToken.split('.');
          if (parts.length !== 3) {
            return done(new UnauthorizedException('Malformed token'));
          }
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
          const iss = payload?.iss;

          if (!iss) {
            return done(new UnauthorizedException('Token missing iss claim'));
          }

          const idp = registry.resolve(iss);
          if (!idp) {
            return done(new UnauthorizedException(`Unknown token issuer: ${iss}`));
          }

          // Store resolved IdP for use in validate()
          strategy.resolvedIdp = idp;

          // Use the IdP's JWKS client to get the signing key
          const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
          idp.jwksClient.getSigningKey(header.kid, (err: any, key: any) => {
            if (err) return done(err);
            done(null, key.getPublicKey());
          });
        } catch (err) {
          done(new UnauthorizedException('Failed to resolve token signing key'));
        }
      },
      algorithms: ['RS256'],
      ignoreExpiration: false,
    };

    super(opts);

    this.idpRegistry = registry;
    // Share the strategy reference for resolvedIdp access
    Object.defineProperty(this, '_strategyRef', { value: strategy, enumerable: false });
  }

  private toArray(aud?: string | string[] | null): string[] {
    if (!aud) return [];
    return Array.isArray(aud) ? aud : [aud];
  }

  async validate(payload: any): Promise<JwtValidatedUser> {
    // Retrieve the resolved IdP from the secretOrKeyProvider step
    const strategyRef = (this as any)._strategyRef;
    const idp: IdpConfig | undefined = strategyRef?.resolvedIdp;

    if (!idp) {
      throw new UnauthorizedException('No IdP resolved for token');
    }

    // Per-IdP validation: issuer
    const iss = payload?.iss;
    if (iss !== idp.issuer) {
      throw new UnauthorizedException('Invalid token issuer');
    }

    // Per-IdP validation: audience
    const audList = this.toArray(payload?.aud);
    if (!audList.includes(idp.audience)) {
      throw new UnauthorizedException('Invalid token audience');
    }

    // Per-IdP extra validation (e.g., tid check for Entra ID)
    if (idp.extraValidation) {
      idp.extraValidation(payload);
    }

    // Extract the correct identity claim
    const identityValue = payload?.[idp.identityClaim];
    if (!identityValue) {
      throw new UnauthorizedException(`Token missing ${idp.identityClaim} claim`);
    }

    // Build claims for AuthService
    const { user } = await this.authService.resolveUserFromJwt(
      {
        iss,
        sub: identityValue,
        aud: payload?.aud,
        email: payload?.email || payload?.preferred_username,
        email_verified: idp.emailVerifiedByDefault ? true : (payload?.email_verified ?? null),
        name: payload?.name,
      },
      idp.provider,
      { allowAutoLinkByVerifiedEmail: true },
    );

    // Load role assignments
    const today = getCurrentDateString();
    const roleAssignments = await this.userRoleAssignmentRepo
      .find({
        where: { user: { id: user.id } },
        relations: ['role', 'entity', 'user'],
      })
      .then((assignments) =>
        assignments.filter((a) => isDateInRange(today, a.start_date, a.end_date)),
      );

    const roles: string[] = [];
    if (user.role?.name) {
      roles.push(user.role.name);
    }
    roleAssignments.forEach((assignment) => {
      if (assignment.role?.name && !roles.includes(assignment.role.name)) {
        roles.push(assignment.role.name);
      }
    });

    return {
      ...user,
      sub: identityValue,
      iss,
      aud: payload?.aud,
      roleAssignments,
      roles,
    };
  }
}

import * as jwksRsa from 'jwks-rsa';

export interface IdpConfig {
  name: string;
  issuer: string;
  jwksUri: string;
  audience: string;
  identityClaim: string; // 'oid' for Entra ID, 'sub' for Auth0
  provider: 'auth0' | 'google' | 'azuread' | 'generic';
  emailVerifiedByDefault: boolean;
  jwksClient: jwksRsa.JwksClient;
  extraValidation?: (payload: any) => void;
}

export class IdpRegistry {
  private readonly idps: Map<string, IdpConfig> = new Map();

  register(config: Omit<IdpConfig, 'jwksClient'>): void {
    const jwksClient = new jwksRsa.JwksClient({
      jwksUri: config.jwksUri,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });

    this.idps.set(config.issuer, { ...config, jwksClient });
  }

  resolve(issuer: string): IdpConfig | undefined {
    return this.idps.get(issuer);
  }

  getAllIssuers(): string[] {
    return Array.from(this.idps.keys());
  }
}

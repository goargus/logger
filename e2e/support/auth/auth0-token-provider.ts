import axios from 'axios';

export interface Auth0Credentials {
  email: string;
  password: string;
}

export interface Auth0TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

/**
 * Provides Auth0 access tokens for e2e tests using Resource Owner Password Grant.
 * Caches tokens to minimize Auth0 API calls.
 */
export class Auth0TokenProvider {
  private readonly domain: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly audience: string;
  // Static cache shared across all instances to avoid rate limits
  private static tokenCache: Map<string, { token: string; expiresAt: number }> = new Map();

  constructor() {
    this.domain = process.env.AUTH0_DOMAIN || '';
    this.clientId = process.env.AUTH0_E2E_CLIENT_ID || '';
    this.clientSecret = process.env.AUTH0_E2E_CLIENT_SECRET || '';
    this.audience = process.env.AUTH0_AUDIENCE || '';

    if (!this.domain || !this.clientId || !this.clientSecret) {
      console.warn('Auth0 credentials not fully configured. Token acquisition will fail.');
    }
  }

  /**
   * Get an access token for the given credentials.
   * Uses cached token if available and not expired.
   */
  async getToken(credentials: Auth0Credentials): Promise<string> {
    const cacheKey = credentials.email;
    const cached = Auth0TokenProvider.tokenCache.get(cacheKey);

    // Return cached token if still valid (with 60s buffer)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.token;
    }

    // Request new token with retry on rate limit
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await axios.post<Auth0TokenResponse>(
          `https://${this.domain}/oauth/token`,
          {
            grant_type: 'password',
            client_id: this.clientId,
            client_secret: this.clientSecret,
            audience: this.audience,
            username: credentials.email,
            password: credentials.password,
            scope: 'openid profile email',
          },
          {
            headers: { 'Content-Type': 'application/json' },
          },
        );

        const { access_token, expires_in } = response.data;

        // Cache with 60s buffer before expiration
        Auth0TokenProvider.tokenCache.set(cacheKey, {
          token: access_token,
          expiresAt: Date.now() + (expires_in - 60) * 1000,
        });

        return access_token;
      } catch (error: any) {
        lastError = error;
        if (error.response?.status === 429 && attempt < maxRetries - 1) {
          // Rate limited - wait with exponential backoff (longer delays to allow rate limit to reset)
          const waitTime = Math.pow(2, attempt + 2) * 1000; // 4s, 8s, 16s
          console.log(`Rate limited by Auth0, retrying in ${waitTime / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Clear the token cache.
   */
  clearCache(): void {
    Auth0TokenProvider.tokenCache.clear();
  }
}

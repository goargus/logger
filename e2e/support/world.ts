// Load env vars first before any other imports
import './env';

import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import { Page, Browser, BrowserContext } from '@playwright/test';
import { AxiosInstance } from 'axios';
import { Auth0TokenProvider } from './auth/auth0-token-provider';
import { createApiClient } from './api/api-client';

export interface TestContext {
  lastResponse?: any;
  lastCreatedActivity?: any;
  activityTypeId?: string;
  activityTypeName?: string;
  currentUser?: string;
  accessToken?: string;
  [key: string]: any;
}

export class CustomWorld extends World {
  // Browser automation (for UI tests)
  public browser?: Browser;
  public browserContext?: BrowserContext;
  public page?: Page;

  // API testing
  public apiClient!: AxiosInstance;
  public auth0Provider: Auth0TokenProvider;

  // Test context - shared state between steps
  public context: TestContext = {};

  // Configuration
  public readonly baseApiUrl: string;
  public readonly baseFrontendUrl: string;

  constructor(options: IWorldOptions) {
    super(options);
    this.auth0Provider = new Auth0TokenProvider();
    this.baseApiUrl = options.parameters.baseApiUrl || process.env.E2E_API_URL || 'http://localhost:3001';
    this.baseFrontendUrl = options.parameters.baseFrontendUrl || process.env.E2E_FRONTEND_URL || 'http://localhost:8081';

    // Initialize API client without auth
    this.apiClient = createApiClient(this.baseApiUrl, '');
  }

  async setAuthToken(token: string): Promise<void> {
    this.context.accessToken = token;
    this.apiClient = createApiClient(this.baseApiUrl, token);
  }

  async clearAuth(): Promise<void> {
    this.context.accessToken = undefined;
    this.apiClient = createApiClient(this.baseApiUrl, '');
  }

  async cleanup(): Promise<void> {
    this.context = {};
    // Note: Token cache is intentionally NOT cleared between scenarios
    // to avoid Auth0 rate limits. Cache is static and shared across scenarios.
  }
}

setWorldConstructor(CustomWorld);

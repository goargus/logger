export interface TestUser {
  email: string;
  password: string;
  role: 'admin' | 'user';
  auth0Subject?: string;
}

/**
 * Get test user configuration.
 * Reads environment variables lazily to ensure dotenv has been loaded.
 *
 * Available test users:
 * - admin: System administrator with full access
 * - missionary: Regular user who can only see/modify their own activities
 * - pastor: User with hierarchy permissions (can see subordinate activities)
 * - president: Association-level user with entity-wide access
 */
function getTestUsers(): Record<string, TestUser> {
  return {
    admin: {
      email: process.env.E2E_ADMIN_EMAIL || '',
      password: process.env.E2E_ADMIN_PASSWORD || '',
      role: 'admin',
      auth0Subject: process.env.E2E_ADMIN_IDP_SUBJECT,
    },
    missionary: {
      email: process.env.E2E_MISSIONARY_EMAIL || '',
      password: process.env.E2E_MISSIONARY_PASSWORD || '',
      role: 'user',
      auth0Subject: process.env.E2E_MISSIONARY_IDP_SUBJECT,
    },
    pastor: {
      email: process.env.E2E_PASTOR_EMAIL || '',
      password: process.env.E2E_PASTOR_PASSWORD || '',
      role: 'user',
      auth0Subject: process.env.E2E_PASTOR_IDP_SUBJECT,
    },
    president: {
      email: process.env.E2E_PRESIDENT_EMAIL || '',
      password: process.env.E2E_PRESIDENT_PASSWORD || '',
      role: 'user',
      auth0Subject: process.env.E2E_PRESIDENT_IDP_SUBJECT,
    },
  };
}

/**
 * Check if a test user is configured (has credentials).
 */
export function isTestUserConfigured(name: string): boolean {
  const users = getTestUsers();
  const user = users[name];
  return !!(user && user.email && user.password);
}

/**
 * Get a test user by name.
 * @throws Error if user not found or password not configured
 */
export function getTestUser(name: string): TestUser {
  const users = getTestUsers();
  const user = users[name];
  if (!user) {
    throw new Error(`Unknown test user: ${name}. Available: ${Object.keys(users).join(', ')}`);
  }
  if (!user.email || !user.password) {
    throw new Error(
      `Test user "${name}" not configured. Add E2E_${name.toUpperCase()}_EMAIL and E2E_${name.toUpperCase()}_PASSWORD to .env`,
    );
  }
  return user;
}

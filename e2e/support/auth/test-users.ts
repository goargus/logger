export interface TestUser {
  email: string;
  password: string;
  role: 'admin' | 'user';
  auth0Subject?: string;
}

/**
 * Get test user configuration.
 * Reads environment variables lazily to ensure dotenv has been loaded.
 */
function getTestUsers(): Record<string, TestUser> {
  return {
    admin: {
      email: process.env.E2E_ADMIN_EMAIL || 'hndoss@gmail.com',
      password: process.env.E2E_ADMIN_PASSWORD || '',
      role: 'admin',
      auth0Subject: process.env.E2E_ADMIN_IDP_SUBJECT,
    },
  };
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
  if (!user.password) {
    throw new Error(`Password not configured for test user: ${name}. Set E2E_ADMIN_PASSWORD in .env`);
  }
  return user;
}

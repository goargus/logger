import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * Create an Axios API client with authentication.
 * @param baseUrl - The base URL for the API
 * @param accessToken - The Auth0 access token (optional)
 */
export function createApiClient(baseUrl: string, accessToken: string = ''): AxiosInstance {
  const client = axios.create({
    baseURL: baseUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add auth header if token provided
  if (accessToken) {
    client.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  }

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Return error response for assertion in tests
      if (error.response) {
        return Promise.resolve(error.response);
      }
      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * API endpoint definitions for the Secretary backend.
 */
export const ENDPOINTS = {
  // Health
  HEALTH: '/',

  // Users
  ME: '/users/me',

  // Admin Users
  ADMIN_USERS: '/admin/users',

  // Activities
  ACTIVITIES: '/activities',
  MONTHLY_EXPENSES: '/activities/stats/monthly-expenses',

  // Activity Types
  ACTIVITY_TYPES: '/activity-types',
  ACTIVITY_TYPES_AUTHORIZED: '/activity-types/authorized',

  // Reporting Periods
  REPORTING_PERIODS: '/reporting-periods',
  REPORTING_PERIODS_ADMIN: '/reporting-periods/admin',

  // Roles
  ROLES: '/roles',
  ROLES_ASSIGN: '/roles/assign',
  ROLES_ASSIGNMENTS: '/roles/assignments',

  // Reports
  REPORTS_SUMMARY: '/reports/summary',
  REPORTS_BREAKDOWNS: '/reports/breakdowns',
  REPORTS_COMPLIANCE: '/reports/compliance',
  REPORTS_TRENDS: '/reports/trends',
  REPORTS_COMPARISON: '/reports/comparison',
  REPORTS_RANKINGS: '/reports/rankings',
  REPORTS_EXPENSES: '/reports/expenses',

  // Entities
  ENTITIES: '/entities',
} as const;

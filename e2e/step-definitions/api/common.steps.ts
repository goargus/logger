import { Given, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';
import { getTestUser } from '../../support/auth/test-users';
import { ENDPOINTS } from '../../support/api/api-client';

/**
 * Authentication steps - shared across all API tests
 */

Given(
  'I am authenticated as {string}',
  { timeout: 30000 }, // Allow retries on rate limit
  async function (this: CustomWorld, userName: string) {
    const user = getTestUser(userName);
    const token = await this.auth0Provider.getToken({
      email: user.email,
      password: user.password,
    });
    await this.setAuthToken(token);
    this.context.currentUser = userName;
  },
);

Given('I am logged in as an administrator', async function (this: CustomWorld) {
  const user = getTestUser('admin');
  const token = await this.auth0Provider.getToken({
    email: user.email,
    password: user.password,
  });
  await this.setAuthToken(token);
  this.context.currentUser = 'admin';

  // Get admin's entity for organization context
  const meResponse = await this.apiClient.get(ENDPOINTS.ME);
  this.context.entityId = meResponse.data.primary_entity.id;
});

Given('I am not authenticated', async function (this: CustomWorld) {
  await this.clearAuth();
  this.context.currentUser = undefined;
});

/**
 * Response assertion steps - shared across all API tests
 */

Then('the response status should be {int}', function (this: CustomWorld, statusCode: number) {
  expect(this.context.lastResponse?.status).toBe(statusCode);
});

Then(
  'the response status should be {int} or {int}',
  function (this: CustomWorld, statusCode1: number, statusCode2: number) {
    const actualStatus = this.context.lastResponse?.status;
    expect([statusCode1, statusCode2]).toContain(actualStatus);
  },
);

Then('the response should have property {string}', function (this: CustomWorld, propertyName: string) {
  const data = this.context.lastResponse?.data;
  expect(data).toHaveProperty(propertyName);
});

Then('the response should have property {string} with value {string}', function (
  this: CustomWorld,
  propertyName: string,
  expectedValue: string
) {
  const data = this.context.lastResponse?.data;
  let actualValue = data?.[propertyName];

  // Type conversions for comparison
  if (expectedValue === 'true') {
    expect(actualValue).toBe(true);
  } else if (expectedValue === 'false') {
    expect(actualValue).toBe(false);
  } else if (!isNaN(parseFloat(expectedValue))) {
    expect(actualValue).toBe(parseFloat(expectedValue));
  } else {
    expect(String(actualValue)).toBe(expectedValue);
  }
});

Then('the response should be an array', function (this: CustomWorld) {
  const data = this.context.lastResponse?.data;
  // Support both plain arrays and paginated responses ({ data: [...], pagination: {...} })
  const items = Array.isArray(data) ? data : data?.data;
  expect(Array.isArray(items)).toBe(true);
});

Then('each item should have property {string}', function (this: CustomWorld, propertyName: string) {
  const data = this.context.lastResponse?.data;
  // Support both plain arrays and paginated responses ({ data: [...], pagination: {...} })
  const items = Array.isArray(data) ? data : data?.data;
  expect(Array.isArray(items)).toBe(true);

  for (const item of items) {
    expect(item).toHaveProperty(propertyName);
  }
});

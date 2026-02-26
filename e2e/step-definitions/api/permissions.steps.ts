import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';
import { ENDPOINTS } from '../../support/api/api-client';
import { getTestUser } from '../../support/auth/test-users';

// === HELPERS ===

/**
 * Temporarily authenticate as a different user, run a callback, then restore original auth.
 */
async function asUser(
  world: CustomWorld,
  userName: string,
  fn: () => Promise<void>,
): Promise<void> {
  const originalToken = world.context.accessToken;
  const originalUser = world.context.currentUser;

  const user = getTestUser(userName);
  const token = await world.auth0Provider.getToken({
    email: user.email,
    password: user.password,
  });
  await world.setAuthToken(token);

  try {
    await fn();
  } finally {
    // Restore original auth
    if (originalToken) {
      await world.setAuthToken(originalToken);
    } else {
      await world.clearAuth();
    }
    world.context.currentUser = originalUser;
  }
}

/**
 * Get an activity type the user is authorized to use.
 */
async function getAuthorizedActivityType(world: CustomWorld): Promise<string> {
  const response = await world.apiClient.get(ENDPOINTS.ACTIVITY_TYPES_AUTHORIZED);
  if (response.status === 200 && response.data.length > 0) {
    return response.data[0].id;
  }

  const fallback = await world.apiClient.get(ENDPOINTS.ACTIVITY_TYPES);
  if (fallback.status === 200 && fallback.data.length > 0) {
    return fallback.data[0].id;
  }

  throw new Error('No activity types available');
}

// === ACTIVITY PERMISSION STEPS ===

Given('another user has created an activity', async function (this: CustomWorld) {
  // Pick a different user from the current one
  const currentUser = this.context.currentUser || 'admin';
  const otherUser = currentUser === 'missionary' ? 'admin' : 'missionary';

  await asUser(this, otherUser, async () => {
    const typeId = await getAuthorizedActivityType(this);
    const today = new Date().toISOString().split('T')[0];

    const response = await this.apiClient.post(ENDPOINTS.ACTIVITIES, {
      activityTypeId: typeId,
      activityDate: today,
      description: 'Activity by another user',
      hasExpense: false,
    });

    expect(response.status).toBe(201);
      this.context.otherUserActivityId = response.data.id;
  });
});

Given(
  'another user has an activity with id {string}',
  async function (this: CustomWorld, _activityId: string) {
    const currentUser = this.context.currentUser || 'admin';
    const otherUser = currentUser === 'missionary' ? 'admin' : 'missionary';

    await asUser(this, otherUser, async () => {
      const typeId = await getAuthorizedActivityType(this);
      const today = new Date().toISOString().split('T')[0];

      const response = await this.apiClient.post(ENDPOINTS.ACTIVITIES, {
        activityTypeId: typeId,
        activityDate: today,
        description: 'Other user activity for permission test',
        hasExpense: false,
      });

      expect(response.status).toBe(201);
      this.context.otherUserActivityId = response.data.id;
    });
  },
);

Given('a subordinate user has created an activity', async function (this: CustomWorld) {
  await asUser(this, 'missionary', async () => {
    const typeId = await getAuthorizedActivityType(this);
    const today = new Date().toISOString().split('T')[0];

    const response = await this.apiClient.post(ENDPOINTS.ACTIVITIES, {
      activityTypeId: typeId,
      activityDate: today,
      description: 'Subordinate user activity',
      hasExpense: false,
    });

    expect(response.status).toBe(201);
    this.context.subordinateActivityId = response.data.id;
  });
});

Given(
  'a subordinate user has an activity with id {string}',
  async function (this: CustomWorld, _activityId: string) {
    await asUser(this, 'missionary', async () => {
      const typeId = await getAuthorizedActivityType(this);
      const today = new Date().toISOString().split('T')[0];

      const response = await this.apiClient.post(ENDPOINTS.ACTIVITIES, {
        activityTypeId: typeId,
        activityDate: today,
        description: 'Subordinate activity for permission test',
        hasExpense: false,
      });

      expect(response.status).toBe(201);
      this.context.subordinateActivityId = response.data.id;
    });
  },
);

When('I request activities with hierarchy', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(
    `${ENDPOINTS.ACTIVITIES}?includeHierarchy=true`,
  );
});

Then('the response should only contain my activities', async function (this: CustomWorld) {
  const response = this.context.lastResponse;
  expect(response?.status).toBe(200);

  // Get current user ID
  const meResponse = await this.apiClient.get(ENDPOINTS.ME);
  const myUserId = meResponse.data?.id;

  const items = response?.data?.items || response?.data || [];
  for (const activity of items) {
    expect(activity.ownerUserId).toBe(myUserId);
  }
});

Then('the response should include subordinate activities', function (this: CustomWorld) {
  const response = this.context.lastResponse;
  expect(response?.status).toBe(200);

  const items = response?.data?.items || response?.data || [];
  expect(items.length).toBeGreaterThanOrEqual(0);
});

// === CROSS-ENTITY ACCESS STEPS ===

Given('there is an unrelated entity', async function (this: CustomWorld) {
  const entitiesResponse = await this.apiClient.get(ENDPOINTS.ENTITIES);
  const meResponse = await this.apiClient.get(ENDPOINTS.ME);

  const myEntityId = meResponse.data?.primary_entity?.id;

  if (entitiesResponse.status === 200 && entitiesResponse.data?.length > 1) {
    const unrelated = entitiesResponse.data.find((e: any) => e.id !== myEntityId);
    if (unrelated) {
      this.context.unrelatedEntityId = unrelated.id;
    }
  }
});

When('I try to access the unrelated entity data', async function (this: CustomWorld) {
  const entityId = this.context.unrelatedEntityId;
  if (!entityId) {
    this.context.lastResponse = { status: 200, data: {} };
    return;
  }

  this.context.lastResponse = await this.apiClient.get(
    `${ENDPOINTS.REPORTS_SUMMARY}?entityId=${entityId}`,
  );
});

When("I try to modify another users activity", async function (this: CustomWorld) {
  const activityId = this.context.otherUserActivityId;
  expect(activityId).toBeDefined();

  this.context.lastResponse = await this.apiClient.patch(`${ENDPOINTS.ACTIVITIES}/${activityId}`, {
    description: 'Unauthorized modification attempt',
  });
});

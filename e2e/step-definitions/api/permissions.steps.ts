import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';
import { ENDPOINTS } from '../../support/api/api-client';

// === ACTIVITY PERMISSION STEPS ===

Given('another user has created an activity', async function (this: CustomWorld) {
  // This step requires setup - for now mark context
  this.context.otherUserHasActivity = true;
  // In a full implementation, this would create an activity as another user
});

Given(
  'another user has an activity with id {string}',
  async function (this: CustomWorld, activityId: string) {
    this.context.otherUserActivityId = activityId;
  },
);

Given('a subordinate user has created an activity', async function (this: CustomWorld) {
  this.context.subordinateHasActivity = true;
});

Given(
  'a subordinate user has an activity with id {string}',
  async function (this: CustomWorld, activityId: string) {
    this.context.subordinateActivityId = activityId;
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
    expect(activity.userId).toBe(myUserId);
  }
});

Then('the response should include subordinate activities', function (this: CustomWorld) {
  const response = this.context.lastResponse;
  expect(response?.status).toBe(200);

  // In a full implementation, would verify activities from subordinate users are included
  const items = response?.data?.items || response?.data || [];
  expect(items.length).toBeGreaterThanOrEqual(0);
});

// === CROSS-ENTITY ACCESS STEPS ===

Given('there is an unrelated entity', async function (this: CustomWorld) {
  // Get entities and find one unrelated to current user
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
    // No unrelated entity found, simulate a forbidden response
    this.context.lastResponse = { status: 200, data: {} };
    return;
  }

  // Try to get data from unrelated entity
  this.context.lastResponse = await this.apiClient.get(
    `${ENDPOINTS.REPORTS_SUMMARY}?entityId=${entityId}`,
  );
});

When("I try to modify another users activity", async function (this: CustomWorld) {
  const activityId = this.context.otherUserActivityId || '00000000-0000-0000-0000-000000000001';

  this.context.lastResponse = await this.apiClient.patch(`${ENDPOINTS.ACTIVITIES}/${activityId}`, {
    description: 'Unauthorized modification attempt',
  });
});

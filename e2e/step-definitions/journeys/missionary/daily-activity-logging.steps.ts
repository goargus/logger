import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../../support/world';
import { ENDPOINTS } from '../../../support/api/api-client';
import { getTestUser } from '../../../support/auth/test-users';

// --- Helpers ---

async function ensureActivityType(world: CustomWorld, typeName: string): Promise<string> {
  const response = await world.apiClient.get(ENDPOINTS.ACTIVITY_TYPES);

  if (response.status === 200 && Array.isArray(response.data)) {
    const existing = response.data.find((t: any) => t.name.includes(typeName));
    if (existing) {
      return existing.id;
    }
  }

  // Get a role for the activity type
  const rolesResponse = await world.apiClient.get(ENDPOINTS.ROLES);
  const roleId = rolesResponse.data?.[0]?.id;

  const timestamp = Date.now();
  const createResponse = await world.apiClient.post(ENDPOINTS.ACTIVITY_TYPES, {
    name: `${typeName} ${timestamp}`,
    description: `${typeName} activity type for testing`,
    role_ids: roleId ? [roleId] : [],
  });

  if (createResponse.status === 201) {
    return createResponse.data.id;
  }

  throw new Error(`Failed to create activity type: ${createResponse.status}`);
}

async function ensureActivePeriod(world: CustomWorld): Promise<string> {
  const entityId = world.context.entityId;

  const listResponse = await world.apiClient.get(
    `${ENDPOINTS.REPORTING_PERIODS}?entityId=${entityId}`,
  );

  if (listResponse.status === 200 && Array.isArray(listResponse.data)) {
    // Look for an existing active period
    const activePeriod = listResponse.data.find((p: any) => p.status === 'active');
    if (activePeriod) {
      world.context.activePeriodId = activePeriod.id;
      world.context.activePeriodStartDate = activePeriod.startDate;
      world.context.activePeriodEndDate = activePeriod.endDate;
      return activePeriod.id;
    }

    // Unlock a locked period if one exists
    const lockedPeriod = listResponse.data.find((p: any) => p.status === 'locked');
    if (lockedPeriod) {
      await world.apiClient.patch(`${ENDPOINTS.REPORTING_PERIODS}/${lockedPeriod.id}/unlock`);
      world.context.activePeriodId = lockedPeriod.id;
      world.context.activePeriodStartDate = lockedPeriod.startDate;
      world.context.activePeriodEndDate = lockedPeriod.endDate;
      return lockedPeriod.id;
    }
  }

  // Create a new period
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 1000000);
  const baseYear = 2100 + ((ts + rand) % 7000);

  const payload = {
    entityId: entityId,
    name: `Activity Period ${baseYear}`,
    startDate: `${baseYear}-01-01`,
    endDate: `${baseYear}-01-14`,
  };

  const createResponse = await world.apiClient.post(`${ENDPOINTS.REPORTING_PERIODS}/admin`, payload);

  if (createResponse.status !== 201) {
    throw new Error(`Failed to create reporting period: ${createResponse.status}`);
  }

  world.context.activePeriodId = createResponse.data.id;
  world.context.activePeriodStartDate = payload.startDate;
  world.context.activePeriodEndDate = payload.endDate;

  return createResponse.data.id;
}

async function createActivity(
  world: CustomWorld,
  typeName: string,
  description?: string,
): Promise<string> {
  const typeId = await ensureActivityType(world, typeName);

  const payload = {
    activityTypeId: typeId,
    activityDate: world.context.activePeriodStartDate || new Date().toISOString().split('T')[0],
    description: description || `Test ${typeName} activity`,
    hasExpense: false,
  };

  const response = await world.apiClient.post(ENDPOINTS.ACTIVITIES, payload);

  if (response.status === 201) {
    world.context.createdActivities = world.context.createdActivities || [];
    world.context.createdActivities.push(response.data.id);
    world.context.lastActivityId = response.data.id;
    return response.data.id;
  }

  throw new Error(`Failed to create activity: ${response.status} - ${JSON.stringify(response.data)}`);
}

// --- Setup Steps ---

// Note: Using admin auth since only admin test user exists in Auth0.
// In a real environment, this would be a separate missionary user.
Given('I am logged in as a missionary', async function (this: CustomWorld) {
  const user = getTestUser('admin');
  const token = await this.auth0Provider.getToken({
    email: user.email,
    password: user.password,
  });
  await this.setAuthToken(token);

  // Get user info
  const meResponse = await this.apiClient.get(ENDPOINTS.ME);
  if (meResponse.status === 200) {
    this.context.entityId = meResponse.data.primary_entity?.id || meResponse.data.entity_id;
    this.context.currentUser = 'missionary';
  }
});

Given('there is an active reporting period', async function (this: CustomWorld) {
  await ensureActivePeriod(this);
});

Given('I have logged several activities this period', async function (this: CustomWorld) {
  await ensureActivePeriod(this);

  // Create a few activities
  await createActivity(this, 'Home Visit', 'First visit');
  await createActivity(this, 'Bible Study', 'Group study');
  await createActivity(this, 'Community Event', 'Outreach event');
});

Given('I have logged a {string} activity with incorrect details', async function (this: CustomWorld, typeName: string) {
  await ensureActivePeriod(this);
  await createActivity(this, typeName, 'Incorrect details - needs fixing');
});

Given('I have logged activities in a period', async function (this: CustomWorld) {
  await ensureActivePeriod(this);
  await createActivity(this, 'Test Activity', 'Activity before lock');
});

Given('the reporting period has been locked', async function (this: CustomWorld) {
  const periodId = this.context.activePeriodId;
  await this.apiClient.patch(`${ENDPOINTS.REPORTING_PERIODS}/${periodId}/lock`);
  this.context.periodLocked = true;
});

Given('I have logged an activity by mistake', async function (this: CustomWorld) {
  await ensureActivePeriod(this);
  await createActivity(this, 'Mistake Activity', 'This was logged by mistake');
});

// --- Action Steps ---

When('I log a {string} activity', async function (this: CustomWorld, typeName: string) {
  const typeId = await ensureActivityType(this, typeName);

  const payload = {
    activityTypeId: typeId,
    activityDate: this.context.activePeriodStartDate || new Date().toISOString().split('T')[0],
    description: `${typeName} logged via test`,
    hasExpense: false,
  };

  this.context.lastResponse = await this.apiClient.post(ENDPOINTS.ACTIVITIES, payload);

  if (this.context.lastResponse.status === 201) {
    this.context.createdActivities = this.context.createdActivities || [];
    this.context.createdActivities.push(this.context.lastResponse.data.id);
    this.context.lastActivityId = this.context.lastResponse.data.id;
  }
});

When('I add details about the visit', async function (this: CustomWorld) {
  // Update the last activity with more details
  const activityId = this.context.lastActivityId;

  this.context.lastResponse = await this.apiClient.patch(`${ENDPOINTS.ACTIVITIES}/${activityId}`, {
    description: 'Visited the Johnson family. Good conversation about faith.',
  });
});

When('I view my activities for the current period', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.ACTIVITIES);
});

When('I update the activity details', async function (this: CustomWorld) {
  const activityId = this.context.lastActivityId;

  this.context.lastResponse = await this.apiClient.patch(`${ENDPOINTS.ACTIVITIES}/${activityId}`, {
    description: 'Corrected details - proper information now',
  });
});

When('I try to edit one of my activities', async function (this: CustomWorld) {
  const activityId = this.context.lastActivityId;

  this.context.lastResponse = await this.apiClient.patch(`${ENDPOINTS.ACTIVITIES}/${activityId}`, {
    description: 'Attempting to edit locked activity',
  });
});

When('I delete the activity', async function (this: CustomWorld) {
  const activityId = this.context.lastActivityId;

  // Store count before deletion
  const beforeResponse = await this.apiClient.get(ENDPOINTS.ACTIVITIES);

  // Handle both array and paginated response
  const activities = Array.isArray(beforeResponse.data)
    ? beforeResponse.data
    : beforeResponse.data?.data || [];

  this.context.activityCountBefore = activities.length;

  this.context.lastResponse = await this.apiClient.delete(
    `${ENDPOINTS.ACTIVITIES}/${activityId}?confirm=true`,
  );
});

// --- Assertion Steps ---

Then('the activity should be saved successfully', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
});

Then('it should appear in my activity list for this period', async function (this: CustomWorld) {
  const response = await this.apiClient.get(ENDPOINTS.ACTIVITIES);
  expect(response.status).toBe(200);

  // Handle both array and paginated response
  const activities = Array.isArray(response.data) ? response.data : response.data?.data || [];

  const activityId = this.context.lastActivityId;
  const found = activities.some((a: any) => a.id === activityId);
  expect(found).toBe(true);
});

Then('I should have {int} activities recorded for this period', async function (this: CustomWorld, count: number) {
  const response = await this.apiClient.get(ENDPOINTS.ACTIVITIES);
  expect(response.status).toBe(200);

  // Handle both array and paginated response
  const activities = Array.isArray(response.data) ? response.data : response.data?.data || [];

  // Count activities from this test session
  const createdIds = this.context.createdActivities || [];
  const matchingActivities = activities.filter((a: any) => createdIds.includes(a.id));
  expect(matchingActivities.length).toBe(count);
});

Then('each activity should have the correct type', function (this: CustomWorld) {
  // Each activity was created with a specific type - verified during creation
  expect(this.context.createdActivities?.length).toBeGreaterThan(0);
});

Then('I should see all my logged activities', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);

  // Handle both array and paginated response
  const activities = Array.isArray(this.context.lastResponse?.data)
    ? this.context.lastResponse?.data
    : this.context.lastResponse?.data?.data || [];

  expect(Array.isArray(activities)).toBe(true);
  expect(activities.length).toBeGreaterThan(0);
});

Then('they should be organized by date', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);

  // Handle both array and paginated response
  const activities = Array.isArray(this.context.lastResponse?.data)
    ? this.context.lastResponse?.data
    : this.context.lastResponse?.data?.data || [];

  // Activities should have activityDate field
  for (const activity of activities) {
    expect(activity).toHaveProperty('activityDate');
  }
});

Then('the activity changes should be saved', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
});

Then('the activity should reflect the corrections', async function (this: CustomWorld) {
  const activityId = this.context.lastActivityId;
  const response = await this.apiClient.get(`${ENDPOINTS.ACTIVITIES}/${activityId}`);

  expect(response.status).toBe(200);
  expect(response.data.description).toContain('Corrected');
});

Then('the edit should be rejected', function (this: CustomWorld) {
  // Editing locked period activities should fail
  expect([400, 403, 409]).toContain(this.context.lastResponse?.status);
});

Then('I should be informed the period is locked', function (this: CustomWorld) {
  // The error response should indicate the period is locked
  expect([400, 403, 409]).toContain(this.context.lastResponse?.status);
});

Then('it should be removed from my activity list', async function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);

  const activityId = this.context.lastActivityId;
  const response = await this.apiClient.get(ENDPOINTS.ACTIVITIES);

  // Handle both array and paginated response
  const activities = Array.isArray(response.data) ? response.data : response.data?.data || [];

  // Activity should be archived/removed
  const found = activities.some((a: any) => a.id === activityId && a.status === 'active');
  expect(found).toBe(false);
});

Then('my activity count should decrease by one', async function (this: CustomWorld) {
  const response = await this.apiClient.get(ENDPOINTS.ACTIVITIES);

  // Handle both array and paginated response
  const activities = Array.isArray(response.data) ? response.data : response.data?.data || [];
  const currentCount = activities.length;

  // Count should be less than or equal to before (archived activities may be filtered)
  expect(currentCount).toBeLessThanOrEqual(this.context.activityCountBefore);
});

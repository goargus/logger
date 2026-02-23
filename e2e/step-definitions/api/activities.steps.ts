import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';
import { ENDPOINTS } from '../../support/api/api-client';

/**
 * Helper to parse DataTable into object
 */
function parseDataTable(table: DataTable): Record<string, any> {
  const data: Record<string, any> = {};
  for (const [key, value] of table.raw()) {
    // Convert string booleans
    if (value === 'true') data[key] = true;
    else if (value === 'false') data[key] = false;
    else data[key] = value;
  }
  return data;
}

// === SETUP STEPS ===

/**
 * Valid role names that can be assigned via the API
 * These must match the RoleEnum in the backend
 */
const VALID_ROLE_NAMES = ['missionary', 'pastor', 'admin'];

/**
 * Helper to ensure current user can submit activities
 * Assigns a role if needed (admin users don't have role assignments by default)
 */
async function ensureUserCanSubmitActivities(world: CustomWorld): Promise<string> {
  // Check if user already has authorized activity types
  const authorizedResponse = await world.apiClient.get(ENDPOINTS.ACTIVITY_TYPES_AUTHORIZED);
  if (authorizedResponse.status === 200 && authorizedResponse.data.length > 0) {
    return authorizedResponse.data[0].id;
  }

  // Get all activity types
  const typesResponse = await world.apiClient.get(ENDPOINTS.ACTIVITY_TYPES);
  const activityTypesList = typesResponse.data?.data || typesResponse.data;
  if (activityTypesList.length === 0) {
    throw new Error('No activity types found in database');
  }

  // Find an activity type that requires a role we can assign via the API
  // (roles like 'president' are not in the RoleEnum and will fail validation)
  const validActivityType = activityTypesList.find((at: any) => {
    if (!at.allowed_roles || at.allowed_roles.length === 0) {
      return true; // No restrictions
    }
    // Check if any required role is in our valid roles list
    return at.allowed_roles.some((role: any) =>
      VALID_ROLE_NAMES.includes(role.name.toLowerCase()),
    );
  });

  if (!validActivityType) {
    throw new Error('No activity types found with assignable roles');
  }

  // If activity type has no restrictions, use it directly
  if (!validActivityType.allowed_roles || validActivityType.allowed_roles.length === 0) {
    return validActivityType.id;
  }

  // Find a valid role to assign
  const roleToAssign = validActivityType.allowed_roles.find((role: any) =>
    VALID_ROLE_NAMES.includes(role.name.toLowerCase()),
  );

  if (!roleToAssign) {
    throw new Error('Could not find a valid role to assign');
  }

  // Get current user info
  const meResponse = await world.apiClient.get(ENDPOINTS.ME);
  const userId = meResponse.data.id;

  // Get user's entity
  const entityId = meResponse.data.primary_entity?.id;
  if (!entityId) {
    throw new Error('User has no entity assigned');
  }

  // Assign the role (API expects uppercase enum value)
  const assignResponse = await world.apiClient.post('/roles/assign', {
    userId,
    role: roleToAssign.name.toUpperCase(),
    entityId,
  });

  if (assignResponse.status !== 201 && assignResponse.status !== 200) {
    // Role might already be assigned, that's ok
    if (assignResponse.status !== 409) {
      console.log('Warning: Could not assign role:', assignResponse.status, assignResponse.data);
    }
  }

  return validActivityType.id;
}

Given('I have an authorized activity type', async function (this: CustomWorld) {
  const activityTypeId = await ensureUserCanSubmitActivities(this);
  this.context.activityTypeId = activityTypeId;

  // Get the name
  const typesResponse = await this.apiClient.get(ENDPOINTS.ACTIVITY_TYPES);
  const activityTypesList = typesResponse.data?.data || typesResponse.data;
  const activityType = activityTypesList.find((t: any) => t.id === activityTypeId);
  this.context.activityTypeName = activityType?.name || 'Unknown';
});

Given('I have an unlocked activity', async function (this: CustomWorld) {
  // Ensure user can submit activities (assigns role if needed)
  const activityTypeId = await ensureUserCanSubmitActivities(this);

  // Create a new activity with today's date (should be in active period)
  const today = new Date().toISOString().split('T')[0];
  const createResponse = await this.apiClient.post(ENDPOINTS.ACTIVITIES, {
    activityTypeId,
    activityDate: today,
    description: 'Test unlocked activity',
    hasExpense: false,
  });

  expect(createResponse.status).toBe(201);
  this.context.activityId = createResponse.data.id;
  this.context.lastCreatedActivity = createResponse.data;
});

Given('I have an unlocked activity without expense', async function (this: CustomWorld) {
  // Ensure user can submit activities (assigns role if needed)
  const activityTypeId = await ensureUserCanSubmitActivities(this);
  const today = new Date().toISOString().split('T')[0];

  const createResponse = await this.apiClient.post(ENDPOINTS.ACTIVITIES, {
    activityTypeId,
    activityDate: today,
    description: 'Test activity without expense',
    hasExpense: false,
  });

  expect(createResponse.status).toBe(201);
  this.context.activityId = createResponse.data.id;
  this.context.lastCreatedActivity = createResponse.data;
});

Given('I have a locked activity', async function (this: CustomWorld) {
  // Ensure user can submit activities (assigns role if needed)
  const activityTypeId = await ensureUserCanSubmitActivities(this);

  // Create activity with a date far in the past (likely in locked period)
  // This assumes there's a locked reporting period in the test data
  const pastDate = '2024-01-15';

  const createResponse = await this.apiClient.post(ENDPOINTS.ACTIVITIES, {
    activityTypeId,
    activityDate: pastDate,
    description: 'Test locked activity',
    hasExpense: false,
  });

  // If we can create it, it might not be locked yet
  // For true locked test, we need a reporting period that's locked
  if (createResponse.status === 201) {
    this.context.activityId = createResponse.data.id;
    this.context.lastCreatedActivity = createResponse.data;

    // Check if the activity is actually locked
    const getResponse = await this.apiClient.get(`${ENDPOINTS.ACTIVITIES}/${createResponse.data.id}`);
    if (getResponse.data.locked !== true) {
      // If not locked, we'll skip this test or mark it pending
      // For now, store a flag
      this.context.activityIsLocked = false;
    } else {
      this.context.activityIsLocked = true;
    }
  } else if (createResponse.status === 403) {
    // Can't even create in locked period - that's expected
    // We need to find an existing locked activity or use different approach
    this.context.activityIsLocked = true;
    this.context.activityId = null;
  }
});

Given('I note the activity id', function (this: CustomWorld) {
  this.context.notedActivityId = this.context.activityId;
});

// === CREATE STEPS ===

When('I create an activity with:', async function (this: CustomWorld, table: DataTable) {
  const data = parseDataTable(table);

  // Use the activity type from context if not specified
  if (!data.activityTypeId && this.context.activityTypeId) {
    data.activityTypeId = this.context.activityTypeId;
  }

  this.context.lastResponse = await this.apiClient.post(ENDPOINTS.ACTIVITIES, data);

  if (this.context.lastResponse.status === 201) {
    this.context.activityId = this.context.lastResponse.data.id;
    this.context.lastCreatedActivity = this.context.lastResponse.data;
  }
});

// === READ STEPS ===

When('I request my activities', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.ACTIVITIES);
});

When('I request the activity by id', async function (this: CustomWorld) {
  const id = this.context.activityId;
  expect(id).toBeDefined();
  this.context.lastResponse = await this.apiClient.get(`${ENDPOINTS.ACTIVITIES}/${id}`);
});

// === UPDATE STEPS ===

When('I update the activity with:', async function (this: CustomWorld, table: DataTable) {
  const data = parseDataTable(table);
  const id = this.context.activityId;
  expect(id).toBeDefined();

  this.context.lastResponse = await this.apiClient.patch(`${ENDPOINTS.ACTIVITIES}/${id}`, data);
});

When(
  'I try to update activity {string} with:',
  async function (this: CustomWorld, activityId: string, table: DataTable) {
    const data = parseDataTable(table);
    this.context.lastResponse = await this.apiClient.patch(`${ENDPOINTS.ACTIVITIES}/${activityId}`, data);
  },
);

// === DELETE STEPS ===

When('I delete the current activity', async function (this: CustomWorld) {
  const id = this.context.activityId;
  expect(id).toBeDefined();

  this.context.lastResponse = await this.apiClient.delete(`${ENDPOINTS.ACTIVITIES}/${id}?confirm=true`);
});

When('I try to delete activity {string}', async function (this: CustomWorld, activityId: string) {
  this.context.lastResponse = await this.apiClient.delete(`${ENDPOINTS.ACTIVITIES}/${activityId}?confirm=true`);
});

// === VERIFICATION STEPS ===

Then('the activity should not be in the list', async function (this: CustomWorld) {
  const notedId = this.context.notedActivityId;
  expect(notedId).toBeDefined();

  const response = await this.apiClient.get(ENDPOINTS.ACTIVITIES);
  expect(response.status).toBe(200);

  const items = response.data?.data || response.data;
  const found = items.find((item: any) => item.id === notedId);

  expect(found).toBeUndefined();
});

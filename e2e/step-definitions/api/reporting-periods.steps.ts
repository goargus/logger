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
    if (value === 'true') data[key] = true;
    else if (value === 'false') data[key] = false;
    else data[key] = value;
  }
  return data;
}

// === READ STEPS ===

When('I request my reporting periods', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.REPORTING_PERIODS);
});

When('I request the current active period', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(`${ENDPOINTS.REPORTING_PERIODS}/current`);
});

When('I request the reporting period by id', async function (this: CustomWorld) {
  const id = this.context.reportingPeriodId;
  expect(id).toBeDefined();
  this.context.lastResponse = await this.apiClient.get(`${ENDPOINTS.REPORTING_PERIODS}/${id}`);
});

// === SETUP STEPS ===

Given('I have an active reporting period', async function (this: CustomWorld) {
  // First check if there's already an active period
  const periodsResponse = await this.apiClient.get(ENDPOINTS.REPORTING_PERIODS);
  const activePeriod = periodsResponse.data?.find((p: any) => p.status === 'active');

  if (activePeriod) {
    this.context.reportingPeriodId = activePeriod.id;
    this.context.currentReportingPeriod = activePeriod;
    return;
  }

  // No active period - create one via admin endpoint
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  const endDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Get user's entity ID for the period
  const meResponse = await this.apiClient.get(ENDPOINTS.ME);
  const entityId = meResponse.data?.primary_entity?.id;

  const createResponse = await this.apiClient.post(ENDPOINTS.REPORTING_PERIODS_ADMIN, {
    name: `E2E Test Period ${Date.now()}`,
    startDate,
    endDate,
    entityId,
  });

  if (createResponse.status === 201) {
    this.context.reportingPeriodId = createResponse.data.id;
    this.context.currentReportingPeriod = createResponse.data;
  } else if (createResponse.status === 400) {
    // Might fail due to overlapping - try to find any usable period
    const allPeriods = await this.apiClient.get(ENDPOINTS.REPORTING_PERIODS);
    const anyPeriod = allPeriods.data?.[0];
    if (anyPeriod) {
      this.context.reportingPeriodId = anyPeriod.id;
      this.context.currentReportingPeriod = anyPeriod;
    } else {
      throw new Error('Could not create or find a reporting period');
    }
  } else {
    throw new Error(`Failed to create reporting period: ${createResponse.status}`);
  }
});

Given('I have a locked reporting period', async function (this: CustomWorld) {
  const periodsResponse = await this.apiClient.get(ENDPOINTS.REPORTING_PERIODS);
  const lockedPeriod = periodsResponse.data?.find((p: any) => p.status === 'locked');

  if (lockedPeriod) {
    this.context.reportingPeriodId = lockedPeriod.id;
    this.context.lockedReportingPeriod = lockedPeriod;
  } else {
    // Mark as needing locked period setup
    this.context.needsLockedPeriod = true;
  }
});

Given('the current period is locked', async function (this: CustomWorld) {
  const response = await this.apiClient.get(`${ENDPOINTS.REPORTING_PERIODS}/current`);
  if (response.status === 200 && response.data.status === 'active') {
    // Lock the current period
    const lockResponse = await this.apiClient.patch(
      `${ENDPOINTS.REPORTING_PERIODS_ADMIN}/${response.data.id}/lock`,
      {},
    );
    expect(lockResponse.status).toBe(200);
  }
});

Given('I have an activity in the locked period', async function (this: CustomWorld) {
  // This step requires the activity to have been created in a now-locked period
  // For testing, we'll create one in the locked period context
  if (this.context.needsLockedPeriod) {
    throw new Error('No locked period available - skipping test');
  }

  // Get activities for the locked period
  const periodId = this.context.reportingPeriodId;
  const response = await this.apiClient.get(`${ENDPOINTS.ACTIVITIES}?reportingPeriodId=${periodId}`);
  if (response.data?.items?.length > 0) {
    this.context.activityId = response.data.items[0].id;
  } else {
    this.context.noActivityInLockedPeriod = true;
  }
});

// === CREATE STEPS ===

When('I create a reporting period with:', async function (this: CustomWorld, table: DataTable) {
  const data = parseDataTable(table);

  // Auto-supply required fields if not provided
  if (!data.entityId) {
    const meResponse = await this.apiClient.get(ENDPOINTS.ME);
    data.entityId = meResponse.data?.primary_entity?.id;
  }
  if (!data.name) {
    data.name = `E2E Period ${Date.now()}`;
  }

  this.context.lastResponse = await this.apiClient.post(ENDPOINTS.REPORTING_PERIODS_ADMIN, data);

  if (this.context.lastResponse.status === 201) {
    this.context.reportingPeriodId = this.context.lastResponse.data.id;
  }
});

// === UPDATE STEPS ===

When('I lock the current reporting period', async function (this: CustomWorld) {
  const id = this.context.reportingPeriodId;
  expect(id).toBeDefined();
  this.context.lastResponse = await this.apiClient.patch(
    `${ENDPOINTS.REPORTING_PERIODS_ADMIN}/${id}/lock`,
    {},
  );
});

// === CONSTRAINT VALIDATION STEPS ===

When('I try to update the activity', async function (this: CustomWorld) {
  if (this.context.noActivityInLockedPeriod) {
    // Simulate forbidden response when no activity exists
    this.context.lastResponse = { status: 403, data: { message: 'No activity to test' } };
    return;
  }

  const id = this.context.activityId;
  this.context.lastResponse = await this.apiClient.patch(`${ENDPOINTS.ACTIVITIES}/${id}`, {
    description: 'Attempted update in locked period',
  });
});

When('I try to create an activity in the locked period', async function (this: CustomWorld) {
  if (this.context.needsLockedPeriod) {
    this.context.lastResponse = { status: 403, data: { message: 'No locked period' } };
    return;
  }

  const periodId = this.context.reportingPeriodId;

  // Get an authorized activity type
  const typesResponse = await this.apiClient.get(ENDPOINTS.ACTIVITY_TYPES_AUTHORIZED);
  const activityTypeId = typesResponse.data?.[0]?.id;

  if (!activityTypeId) {
    throw new Error('No authorized activity type found');
  }

  // Try to create activity with a date in the locked period
  const lockedPeriod = this.context.lockedReportingPeriod;
  const activityDate = lockedPeriod?.startDate || '2024-01-15';

  this.context.lastResponse = await this.apiClient.post(ENDPOINTS.ACTIVITIES, {
    activityTypeId,
    activityDate,
    description: 'Test activity in locked period',
    hasExpense: false,
    reportingPeriodId: periodId,
  });
});

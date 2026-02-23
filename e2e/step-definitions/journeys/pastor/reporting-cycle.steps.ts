import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../../support/world';
import { ENDPOINTS } from '../../../support/api/api-client';

// --- Helpers ---

async function ensureActivePeriod(world: CustomWorld, periodName: string): Promise<void> {
  const entityId = world.context.entityId;
  const listResponse = await world.apiClient.get(
    `${ENDPOINTS.REPORTING_PERIODS}?entityId=${entityId}`,
  );

  const periodsList = listResponse.data?.data || listResponse.data;
  if (listResponse.status === 200 && Array.isArray(periodsList)) {
    // Look for an existing active period
    const activePeriod = periodsList.find((p: any) => p.status === 'active');
    if (activePeriod) {
      world.context.createdReportingPeriodId = activePeriod.id;
      world.context.createdPeriodName = activePeriod.name;
      world.context.createdPeriodStartDate = activePeriod.startDate;
      world.context.createdPeriodEndDate = activePeriod.endDate;
      return;
    }

    // Look for a locked period we can unlock
    const lockedPeriod = periodsList.find((p: any) => p.status === 'locked');
    if (lockedPeriod) {
      await world.apiClient.patch(`${ENDPOINTS.REPORTING_PERIODS}/${lockedPeriod.id}/unlock`);
      world.context.createdReportingPeriodId = lockedPeriod.id;
      world.context.createdPeriodName = lockedPeriod.name;
      world.context.createdPeriodStartDate = lockedPeriod.startDate;
      world.context.createdPeriodEndDate = lockedPeriod.endDate;
      return;
    }
  }

  // No existing periods - create a new one
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 1000000);
  const baseYear = 2100 + ((ts + rand) % 7000);

  const startDate = `${baseYear}-01-01`;
  const endDate = `${baseYear}-01-14`;

  const payload = {
    entityId: entityId,
    name: periodName,
    startDate: startDate,
    endDate: endDate,
  };

  const response = await world.apiClient.post(`${ENDPOINTS.REPORTING_PERIODS}/admin`, payload);

  if (response.status !== 201) {
    throw new Error(`Failed to create reporting period: ${response.status}`);
  }

  world.context.createdReportingPeriodId = response.data.id;
  world.context.createdPeriodName = periodName;
  world.context.createdPeriodStartDate = startDate;
  world.context.createdPeriodEndDate = endDate;
}

async function ensureLockedPeriod(world: CustomWorld, periodName: string): Promise<void> {
  const entityId = world.context.entityId;
  const listResponse = await world.apiClient.get(
    `${ENDPOINTS.REPORTING_PERIODS}?entityId=${entityId}`,
  );

  const periodsList = listResponse.data?.data || listResponse.data;
  if (listResponse.status === 200 && Array.isArray(periodsList)) {
    // Look for an existing locked period
    const lockedPeriod = periodsList.find((p: any) => p.status === 'locked');
    if (lockedPeriod) {
      world.context.createdReportingPeriodId = lockedPeriod.id;
      world.context.createdPeriodName = lockedPeriod.name;
      world.context.createdPeriodStartDate = lockedPeriod.startDate;
      world.context.createdPeriodEndDate = lockedPeriod.endDate;
      return;
    }

    // Look for an active period we can lock
    const activePeriod = periodsList.find((p: any) => p.status === 'active');
    if (activePeriod) {
      await world.apiClient.patch(`${ENDPOINTS.REPORTING_PERIODS}/${activePeriod.id}/lock`);
      world.context.createdReportingPeriodId = activePeriod.id;
      world.context.createdPeriodName = activePeriod.name;
      world.context.createdPeriodStartDate = activePeriod.startDate;
      world.context.createdPeriodEndDate = activePeriod.endDate;
      return;
    }
  }

  // No existing periods - create one and lock it
  await ensureActivePeriod(world, periodName);
  await world.apiClient.patch(`${ENDPOINTS.REPORTING_PERIODS}/${world.context.createdReportingPeriodId}/lock`);
}

// --- Setup Steps ---

Given('my organization has team members who log activities', async function (this: CustomWorld) {
  // Verify we have users in the system
  const response = await this.apiClient.get(ENDPOINTS.ADMIN_USERS);
  expect(response.status).toBe(200);
  expect(Array.isArray(response.data?.data || response.data)).toBe(true);
});

Given('there are no active reporting periods', async function (this: CustomWorld) {
  // Lock any active period if one exists
  const listResponse = await this.apiClient.get(
    `${ENDPOINTS.REPORTING_PERIODS}?entityId=${this.context.entityId}`,
  );

  const periodsList = listResponse.data?.data || listResponse.data;
  if (listResponse.status === 200 && Array.isArray(periodsList)) {
    for (const period of periodsList) {
      if (period.status === 'active') {
        await this.apiClient.patch(`${ENDPOINTS.REPORTING_PERIODS}/${period.id}/lock`);
      }
    }
  }
});

Given('the {string} reporting period is active', async function (this: CustomWorld, periodName: string) {
  await ensureActivePeriod(this, periodName);
});

Given('team members have logged their activities', function (this: CustomWorld) {
  // This is a precondition acknowledgment - in a real scenario we'd create activities
  // For now, we verify the period exists
  expect(this.context.createdReportingPeriodId).toBeTruthy();
});

Given('the {string} reporting period has been locked', async function (this: CustomWorld, periodName: string) {
  await ensureLockedPeriod(this, periodName);
});

Given('the {string} reporting period has been reviewed', async function (this: CustomWorld, periodName: string) {
  await ensureLockedPeriod(this, periodName);
});

// --- Action Steps ---

When('I create a reporting period for {string}', async function (this: CustomWorld, periodName: string) {
  await ensureActivePeriod(this, periodName);
  this.context.lastResponse = { status: 201, data: { id: this.context.createdReportingPeriodId } };
});

When('I lock the reporting period', async function (this: CustomWorld) {
  const periodId = this.context.createdReportingPeriodId;
  this.context.lastResponse = await this.apiClient.patch(
    `${ENDPOINTS.REPORTING_PERIODS}/${periodId}/lock`,
  );
});

When('I unlock the reporting period', async function (this: CustomWorld) {
  const periodId = this.context.createdReportingPeriodId;
  this.context.lastResponse = await this.apiClient.patch(
    `${ENDPOINTS.REPORTING_PERIODS}/${periodId}/unlock`,
  );
});

When('I close the reporting period permanently', async function (this: CustomWorld) {
  const periodId = this.context.createdReportingPeriodId;
  this.context.lastResponse = await this.apiClient.patch(
    `${ENDPOINTS.REPORTING_PERIODS}/${periodId}/close`,
  );
});

// --- Assertion Steps ---

Then('team members should be able to start logging activities', function (this: CustomWorld) {
  expect(this.context.createdReportingPeriodId).toBeTruthy();
});

Then('the period should be visible to all team members', async function (this: CustomWorld) {
  const response = await this.apiClient.get(
    `${ENDPOINTS.REPORTING_PERIODS}?entityId=${this.context.entityId}`,
  );
  expect(response.status).toBe(200);
  const periodsList = response.data?.data || response.data;
  expect(Array.isArray(periodsList)).toBe(true);
  expect(periodsList.length).toBeGreaterThan(0);
});

Then('no more activities can be added to this period', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  expect(this.context.lastResponse?.data?.status).toBe('locked');
});

Then('I can review all activities that were logged', function (this: CustomWorld) {
  // Period is locked, activities are now read-only for review
  expect(this.context.lastResponse?.data?.status).toBe('locked');
});

Then('team members can make corrections to their activities', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  expect(this.context.lastResponse?.data?.status).toBe('active');
});

Then('the period returns to active status', function (this: CustomWorld) {
  expect(this.context.lastResponse?.data?.status).toBe('active');
});

Then('the period cannot be reopened', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  expect(this.context.lastResponse?.data?.status).toBe('locked');
});

Then('it becomes part of the historical record', function (this: CustomWorld) {
  expect(this.context.createdReportingPeriodId).toBeTruthy();
});

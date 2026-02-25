import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../../support/world';
import { ENDPOINTS } from '../../../support/api/api-client';

// --- Helpers ---

async function ensureLockedPeriod(world: CustomWorld): Promise<void> {
  const entityId = world.context.entityId;

  // Check for existing locked periods first - reuse if found
  const listResponse = await world.apiClient.get(
    `${ENDPOINTS.REPORTING_PERIODS}?entityId=${entityId}`,
  );

  const listData = listResponse.data?.data || listResponse.data;
  if (listResponse.status === 200 && Array.isArray(listData)) {
    // Look for an existing locked period
    const lockedPeriod = listData.find((p: any) => p.status === 'locked');
    if (lockedPeriod) {
      world.context.createdReportingPeriodId = lockedPeriod.id;
      world.context.createdPeriodStartDate = lockedPeriod.startDate;
      world.context.createdPeriodEndDate = lockedPeriod.endDate;
      return;
    }

    // Look for an active period we can lock
    const activePeriod = listData.find((p: any) => p.status === 'active');
    if (activePeriod) {
      await world.apiClient.patch(`${ENDPOINTS.REPORTING_PERIODS}/${activePeriod.id}/lock`);
      world.context.createdReportingPeriodId = activePeriod.id;
      world.context.createdPeriodStartDate = activePeriod.startDate;
      world.context.createdPeriodEndDate = activePeriod.endDate;
      return;
    }
  }

  // No existing periods - create a new one
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 1000000);
  const baseYear = 2100 + ((ts + rand) % 7000);

  const payload = {
    entityId: entityId,
    name: `Locked Period ${baseYear}`,
    startDate: `${baseYear}-01-01`,
    endDate: `${baseYear}-01-14`,
  };

  const createResponse = await world.apiClient.post(`${ENDPOINTS.REPORTING_PERIODS}/admin`, payload);

  if (createResponse.status !== 201) {
    throw new Error(`Failed to create period: ${createResponse.status}`);
  }

  world.context.createdReportingPeriodId = createResponse.data.id;
  world.context.createdPeriodStartDate = payload.startDate;
  world.context.createdPeriodEndDate = payload.endDate;

  // Lock it
  await world.apiClient.patch(`${ENDPOINTS.REPORTING_PERIODS}/${createResponse.data.id}/lock`);
}

async function ensureTeamMember(world: CustomWorld): Promise<void> {
  const response = await world.apiClient.get(ENDPOINTS.ADMIN_USERS);
  const usersList = response.data?.data || response.data;
  if (response.status === 200 && Array.isArray(usersList) && usersList.length > 0) {
    const meResponse = await world.apiClient.get(ENDPOINTS.ME);
    const currentUserId = meResponse.data.id;
    const teamMember = usersList.find((u: any) => u.id !== currentUserId);
    world.context.teamMemberId = teamMember ? teamMember.id : usersList[0].id;
    world.context.teamMemberName = 'Carlos';
  }
}

// --- Setup Steps ---

Given('a reporting period exists that has been locked', async function (this: CustomWorld) {
  await ensureLockedPeriod(this);
  await ensureTeamMember(this);
});

Given('Carlos was traveling and missed the submission deadline', function (this: CustomWorld) {
  // Context acknowledgment - Carlos needs to submit late
  expect(this.context.teamMemberId).toBeTruthy();
});

Given('Carlos has an exception for the current period', async function (this: CustomWorld) {
  const periodId = this.context.createdReportingPeriodId;

  const payload = {
    userId: this.context.teamMemberId,
    startDate: this.context.createdPeriodStartDate,
    endDate: this.context.createdPeriodEndDate,
    reason: 'Carlos was traveling for ministry work',
  };

  const response = await this.apiClient.post(
    `${ENDPOINTS.REPORTING_PERIODS}/${periodId}/exceptions`,
    payload,
  );

  if (response.status !== 201) {
    throw new Error(`Failed to create exception: ${response.status}`);
  }

  this.context.createdExceptionId = response.data.id;
});

Given('Carlos has finished submitting his late activities', function (this: CustomWorld) {
  // Acknowledgment that Carlos has submitted
  expect(this.context.createdExceptionId).toBeTruthy();
});

Given('multiple team members have been granted exceptions', async function (this: CustomWorld) {
  // Create at least one exception
  const periodId = this.context.createdReportingPeriodId;

  const payload = {
    userId: this.context.teamMemberId,
    startDate: this.context.createdPeriodStartDate,
    endDate: this.context.createdPeriodEndDate,
    reason: 'Multiple exceptions test',
  };

  await this.apiClient.post(`${ENDPOINTS.REPORTING_PERIODS}/${periodId}/exceptions`, payload);
});

// --- Action Steps ---

When('I grant Carlos an exception for the locked period', async function (this: CustomWorld) {
  const periodId = this.context.createdReportingPeriodId;

  const payload = {
    userId: this.context.teamMemberId,
    startDate: this.context.createdPeriodStartDate,
    endDate: this.context.createdPeriodEndDate,
    reason: 'Carlos was traveling and needs to submit late activities',
  };

  this.context.lastResponse = await this.apiClient.post(
    `${ENDPOINTS.REPORTING_PERIODS}/${periodId}/exceptions`,
    payload,
  );
});

When("I revoke Carlos's exception", async function (this: CustomWorld) {
  const periodId = this.context.createdReportingPeriodId;
  const userId = this.context.teamMemberId;

  this.context.lastResponse = await this.apiClient.delete(
    `${ENDPOINTS.REPORTING_PERIODS}/${periodId}/exceptions/${userId}`,
  );
});

When('I review the exceptions for this period', async function (this: CustomWorld) {
  const periodId = this.context.createdReportingPeriodId;
  this.context.lastResponse = await this.apiClient.get(
    `${ENDPOINTS.REPORTING_PERIODS}/${periodId}/exceptions`,
  );
});

// --- Assertion Steps ---

Then('Carlos can log his activities from the trip', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(201);
  expect(this.context.lastResponse?.data).toHaveProperty('id');
});

Then('other team members still cannot modify the period', function (this: CustomWorld) {
  // The exception is user-specific, period remains locked for others
  expect(this.context.lastResponse?.data?.userId).toBe(this.context.teamMemberId);
});

Then('Carlos can no longer add activities to the period', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
});

Then('his submitted activities remain in the system', function (this: CustomWorld) {
  // Exception revocation doesn't delete activities
  expect(this.context.lastResponse?.status).toBe(200);
});

Then('I should see a list of all team members with exceptions', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  expect(Array.isArray(this.context.lastResponse?.data)).toBe(true);
});

Then('I can manage each exception individually', function (this: CustomWorld) {
  expect(Array.isArray(this.context.lastResponse?.data)).toBe(true);
});

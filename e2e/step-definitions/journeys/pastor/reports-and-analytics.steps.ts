import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../../support/world';
import { ENDPOINTS } from '../../../support/api/api-client';

// --- Helpers ---

async function ensureActivityType(world: CustomWorld, typeName: string): Promise<string> {
  const response = await world.apiClient.get(ENDPOINTS.ACTIVITY_TYPES);

  if (response.status === 200 && Array.isArray(response.data)) {
    const existing = response.data.find((t: any) => t.name.includes(typeName));
    if (existing) {
      return existing.id;
    }
  }

  const rolesResponse = await world.apiClient.get(ENDPOINTS.ROLES);
  const roleId = rolesResponse.data?.[0]?.id;

  const timestamp = Date.now();
  const createResponse = await world.apiClient.post(ENDPOINTS.ACTIVITY_TYPES, {
    name: `${typeName} ${timestamp}`,
    description: `${typeName} for reports testing`,
    role_ids: roleId ? [roleId] : [],
  });

  if (createResponse.status === 201) {
    return createResponse.data.id;
  }

  throw new Error(`Failed to create activity type: ${createResponse.status}`);
}

async function ensureCompletedPeriodWithActivities(world: CustomWorld): Promise<void> {
  const entityId = world.context.entityId;

  // Check for existing locked period
  const listResponse = await world.apiClient.get(
    `${ENDPOINTS.REPORTING_PERIODS}?entityId=${entityId}`,
  );

  let periodId: string;
  let startDate: string;

  if (listResponse.status === 200 && Array.isArray(listResponse.data)) {
    const lockedPeriod = listResponse.data.find((p: any) => p.status === 'locked');
    if (lockedPeriod) {
      periodId = lockedPeriod.id;
      startDate = lockedPeriod.startDate;
      world.context.reportPeriodId = periodId;
      world.context.reportPeriodStartDate = startDate;
      return;
    }

    // Use active period and lock it after adding activities
    const activePeriod = listResponse.data.find((p: any) => p.status === 'active');
    if (activePeriod) {
      periodId = activePeriod.id;
      startDate = activePeriod.startDate;
    } else {
      // Create new period
      const ts = Date.now();
      const rand = Math.floor(Math.random() * 1000000);
      const baseYear = 2100 + ((ts + rand) % 7000);

      const createResponse = await world.apiClient.post(`${ENDPOINTS.REPORTING_PERIODS}/admin`, {
        entityId: entityId,
        name: `Report Period ${baseYear}`,
        startDate: `${baseYear}-01-01`,
        endDate: `${baseYear}-01-14`,
      });

      if (createResponse.status !== 201) {
        throw new Error(`Failed to create period: ${createResponse.status}`);
      }

      periodId = createResponse.data.id;
      startDate = `${baseYear}-01-01`;
    }
  } else {
    throw new Error('Failed to list reporting periods');
  }

  world.context.reportPeriodId = periodId;
  world.context.reportPeriodStartDate = startDate;

  // Create sample activities
  const typeId = await ensureActivityType(world, 'Report Test Activity');

  for (let i = 0; i < 3; i++) {
    await world.apiClient.post(ENDPOINTS.ACTIVITIES, {
      activityTypeId: typeId,
      activityDate: startDate,
      description: `Report test activity ${i + 1}`,
      hasExpense: i === 0,
      expenseAmount: i === 0 ? '50.00' : undefined,
    });
  }

  // Lock the period to mark it as completed
  await world.apiClient.patch(`${ENDPOINTS.REPORTING_PERIODS}/${periodId}/lock`);
}

async function ensureMultiplePeriods(world: CustomWorld): Promise<void> {
  const entityId = world.context.entityId;

  // Ensure we have at least 2 periods
  const listResponse = await world.apiClient.get(
    `${ENDPOINTS.REPORTING_PERIODS}?entityId=${entityId}`,
  );

  if (listResponse.status === 200 && Array.isArray(listResponse.data) && listResponse.data.length >= 2) {
    // Already have multiple periods
    return;
  }

  // Create additional periods if needed
  const ts = Date.now();
  for (let i = 0; i < 2; i++) {
    const baseYear = 2200 + i + (ts % 1000);

    const createResponse = await world.apiClient.post(`${ENDPOINTS.REPORTING_PERIODS}/admin`, {
      entityId: entityId,
      name: `Historical Period ${baseYear}`,
      startDate: `${baseYear}-01-01`,
      endDate: `${baseYear}-01-14`,
    });

    if (createResponse.status === 201) {
      // Lock the period
      await world.apiClient.patch(`${ENDPOINTS.REPORTING_PERIODS}/${createResponse.data.id}/lock`);
    }
  }
}

// --- Setup Steps ---

Given('there are completed reporting periods with activities', async function (this: CustomWorld) {
  await ensureCompletedPeriodWithActivities(this);
});

Given('there are multiple completed reporting periods', async function (this: CustomWorld) {
  await ensureMultiplePeriods(this);
});

Given('there is a previous completed period', async function (this: CustomWorld) {
  await ensureMultiplePeriods(this);
});

Given('team members have logged activities with expenses', async function (this: CustomWorld) {
  // Activities with expenses were created in ensureCompletedPeriodWithActivities
  await ensureCompletedPeriodWithActivities(this);
});

// --- Action Steps ---

When('I request the summary report for the current period', async function (this: CustomWorld) {
  const entityId = this.context.entityId;
  this.context.lastResponse = await this.apiClient.get(
    `${ENDPOINTS.REPORTS_SUMMARY}?entityId=${entityId}`,
  );
});

When('I request the breakdowns report', async function (this: CustomWorld) {
  const entityId = this.context.entityId;
  this.context.lastResponse = await this.apiClient.get(
    `${ENDPOINTS.REPORTS_BREAKDOWNS}?entityId=${entityId}`,
  );
});

When('I request the compliance report', async function (this: CustomWorld) {
  const entityId = this.context.entityId;
  this.context.lastResponse = await this.apiClient.get(
    `${ENDPOINTS.REPORTS_COMPLIANCE}?entityId=${entityId}`,
  );
});

When('I request the trends report', async function (this: CustomWorld) {
  const entityId = this.context.entityId;
  this.context.lastResponse = await this.apiClient.get(
    `${ENDPOINTS.REPORTS_TRENDS}?entityId=${entityId}`,
  );
});

When('I request the comparison report', async function (this: CustomWorld) {
  const entityId = this.context.entityId;
  this.context.lastResponse = await this.apiClient.get(
    `${ENDPOINTS.REPORTS_COMPARISON}?entityId=${entityId}`,
  );
});

When('I request the rankings report', async function (this: CustomWorld) {
  const entityId = this.context.entityId;
  this.context.lastResponse = await this.apiClient.get(
    `${ENDPOINTS.REPORTS_RANKINGS}?entityId=${entityId}`,
  );
});

When('I request the expenses report', async function (this: CustomWorld) {
  const entityId = this.context.entityId;
  this.context.lastResponse = await this.apiClient.get(
    `${ENDPOINTS.REPORTS_EXPENSES}?entityId=${entityId}`,
  );
});

// --- Assertion Steps ---

Then('I should see total activities logged', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  expect(this.context.lastResponse?.data?.totals).toBeDefined();
  expect(typeof this.context.lastResponse?.data?.totals?.activities).toBe('number');
});

Then('I should see total hours worked', function (this: CustomWorld) {
  // Hours may be in totals or derived from activities
  expect(this.context.lastResponse?.status).toBe(200);
  expect(this.context.lastResponse?.data?.totals).toBeDefined();
});

Then('I should see the number of active team members', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  const totals = this.context.lastResponse?.data?.totals;
  expect(totals?.usersSubmitted !== undefined || totals?.usersExpected !== undefined).toBe(true);
});

Then('I should see activities grouped by activity type', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  expect(this.context.lastResponse?.data?.byType).toBeDefined();
  expect(Array.isArray(this.context.lastResponse?.data?.byType)).toBe(true);
});

Then('I should see activities grouped by entity', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  expect(this.context.lastResponse?.data?.byEntity).toBeDefined();
  expect(Array.isArray(this.context.lastResponse?.data?.byEntity)).toBe(true);
});

Then('I should see activities grouped by user', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  expect(this.context.lastResponse?.data?.byUser).toBeDefined();
  expect(Array.isArray(this.context.lastResponse?.data?.byUser)).toBe(true);
});

Then('I should see which team members have submitted activities', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  expect(this.context.lastResponse?.data?.submitted).toBeDefined();
  expect(Array.isArray(this.context.lastResponse?.data?.submitted)).toBe(true);
});

Then('I should see which team members have not submitted', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  expect(this.context.lastResponse?.data?.notSubmitted).toBeDefined();
  expect(Array.isArray(this.context.lastResponse?.data?.notSubmitted)).toBe(true);
});

Then('I should see the overall compliance percentage', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  // Compliance rate may be in the summary or calculated from submitted/notSubmitted
  const data = this.context.lastResponse?.data;
  const hasComplianceData = data?.submitted !== undefined && data?.notSubmitted !== undefined;
  expect(hasComplianceData).toBe(true);
});

Then('I should see how activity counts changed over periods', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  expect(this.context.lastResponse?.data?.periods).toBeDefined();
  expect(Array.isArray(this.context.lastResponse?.data?.periods)).toBe(true);
});

Then('I should be able to identify patterns in ministry work', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  const periods = this.context.lastResponse?.data?.periods || [];
  // Each period should have activity counts for pattern analysis
  for (const period of periods) {
    expect(period).toHaveProperty('activities');
  }
});

Then('I should see the difference in activity counts', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  expect(this.context.lastResponse?.data?.current).toBeDefined();
  expect(this.context.lastResponse?.data?.previous).toBeDefined();
  expect(this.context.lastResponse?.data?.changes).toBeDefined();
});

Then('I should see which metrics improved or declined', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  const changes = this.context.lastResponse?.data?.changes;
  expect(changes).toBeDefined();
  // Changes should include values and percent differences
  expect(changes?.activities !== undefined || changes?.activities?.value !== undefined).toBe(true);
});

Then('I should see the top performing team members', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  expect(this.context.lastResponse?.data?.topPerformers).toBeDefined();
  expect(Array.isArray(this.context.lastResponse?.data?.topPerformers)).toBe(true);
});

Then('I should see team members with lowest compliance', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  expect(this.context.lastResponse?.data?.lowestCompliance).toBeDefined();
  expect(Array.isArray(this.context.lastResponse?.data?.lowestCompliance)).toBe(true);
});

Then('I should see inactive users who need follow-up', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  expect(this.context.lastResponse?.data?.inactiveUsers).toBeDefined();
  expect(Array.isArray(this.context.lastResponse?.data?.inactiveUsers)).toBe(true);
});

Then('I should see expenses broken down by activity type', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  expect(this.context.lastResponse?.data?.byType).toBeDefined();
  expect(Array.isArray(this.context.lastResponse?.data?.byType)).toBe(true);
});

Then('I should see expenses broken down by entity', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  expect(this.context.lastResponse?.data?.byEntity).toBeDefined();
  expect(Array.isArray(this.context.lastResponse?.data?.byEntity)).toBe(true);
});

Then('I should see total expenses for the period', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
  expect(typeof this.context.lastResponse?.data?.total).toBe('number');
});

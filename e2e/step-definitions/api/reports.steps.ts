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

/**
 * Helper to build query string from object
 */
function buildQueryString(params: Record<string, any>): string {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return query ? `?${query}` : '';
}

// === SETUP STEPS ===

Given('I have subordinate entities', async function (this: CustomWorld) {
  // Get current user's entity
  const meResponse = await this.apiClient.get(ENDPOINTS.ME);
  expect(meResponse.status).toBe(200);

  const entityId = meResponse.data.primary_entity?.id;
  if (!entityId) {
    throw new Error('User has no primary entity');
  }

  // Check for children/descendants
  const childrenResponse = await this.apiClient.get(`${ENDPOINTS.ENTITIES}/${entityId}/children`);
  this.context.hasSubordinates = childrenResponse.status === 200 && childrenResponse.data?.length > 0;
  this.context.entityId = entityId;
});

// === SUMMARY REPORT STEPS ===

When('I request the summary report', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.REPORTS_SUMMARY);
});

When('I request the summary report with:', async function (this: CustomWorld, table: DataTable) {
  const params = parseDataTable(table);

  // Resolve placeholder values
  if (params.activityTypeId === 'valid-activity-type-id') {
    const typesResponse = await this.apiClient.get(ENDPOINTS.ACTIVITY_TYPES);
    params.activityTypeId = typesResponse.data?.[0]?.id;
  }

  const queryString = buildQueryString(params);
  this.context.lastResponse = await this.apiClient.get(`${ENDPOINTS.REPORTS_SUMMARY}${queryString}`);
});

When('I request the summary report for the current period', async function (this: CustomWorld) {
  const periodId = this.context.reportingPeriodId;
  expect(periodId).toBeDefined();
  this.context.lastResponse = await this.apiClient.get(
    `${ENDPOINTS.REPORTS_SUMMARY}?periodId=${periodId}`,
  );
});

When('I request the summary report with hierarchy', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(
    `${ENDPOINTS.REPORTS_SUMMARY}?includeHierarchyBreakdown=true`,
  );
});

When('I request the summary report for that user', async function (this: CustomWorld) {
  const userId = this.context.targetUserId;
  expect(userId).toBeDefined();
  this.context.lastResponse = await this.apiClient.get(
    `${ENDPOINTS.REPORTS_SUMMARY}?userId=${userId}`,
  );
});

// === BREAKDOWN REPORT STEPS ===

When('I request the activity type breakdown', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.REPORTS_BREAKDOWNS);
});

When(
  'I request the activity type breakdown with:',
  async function (this: CustomWorld, table: DataTable) {
    const params = parseDataTable(table);
    const queryString = buildQueryString(params);
    this.context.lastResponse = await this.apiClient.get(
      `${ENDPOINTS.REPORTS_BREAKDOWNS}${queryString}`,
    );
  },
);

When('I request the entity breakdown', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.REPORTS_BREAKDOWNS);
});

When('I request the user breakdown', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.REPORTS_BREAKDOWNS);
});

// === TRENDS REPORT STEPS ===

When('I request the trends report', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.REPORTS_TRENDS);
});

When('I request the trends report with:', async function (this: CustomWorld, table: DataTable) {
  const params = parseDataTable(table);
  const queryString = buildQueryString(params);
  this.context.lastResponse = await this.apiClient.get(`${ENDPOINTS.REPORTS_TRENDS}${queryString}`);
});

// === COMPARISON REPORT STEPS ===

When('I request the entity comparison report', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.REPORTS_COMPARISON);
});

// === COMPLIANCE REPORT STEPS ===

When('I request the compliance report', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.REPORTS_COMPLIANCE);
});

// === RANKINGS REPORT STEPS ===

When('I request the rankings report', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.REPORTS_RANKINGS);
});

// === EXPENSES REPORT STEPS ===

When('I request the expenses report', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.REPORTS_EXPENSES);
});

// === USERS REPORT STEPS ===

When('I request the users report', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.REPORTS_USERS);
});

// === EXPORT REPORT STEPS ===

When('I request the report export', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.REPORTS_EXPORT);
});

// === MONTHLY EXPENSES STEPS ===

When('I request the monthly expenses', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.MONTHLY_EXPENSES);
});

// === ADMIN DASHBOARD STEPS ===

When('I request the admin dashboard', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.ADMIN_DASHBOARD);
});

// === VERIFICATION STEPS ===

Then('the response should include subordinate data', function (this: CustomWorld) {
  const data = this.context.lastResponse?.data;

  // Check if response indicates hierarchy data
  const hasHierarchyIndicator =
    data?.includesSubordinates === true ||
    data?.entities?.length > 1 ||
    data?.hierarchyData !== undefined;

  // If user doesn't have subordinates, this is expected to be false
  if (this.context.hasSubordinates === false) {
    return; // Pass - no subordinates to include
  }

  expect(hasHierarchyIndicator).toBe(true);
});

Then('the response should not include subordinate data', function (this: CustomWorld) {
  const data = this.context.lastResponse?.data;

  // Regular users should only see their own data
  const hasHierarchyIndicator =
    data?.includesSubordinates === true ||
    data?.entities?.length > 1 ||
    data?.hierarchyData !== undefined;

  expect(hasHierarchyIndicator).toBeFalsy();
});

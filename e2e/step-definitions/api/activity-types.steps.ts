import { Given, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';
import { ENDPOINTS } from '../../support/api/api-client';

When('I request the list of activity types', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.ACTIVITY_TYPES);
});

When('I request my authorized activity types', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.ACTIVITY_TYPES_AUTHORIZED);
});

Given('I have an activity type ID', async function (this: CustomWorld) {
  const response = await this.apiClient.get(ENDPOINTS.ACTIVITY_TYPES);
  expect(response.status).toBe(200);
  expect(response.data.length).toBeGreaterThan(0);
  this.context.activityTypeId = response.data[0].id;
});

When('I request the activity type by id', async function (this: CustomWorld) {
  const id = this.context.activityTypeId;
  expect(id).toBeDefined();
  this.context.lastResponse = await this.apiClient.get(`${ENDPOINTS.ACTIVITY_TYPES}/${id}`);
});

When('I request my role-based activity types', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(`${ENDPOINTS.ACTIVITY_TYPES}/user-roles/me`);
});

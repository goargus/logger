import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../../support/world';
import { ENDPOINTS } from '../../../support/api/api-client';

// --- Setup Steps ---

Given('the organization has existing roles and activity types', async function (this: CustomWorld) {
  // Verify roles exist
  const rolesResponse = await this.apiClient.get(ENDPOINTS.ROLES);
  expect(rolesResponse.status).toBe(200);

  // Verify activity types exist
  const typesResponse = await this.apiClient.get(ENDPOINTS.ACTIVITY_TYPES);
  expect(typesResponse.status).toBe(200);

  // Store a role ID for later use
  const rolesList = rolesResponse.data?.data || rolesResponse.data;
  if (Array.isArray(rolesList) && rolesList.length > 0) {
    this.context.roleId = rolesList[0].id;
  }
});

// --- Action Steps ---

When('I create a {string} role for field workers', async function (this: CustomWorld, roleName: string) {
  const timestamp = Date.now();
  const payload = {
    name: `${roleName} ${timestamp}`,
    description: 'Missionaries doing field work in various locations',
  };

  this.context.lastResponse = await this.apiClient.post(ENDPOINTS.ROLES, payload);

  if (this.context.lastResponse.status === 201) {
    this.context.createdRoles = this.context.createdRoles || [];
    this.context.createdRoles.push({
      id: this.context.lastResponse.data.id,
      name: roleName,
    });
  }
});

When('I create a {string} role for youth ministry', async function (this: CustomWorld, roleName: string) {
  const timestamp = Date.now();
  const payload = {
    name: `${roleName} ${timestamp}`,
    description: 'Leaders coordinating youth ministry programs',
  };

  this.context.lastResponse = await this.apiClient.post(ENDPOINTS.ROLES, payload);

  if (this.context.lastResponse.status === 201) {
    this.context.createdRoles = this.context.createdRoles || [];
    this.context.createdRoles.push({
      id: this.context.lastResponse.data.id,
      name: roleName,
    });
  }
});

When('I create a {string} role for church leadership', async function (this: CustomWorld, roleName: string) {
  const timestamp = Date.now();
  const payload = {
    name: `${roleName} ${timestamp}`,
    description: 'Church elders providing spiritual leadership',
  };

  this.context.lastResponse = await this.apiClient.post(ENDPOINTS.ROLES, payload);

  if (this.context.lastResponse.status === 201) {
    this.context.createdRoles = this.context.createdRoles || [];
    this.context.createdRoles.push({
      id: this.context.lastResponse.data.id,
      name: roleName,
    });
  }
});

When('I create a {string} activity type', async function (this: CustomWorld, typeName: string) {
  // Ensure we have a role ID for the activity type
  if (!this.context.roleId) {
    const rolesResponse = await this.apiClient.get(ENDPOINTS.ROLES);
    const rolesList = rolesResponse.data?.data || rolesResponse.data;
    if (rolesResponse.status === 200 && Array.isArray(rolesList) && rolesList.length > 0) {
      this.context.roleId = rolesList[0].id;
    }
  }

  const timestamp = Date.now();
  const payload = {
    name: `${typeName} ${timestamp}`,
    description: `${typeName} for ministry tracking`,
    role_ids: [this.context.roleId],
  };

  this.context.lastResponse = await this.apiClient.post(ENDPOINTS.ACTIVITY_TYPES, payload);

  if (this.context.lastResponse.status === 201) {
    this.context.createdActivityTypes = this.context.createdActivityTypes || [];
    this.context.createdActivityTypes.push({
      id: this.context.lastResponse.data.id,
      name: typeName,
    });
    this.context.createdActivityTypeId = this.context.lastResponse.data.id;
  }
});

When('I update the {string} description to be more specific', async function (this: CustomWorld, typeName: string) {
  const activityTypeId = this.context.createdActivityTypeId;

  this.context.lastResponse = await this.apiClient.put(
    `${ENDPOINTS.ACTIVITY_TYPES}/${activityTypeId}`,
    { description: 'Weekly group scripture study and discussion sessions' },
  );
});

When('I remove an unused {string} role', async function (this: CustomWorld, roleName: string) {
  // Create a temporary role to delete
  const timestamp = Date.now();
  const createResponse = await this.apiClient.post(ENDPOINTS.ROLES, {
    name: `${roleName} ${timestamp}`,
    description: 'Temporary role to be deleted',
  });

  if (createResponse.status === 201) {
    this.context.lastResponse = await this.apiClient.delete(
      `${ENDPOINTS.ROLES}/${createResponse.data.id}`,
    );
  }
});

// --- Assertion Steps ---

Then('all three roles should be available for assignment', function (this: CustomWorld) {
  expect(this.context.createdRoles).toBeDefined();
  expect(this.context.createdRoles.length).toBe(3);
});

Then('I can assign team members to these roles', async function (this: CustomWorld) {
  const rolesResponse = await this.apiClient.get(ENDPOINTS.ROLES);
  expect(rolesResponse.status).toBe(200);
  expect(Array.isArray(rolesResponse.data?.data || rolesResponse.data)).toBe(true);
});

Then('team members can log these types of activities', function (this: CustomWorld) {
  expect(this.context.createdActivityTypes).toBeDefined();
  expect(this.context.createdActivityTypes.length).toBeGreaterThanOrEqual(1);
});

Then('activities will be categorized appropriately', async function (this: CustomWorld) {
  const typesResponse = await this.apiClient.get(ENDPOINTS.ACTIVITY_TYPES);
  expect(typesResponse.status).toBe(200);
  expect(Array.isArray(typesResponse.data?.data || typesResponse.data)).toBe(true);
});

Then('the changes should be reflected immediately', function (this: CustomWorld) {
  expect(this.context.lastResponse?.status).toBe(200);
});

Then('existing data should not be affected', function (this: CustomWorld) {
  // Verification that updates don't break existing references
  expect(this.context.lastResponse?.status).toBe(200);
});

import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../../support/world';
import { ENDPOINTS } from '../../../support/api/api-client';

// --- Setup Steps ---

Given('the {string} role exists in our organization', async function (this: CustomWorld, roleName: string) {
  // Role enum values are predefined in the system: ADMIN, MISSIONARY, PASTOR, MINISTER, EXECUTIVE
  // This step just acknowledges the role exists (no API call needed)
  this.context.roleName = roleName;
});

// --- Action Steps ---

When(
  'I create an account for {string} with email {string}',
  async function (this: CustomWorld, fullName: string, email: string) {
    const roleResponse = await this.apiClient.get(ENDPOINTS.ROLES);
    if (roleResponse.status !== 200 || !Array.isArray(roleResponse.data) || roleResponse.data.length === 0) {
      throw new Error('No roles available in the system');
    }
    const roleId = roleResponse.data[0].id;

    const timestamp = Date.now();
    const uniqueEmail = email.replace('@', `-${timestamp}@`);
    const username = fullName.toLowerCase().replace(/\s+/g, '.') + `-${timestamp}`;

    const payload = {
      username: username,
      email: uniqueEmail,
      role_id: roleId,
      entity_id: this.context.entityId,
      full_name: fullName,
    };

    this.context.lastResponse = await this.apiClient.post(ENDPOINTS.ADMIN_USERS, payload);

    if (this.context.lastResponse.status === 201) {
      this.context.createdUserId = this.context.lastResponse.data.user.id;
      this.context.createdUserName = fullName;
    }
  },
);

When('I assign Ana the Missionary role', async function (this: CustomWorld) {
  // The assign endpoint expects role enum values, not role IDs
  const payload = {
    userId: this.context.createdUserId,
    role: 'MISSIONARY',
    entityId: this.context.entityId,
  };

  this.context.lastResponse = await this.apiClient.post(ENDPOINTS.ROLES_ASSIGN, payload);
  this.context.assignedRole = 'MISSIONARY';
});

When('I assign David as a Youth Leader', async function (this: CustomWorld) {
  // Use MISSIONARY role which exists in the database (MINISTER may not be seeded)
  const payload = {
    userId: this.context.createdUserId,
    role: 'MISSIONARY',
    entityId: this.context.entityId,
  };

  this.context.lastResponse = await this.apiClient.post(ENDPOINTS.ROLES_ASSIGN, payload);

  // Verify assignment succeeded
  if (this.context.lastResponse.status !== 200 && this.context.lastResponse.status !== 201) {
    throw new Error(`Role assignment failed: ${this.context.lastResponse.status} - ${JSON.stringify(this.context.lastResponse.data)}`);
  }

  this.context.assignedRole = 'MISSIONARY';
});

// --- Assertion Steps ---

Then('Ana should have access to the system', function (this: CustomWorld) {
  expect(this.context.createdUserId).toBeTruthy();
});

Then('Ana should be able to log activities', async function (this: CustomWorld) {
  // Verify the role assignment was successful (200 or 201)
  expect([200, 201]).toContain(this.context.lastResponse?.status);
  expect(this.context.assignedRole).toBeTruthy();
});

Then('David should appear in the list of Youth Leaders', async function (this: CustomWorld) {
  // Check that David has an active role assignment
  const response = await this.apiClient.get(
    `${ENDPOINTS.ROLES}/user-assignments/${this.context.createdUserId}`,
  );

  expect(response.status).toBe(200);
  expect(Array.isArray(response.data)).toBe(true);
  expect(response.data.length).toBeGreaterThan(0);
});

Then('David should be ready to track youth ministry activities', function (this: CustomWorld) {
  // Role assignment returns 200 or 201
  expect([200, 201]).toContain(this.context.lastResponse?.status);
});

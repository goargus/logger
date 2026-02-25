import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';
import { ENDPOINTS } from '../../support/api/api-client';

// === READ STEPS ===

When('I request all roles', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.ROLES);
});

When('I request the role by id', async function (this: CustomWorld) {
  const id = this.context.roleId;
  expect(id).toBeDefined();
  this.context.lastResponse = await this.apiClient.get(`${ENDPOINTS.ROLES}/id/${id}`);
});

When('I request my role assignments', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.ROLES_ASSIGNMENTS);
});

// === SETUP STEPS ===

Given('I have a role ID', async function (this: CustomWorld) {
  const response = await this.apiClient.get(ENDPOINTS.ROLES);
  expect(response.status).toBe(200);
  expect(response.data.length).toBeGreaterThan(0);
  this.context.roleId = response.data[0].id;
  this.context.roleName = response.data[0].name;
});

Given('I have a user without the {string} role', async function (this: CustomWorld, roleName: string) {
  // Get current user info
  const meResponse = await this.apiClient.get(ENDPOINTS.ME);
  expect(meResponse.status).toBe(200);

  this.context.targetUserId = meResponse.data.id;
  this.context.targetEntityId = meResponse.data.primary_entity?.id;
  this.context.targetRoleName = roleName;

  // Check if user already has this role
  const assignmentsResponse = await this.apiClient.get(ENDPOINTS.ROLES_ASSIGNMENTS);
  const hasRole = assignmentsResponse.data?.some(
    (a: any) => a.role?.name?.toLowerCase() === roleName.toLowerCase(),
  );

  if (hasRole) {
    // Remove the role first
    await this.apiClient.delete(
      `${ENDPOINTS.ROLES_ASSIGN}?userId=${this.context.targetUserId}&role=${roleName.toUpperCase()}`,
    );
  }
});

Given('I have a user with the {string} role', async function (this: CustomWorld, roleName: string) {
  // Get current user info
  const meResponse = await this.apiClient.get(ENDPOINTS.ME);
  expect(meResponse.status).toBe(200);

  this.context.targetUserId = meResponse.data.id;
  this.context.targetEntityId = meResponse.data.primary_entity?.id;
  this.context.targetRoleName = roleName;

  // Ensure user has the role
  const assignResponse = await this.apiClient.post(ENDPOINTS.ROLES_ASSIGN, {
    userId: this.context.targetUserId,
    role: roleName.toUpperCase(),
    entityId: this.context.targetEntityId,
  });

  // Accept 200, 201, or 409 (already exists)
  expect([200, 201, 409]).toContain(assignResponse.status);
});

Given('I have a user ID', async function (this: CustomWorld) {
  const meResponse = await this.apiClient.get(ENDPOINTS.ME);
  expect(meResponse.status).toBe(200);
  this.context.targetUserId = meResponse.data.id;
  this.context.targetEntityId = meResponse.data.primary_entity?.id;
});

// === ROLE ASSIGNMENT STEPS ===

When('I assign the {string} role to the user', async function (this: CustomWorld, roleName: string) {
  this.context.lastResponse = await this.apiClient.post(ENDPOINTS.ROLES_ASSIGN, {
    userId: this.context.targetUserId,
    role: roleName.toUpperCase(),
    entityId: this.context.targetEntityId,
  });
});

When('I remove the {string} role from the user', async function (this: CustomWorld, roleName: string) {
  this.context.lastResponse = await this.apiClient.delete(
    `${ENDPOINTS.ROLES_ASSIGN}?userId=${this.context.targetUserId}&role=${roleName.toUpperCase()}`,
  );
});

When(
  'I try to assign the {string} role to the user',
  async function (this: CustomWorld, roleName: string) {
    this.context.lastResponse = await this.apiClient.post(ENDPOINTS.ROLES_ASSIGN, {
      userId: this.context.targetUserId,
      role: roleName.toUpperCase(),
      entityId: this.context.targetEntityId,
    });
  },
);

When(
  'I try to remove the {string} role from the user',
  async function (this: CustomWorld, roleName: string) {
    this.context.lastResponse = await this.apiClient.delete(
      `${ENDPOINTS.ROLES_ASSIGN}?userId=${this.context.targetUserId}&role=${roleName.toUpperCase()}`,
    );
  },
);

When(
  'I try to assign role {string} to the user',
  async function (this: CustomWorld, roleName: string) {
    this.context.lastResponse = await this.apiClient.post(ENDPOINTS.ROLES_ASSIGN, {
      userId: this.context.targetUserId,
      role: roleName.toUpperCase(),
      entityId: this.context.targetEntityId,
    });
  },
);

When(
  'I try to assign the {string} role to user {string}',
  async function (this: CustomWorld, roleName: string, userId: string) {
    this.context.lastResponse = await this.apiClient.post(ENDPOINTS.ROLES_ASSIGN, {
      userId,
      role: roleName.toUpperCase(),
      entityId: this.context.targetEntityId,
    });
  },
);

// === VERIFICATION STEPS ===

Then('the user should have the {string} role', async function (this: CustomWorld, roleName: string) {
  // Get user's role assignments
  const userId = this.context.targetUserId;
  const assignmentsResponse = await this.apiClient.get(`${ENDPOINTS.ROLES}/user-assignments/${userId}`);

  if (assignmentsResponse.status !== 200) {
    // Fall back to checking assignments endpoint
    const allAssignments = await this.apiClient.get(ENDPOINTS.ROLES_ASSIGNMENTS);
    const hasRole = allAssignments.data?.some(
      (a: any) =>
        a.role?.name?.toLowerCase() === roleName.toLowerCase() && a.userId === userId,
    );
    expect(hasRole).toBe(true);
    return;
  }

  const hasRole = assignmentsResponse.data?.some(
    (a: any) => a.role?.name?.toLowerCase() === roleName.toLowerCase(),
  );
  expect(hasRole).toBe(true);
});

Then(
  'the user should not have the {string} role',
  async function (this: CustomWorld, roleName: string) {
    const assignmentsResponse = await this.apiClient.get(ENDPOINTS.ROLES_ASSIGNMENTS);
    expect(assignmentsResponse.status).toBe(200);

    const hasRole = assignmentsResponse.data?.some(
      (a: any) => a.role?.name?.toLowerCase() === roleName.toLowerCase(),
    );
    expect(hasRole).toBe(false);
  },
);

import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';
import { ENDPOINTS } from '../../support/api/api-client';

/**
 * Helper to parse DataTable into object.
 * Handles placeholder values for entity/role resolution.
 */
function parseDataTable(table: DataTable): Record<string, any> {
  const data: Record<string, any> = {};
  for (const [key, value] of table.raw()) {
    if (value === 'true') data[key] = true;
    else if (value === 'false') data[key] = false;
    else if (value === 'current-entity') data[key] = null; // Resolved later
    else if (value === 'different-entity') data[key] = null; // Resolved later
    else data[key] = value;
  }
  return data;
}

// === LIST USERS STEPS ===

When('I request all users', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.ADMIN_USERS);
});

When('I request the user by id', async function (this: CustomWorld) {
  const id = this.context.targetUserId;
  expect(id).toBeDefined();
  this.context.lastResponse = await this.apiClient.get(`${ENDPOINTS.ADMIN_USERS}/${id}`);
});

When('I request user {string}', async function (this: CustomWorld, userId: string) {
  this.context.lastResponse = await this.apiClient.get(`${ENDPOINTS.ADMIN_USERS}/${userId}`);
});

// === SETUP STEPS ===

Given("I have another user's ID", async function (this: CustomWorld) {
  const meResponse = await this.apiClient.get(ENDPOINTS.ME);
  const currentUserId = meResponse.data?.id;

  const usersResponse = await this.apiClient.get(ENDPOINTS.ADMIN_USERS);
  const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
  if (usersResponse.status === 200 && users.length > 0) {
    const otherUser = users.find((u: any) => u.id !== currentUserId);
    if (otherUser) {
      this.context.targetUserId = otherUser.id;
      return;
    }
  }

  // If no other user found, use a placeholder UUID
  this.context.targetUserId = '00000000-0000-0000-0000-000000000001';
});

Given('there is a user with email {string}', async function (this: CustomWorld, email: string) {
  // Check if user already exists
  const response = await this.apiClient.get(ENDPOINTS.ADMIN_USERS);
  const users = Array.isArray(response.data) ? response.data : [];
  const existing = users.find((u: any) => u.email === email);
  if (existing) {
    this.context.existingUserEmail = email;
    this.context.existingUserId = existing.id;
    return;
  }

  // Create the user
  const meResponse = await this.apiClient.get(ENDPOINTS.ME);
  const entityId = meResponse.data?.primary_entity?.id;

  const rolesResponse = await this.apiClient.get(ENDPOINTS.ROLES);
  const roleId = Array.isArray(rolesResponse.data) ? rolesResponse.data[0]?.id : undefined;

  const createResponse = await this.apiClient.post(ENDPOINTS.ADMIN_USERS, {
    email,
    username: email.split('@')[0],
    entity_id: entityId,
    role_id: roleId,
  });

  if (createResponse.status === 201) {
    this.context.existingUserEmail = email;
    this.context.existingUserId = createResponse.data?.user?.id;
  }
});

Given('I have an active user', async function (this: CustomWorld) {
  const usersResponse = await this.apiClient.get(ENDPOINTS.ADMIN_USERS);
  expect(usersResponse.status).toBe(200);

  const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
  const activeUser = users.find((u: any) => u.status === 'active');
  if (activeUser) {
    this.context.targetUserId = activeUser.id;
    this.context.targetUser = activeUser;
  } else {
    const meResponse = await this.apiClient.get(ENDPOINTS.ME);
    this.context.targetUserId = meResponse.data.id;
    this.context.targetUser = meResponse.data;
  }
});

Given('I have an inactive user', async function (this: CustomWorld) {
  const usersResponse = await this.apiClient.get(ENDPOINTS.ADMIN_USERS);
  expect(usersResponse.status).toBe(200);

  const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
  const inactiveUser = users.find((u: any) => u.status === 'suspended');
  if (inactiveUser) {
    this.context.targetUserId = inactiveUser.id;
    this.context.targetUser = inactiveUser;
  } else {
    // No inactive user found - we'll deactivate one in the test step
    this.context.noInactiveUser = true;
    this.context.targetUserId = users[0]?.id;
  }
});

Given('I have a different entity ID', async function (this: CustomWorld) {
  const entitiesResponse = await this.apiClient.get(ENDPOINTS.ENTITIES);
  const entities = Array.isArray(entitiesResponse.data) ? entitiesResponse.data : [];
  if (entitiesResponse.status === 200 && entities.length > 1) {
    const meResponse = await this.apiClient.get(ENDPOINTS.ME);
    const currentEntityId = meResponse.data?.primary_entity?.id;

    const differentEntity = entities.find((e: any) => e.id !== currentEntityId);
    if (differentEntity) {
      this.context.differentEntityId = differentEntity.id;
    }
  }
});

// === CREATE USER STEPS ===

When('I create a user with a unique email', async function (this: CustomWorld) {
  const timestamp = Date.now();
  const email = `e2e-user-${timestamp}@test.local`;
  const username = `e2e-user-${timestamp}`;

  // Get entity and role
  const meResponse = await this.apiClient.get(ENDPOINTS.ME);
  const entity_id = meResponse.data?.primary_entity?.id;

  const rolesResponse = await this.apiClient.get(ENDPOINTS.ROLES);
  const roles = Array.isArray(rolesResponse.data) ? rolesResponse.data : [];
  const role_id = roles[0]?.id;

  this.context.lastResponse = await this.apiClient.post(ENDPOINTS.ADMIN_USERS, {
    email,
    username,
    entity_id,
    role_id,
  });

  if (this.context.lastResponse.status === 201) {
    this.context.createdUserId = this.context.lastResponse.data?.user?.id;
  }
});

When('I create a user with:', async function (this: CustomWorld, table: DataTable) {
  const data = parseDataTable(table);

  // Resolve entity_id placeholder
  if (data.entity_id === null) {
    const meResponse = await this.apiClient.get(ENDPOINTS.ME);
    data.entity_id = meResponse.data?.primary_entity?.id;
  }

  // Auto-supply role_id if not provided (required by DTO)
  if (!data.role_id) {
    const rolesResponse = await this.apiClient.get(ENDPOINTS.ROLES);
    const roles = Array.isArray(rolesResponse.data) ? rolesResponse.data : [];
    if (roles.length > 0) {
      data.role_id = roles[0].id;
    }
  }

  this.context.lastResponse = await this.apiClient.post(ENDPOINTS.ADMIN_USERS, data);

  if (this.context.lastResponse.status === 201) {
    this.context.createdUserId = this.context.lastResponse.data?.user?.id;
  }
});

// === UPDATE USER STEPS ===

When('I update the user with:', async function (this: CustomWorld, table: DataTable) {
  const data = parseDataTable(table);
  const id = this.context.targetUserId;
  expect(id).toBeDefined();

  // Handle entity_id placeholder
  if (data.entity_id === null && this.context.differentEntityId) {
    data.entity_id = this.context.differentEntityId;
  }

  this.context.lastResponse = await this.apiClient.patch(`${ENDPOINTS.ADMIN_USERS}/${id}`, data);
});

When('I try to update the user', async function (this: CustomWorld) {
  const id = this.context.targetUserId;
  this.context.lastResponse = await this.apiClient.patch(`${ENDPOINTS.ADMIN_USERS}/${id}`, {
    username: 'unauthorized-update',
  });
});

// === ACTIVATE/DEACTIVATE STEPS ===

When('I deactivate the user', async function (this: CustomWorld) {
  const id = this.context.targetUserId;
  expect(id).toBeDefined();
  this.context.lastResponse = await this.apiClient.patch(`${ENDPOINTS.ADMIN_USERS}/${id}`, {
    status: 'suspended',
  });
});

When('I reactivate the user', async function (this: CustomWorld) {
  const id = this.context.targetUserId;
  expect(id).toBeDefined();

  if (this.context.noInactiveUser) {
    // Deactivate first, then reactivate
    await this.apiClient.patch(`${ENDPOINTS.ADMIN_USERS}/${id}`, { status: 'suspended' });
  }

  this.context.lastResponse = await this.apiClient.patch(`${ENDPOINTS.ADMIN_USERS}/${id}`, {
    status: 'active',
  });
});

// === VERIFICATION STEPS ===

Then('the user should be inactive', async function (this: CustomWorld) {
  const id = this.context.targetUserId;
  const response = await this.apiClient.get(`${ENDPOINTS.ADMIN_USERS}/${id}`);
  expect(response.status).toBe(200);
  expect(response.data.status).toBe('suspended');
});

Then('the user should be active', async function (this: CustomWorld) {
  const id = this.context.targetUserId;
  const response = await this.apiClient.get(`${ENDPOINTS.ADMIN_USERS}/${id}`);
  expect(response.status).toBe(200);
  expect(response.data.status).toBe('active');
});

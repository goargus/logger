import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';
import { ENDPOINTS } from '../../support/api/api-client';
import { parseDataTable } from '../../support/step-helpers';

// === READ STEPS ===

When('I request my visible entities', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.ENTITIES);
});

When('I request my profile', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.ME);
});

When('I request the entity by id', async function (this: CustomWorld) {
  const id = this.context.entityId;
  expect(id).toBeDefined();
  this.context.lastResponse = await this.apiClient.get(`${ENDPOINTS.ENTITIES}/${id}`);
});

// === HIERARCHY STEPS ===

When('I request the entity tree', async function (this: CustomWorld) {
  const id = this.context.entityId;
  expect(id).toBeDefined();
  this.context.lastResponse = await this.apiClient.get(`${ENDPOINTS.ENTITIES}/${id}/tree`);
});

When('I request the entity descendants', async function (this: CustomWorld) {
  const id = this.context.entityId;
  expect(id).toBeDefined();
  this.context.lastResponse = await this.apiClient.get(`${ENDPOINTS.ENTITIES}/${id}/descendants`);
});

When('I request the entity children', async function (this: CustomWorld) {
  const id = this.context.entityId;
  expect(id).toBeDefined();
  this.context.lastResponse = await this.apiClient.get(`${ENDPOINTS.ENTITIES}/${id}/children`);
});

// === SETUP STEPS ===

Given('I have an entity ID', async function (this: CustomWorld) {
  const meResponse = await this.apiClient.get(ENDPOINTS.ME);
  expect(meResponse.status).toBe(200);
  this.context.entityId = meResponse.data.primary_entity?.id;
  expect(this.context.entityId).toBeDefined();
});

Given('I have an entity with children', async function (this: CustomWorld) {
  const meResponse = await this.apiClient.get(ENDPOINTS.ME);
  expect(meResponse.status).toBe(200);

  const entityId = meResponse.data.primary_entity?.id;
  expect(entityId).toBeDefined();

  // Check if entity has children
  const childrenResponse = await this.apiClient.get(`${ENDPOINTS.ENTITIES}/${entityId}/children`);
  if (childrenResponse.status === 200 && childrenResponse.data?.length > 0) {
    this.context.entityId = entityId;
    this.context.hasChildren = true;
  } else {
    // Try to find a parent entity with children
    const entitiesResponse = await this.apiClient.get(ENDPOINTS.ENTITIES);
    if (entitiesResponse.status === 200) {
      for (const entity of entitiesResponse.data) {
        const checkChildren = await this.apiClient.get(
          `${ENDPOINTS.ENTITIES}/${entity.id}/children`,
        );
        if (checkChildren.status === 200 && checkChildren.data?.length > 0) {
          this.context.entityId = entity.id;
          this.context.hasChildren = true;
          return;
        }
      }
    }
    this.context.entityId = entityId;
    this.context.hasChildren = false;
  }
});

Given('I have a parent entity', async function (this: CustomWorld) {
  const meResponse = await this.apiClient.get(ENDPOINTS.ME);
  expect(meResponse.status).toBe(200);
  this.context.parentEntityId = meResponse.data.primary_entity?.id;
  expect(this.context.parentEntityId).toBeDefined();
});

Given('I have a parent entity ID', async function (this: CustomWorld) {
  const meResponse = await this.apiClient.get(ENDPOINTS.ME);
  expect(meResponse.status).toBe(200);
  this.context.parentEntityId = meResponse.data.primary_entity?.id;
});

// === CREATE STEPS ===

When('I create a child entity with:', async function (this: CustomWorld, table: DataTable) {
  const data = parseDataTable(table);
  data.parentId = this.context.parentEntityId;

  // Backend route: POST /entities/:type (type as route param)
  const entityType = data.entityType || 'FIELD';
  delete data.entityType;

  this.context.lastResponse = await this.apiClient.post(`${ENDPOINTS.ENTITIES}/${entityType}`, data);

  if (this.context.lastResponse.status === 201) {
    this.context.createdEntityId = this.context.lastResponse.data.id;
  }
});

When('I try to create a child entity', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.post(`${ENDPOINTS.ENTITIES}/FIELD`, {
    name: 'Unauthorized Entity',
    parentId: this.context.parentEntityId,
  });
});

When('I create an entity without parent:', async function (this: CustomWorld, table: DataTable) {
  const data = parseDataTable(table);
  const entityType = data.entityType || 'ASSOCIATION';
  delete data.entityType;
  // Explicitly not setting parentId
  this.context.lastResponse = await this.apiClient.post(`${ENDPOINTS.ENTITIES}/${entityType}`, data);
});

// === UPDATE STEPS ===

When('I update the entity with:', async function (this: CustomWorld, table: DataTable) {
  const data = parseDataTable(table);
  const id = this.context.entityId;
  expect(id).toBeDefined();

  this.context.lastResponse = await this.apiClient.patch(`${ENDPOINTS.ENTITIES}/${id}`, data);
});

When('I try to update the entity', async function (this: CustomWorld) {
  const id = this.context.entityId;
  this.context.lastResponse = await this.apiClient.patch(`${ENDPOINTS.ENTITIES}/${id}`, {
    name: 'Unauthorized Update',
  });
});

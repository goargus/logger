import { When } from '@cucumber/cucumber';
import { CustomWorld } from '../../support/world';
import { ENDPOINTS } from '../../support/api/api-client';

When('I request the list of activity types', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.ACTIVITY_TYPES);
});

When('I request my authorized activity types', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.ACTIVITY_TYPES_AUTHORIZED);
});

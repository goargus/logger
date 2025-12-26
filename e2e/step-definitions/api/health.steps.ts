import { When } from '@cucumber/cucumber';
import { CustomWorld } from '../../support/world';
import { ENDPOINTS } from '../../support/api/api-client';

When('I request the health endpoint', async function (this: CustomWorld) {
  this.context.lastResponse = await this.apiClient.get(ENDPOINTS.HEALTH);
});

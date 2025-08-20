import { ActivityTypeUsagePolicy } from './activity-type-usage.policy';

export class NullActivityTypeUsagePolicy implements ActivityTypeUsagePolicy {
  async isInUse(_activityTypeId: string): Promise<boolean> {
    return false;
  }
}

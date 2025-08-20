export const ACTIVITY_TYPE_USAGE_POLICY = Symbol('ACTIVITY_TYPE_USAGE_POLICY');

export interface ActivityTypeUsagePolicy {
  isInUse(activityTypeId: string): Promise<boolean>;
}

/**
 * Permission enum - defines all granular permissions in the system.
 * Follows the pattern: {resource}:{action}:{scope}
 *
 * Resources: activity, report, entity, user, role, activity-type, reporting-period, system
 * Actions: create, read, update, delete, view, manage
 * Scope: own (self only), hierarchy (entity and children), all (global)
 */
export enum Permission {
  // Activity permissions
  ACTIVITY_CREATE_OWN = 'activity:create:own',
  ACTIVITY_READ_OWN = 'activity:read:own',
  ACTIVITY_UPDATE_OWN = 'activity:update:own',
  ACTIVITY_DELETE_OWN = 'activity:delete:own',
  ACTIVITY_READ_HIERARCHY = 'activity:read:hierarchy',
  ACTIVITY_MANAGE_HIERARCHY = 'activity:manage:hierarchy',

  // Report permissions
  REPORT_VIEW_HIERARCHY = 'report:view:hierarchy',

  // Entity permissions
  ENTITY_READ = 'entity:read',
  ENTITY_READ_HIERARCHY = 'entity:read:hierarchy',
  ENTITY_UPDATE_OWN = 'entity:update:own',

  // User permissions
  USER_READ_OWN = 'user:read:own',
  USER_READ_HIERARCHY = 'user:read:hierarchy',
  USER_UPDATE_HIERARCHY = 'user:update:hierarchy',

  // Role permissions
  ROLE_READ = 'role:read',

  // Activity Type permissions
  ACTIVITY_TYPE_READ = 'activity-type:read',

  // Reporting Period permissions
  REPORTING_PERIOD_READ = 'reporting-period:read',
  REPORTING_PERIOD_READ_HIERARCHY = 'reporting-period:read:hierarchy',

  // System permissions
  SYSTEM_ADMIN = 'system:admin',
}

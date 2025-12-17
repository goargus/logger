/**
 * Shared role name constants to ensure consistency across the application.
 * Update these constants when adding, removing, or renaming roles.
 */

/**
 * Roles that can view reports across their hierarchy
 */
export const LEADERSHIP_ROLES = [
  'System Admin',
  'Union President',
  'Association President',
  'Field Director',
  'Union Secretary',
  'Association Secretary',
  'Field Secretary',
] as const;

/**
 * Roles that can create and manage their own activities
 */
export const MISSIONARY_ROLES = [
  'Missionary',
  'Field Secretary',
  'Association Secretary',
] as const;

/**
 * Executive roles with entity management permissions
 */
export const EXECUTIVE_ROLES = [
  'Union President',
  'Association President',
  'Field Director',
] as const;

/**
 * Secretary roles with extended activity management permissions
 */
export const SECRETARY_ROLES = [
  'Union Secretary',
  'Association Secretary',
  'Field Secretary',
] as const;

/**
 * System administrator role
 */
export const SYSTEM_ADMIN_ROLE = 'System Admin' as const;

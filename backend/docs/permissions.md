# Permissions System

This document describes the Role-Based Access Control (RBAC) permission system used in the Secretary application.

## Overview

The permission system follows NIST RBAC best practices:

- **Permissions** are defined in code as an enum (`Permission`)
- **Roles** are stored in the database with associated permissions
- **Users** are assigned roles, and permissions are derived from those roles
- **Hierarchy-aware**: Some permissions respect the organizational entity hierarchy

## Permission Naming Convention

Permissions follow the pattern: `{resource}:{action}:{scope}`

- **resource**: The entity being accessed (e.g., `activity`, `report`, `user`)
- **action**: The operation being performed (e.g., `create`, `read`, `update`, `delete`, `manage`)
- **scope**: The access scope (e.g., `own`, `hierarchy`)

### Scopes

| Scope | Description |
|-------|-------------|
| `own` | User can only access their own resources |
| `hierarchy` | User can access resources within their entity hierarchy (their entity and all descendants) |
| *(none)* | Global access to the resource type |

## All Permissions

### Activity Permissions

| Permission | Value | Description |
|------------|-------|-------------|
| `ACTIVITY_CREATE_OWN` | `activity:create:own` | Create activities for oneself |
| `ACTIVITY_READ_OWN` | `activity:read:own` | View own activities |
| `ACTIVITY_UPDATE_OWN` | `activity:update:own` | Edit own activities |
| `ACTIVITY_DELETE_OWN` | `activity:delete:own` | Delete own activities |
| `ACTIVITY_READ_HIERARCHY` | `activity:read:hierarchy` | View activities within entity hierarchy |
| `ACTIVITY_MANAGE_HIERARCHY` | `activity:manage:hierarchy` | Full CRUD on activities within entity hierarchy |

### Report Permissions

| Permission | Value | Description |
|------------|-------|-------------|
| `REPORT_VIEW_HIERARCHY` | `report:view:hierarchy` | View reports for entities within hierarchy |

### Entity Permissions

| Permission | Value | Description |
|------------|-------|-------------|
| `ENTITY_READ` | `entity:read` | Read basic entity information |
| `ENTITY_READ_HIERARCHY` | `entity:read:hierarchy` | Read entities within hierarchy |
| `ENTITY_UPDATE_OWN` | `entity:update:own` | Update own entity's information |

### User Permissions

| Permission | Value | Description |
|------------|-------|-------------|
| `USER_READ_OWN` | `user:read:own` | View own user profile |
| `USER_READ_HIERARCHY` | `user:read:hierarchy` | View users within entity hierarchy |
| `USER_UPDATE_HIERARCHY` | `user:update:hierarchy` | Update users within entity hierarchy |

### Role Permissions

| Permission | Value | Description |
|------------|-------|-------------|
| `ROLE_READ` | `role:read` | View available roles |

### Activity Type Permissions

| Permission | Value | Description |
|------------|-------|-------------|
| `ACTIVITY_TYPE_READ` | `activity-type:read` | View activity types |

### Reporting Period Permissions

| Permission | Value | Description |
|------------|-------|-------------|
| `REPORTING_PERIOD_READ` | `reporting-period:read` | View reporting periods |
| `REPORTING_PERIOD_READ_HIERARCHY` | `reporting-period:read:hierarchy` | View reporting periods within hierarchy |

### System Permissions

| Permission | Value | Description |
|------------|-------|-------------|
| `SYSTEM_ADMIN` | `system:admin` | Full system access (superuser) |

## Role Permission Sets

### System Admin
Roles: `System Admin`, `admin`

Has the `SYSTEM_ADMIN` permission which grants full access to all system functions.

### Leadership (Presidents/Directors)
Roles: `Union President`, `Association President`, `Field Director`

| Permission |
|------------|
| `REPORT_VIEW_HIERARCHY` |
| `ACTIVITY_READ_HIERARCHY` |
| `ENTITY_READ_HIERARCHY` |
| `USER_READ_HIERARCHY` |
| `REPORTING_PERIOD_READ_HIERARCHY` |
| `ROLE_READ` |
| `ACTIVITY_TYPE_READ` |

### Secretary
Roles: `Union Secretary`, `Association Secretary`, `Field Secretary`

Includes all Leadership permissions plus:

| Additional Permission |
|----------------------|
| `ACTIVITY_MANAGE_HIERARCHY` |
| `ENTITY_UPDATE_OWN` |
| `USER_UPDATE_HIERARCHY` |

### Missionary (Field Workers)
Roles: `Missionary`, `Ministro`, `Anciano`, `Obreros`, `Director de Obra Misionera`, `Director de Asistencia Social`, `Director de Salud`, `Director de Jóvenes`, `Secretario`

| Permission |
|------------|
| `ACTIVITY_CREATE_OWN` |
| `ACTIVITY_READ_OWN` |
| `ACTIVITY_UPDATE_OWN` |
| `ACTIVITY_DELETE_OWN` |
| `USER_READ_OWN` |
| `ACTIVITY_TYPE_READ` |
| `ENTITY_READ` |
| `REPORTING_PERIOD_READ` |

## Database Schema

### role_permissions Table

```sql
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role_id, permission)
);
```

### Querying Permissions

Get all permissions for a role:
```sql
SELECT permission
FROM role_permissions
WHERE role_id = '<role-uuid>';
```

Get all permissions for a user (via role assignments):
```sql
SELECT DISTINCT rp.permission, ura.entity_id
FROM user_role_assignments ura
JOIN role_permissions rp ON ura.role_id = rp.role_id
WHERE ura.user_id = '<user-uuid>'
  AND ura.start_date <= CURRENT_DATE
  AND ura.end_date >= CURRENT_DATE;
```

## API Usage

### PermissionsService

The `PermissionsService` provides methods to check permissions:

```typescript
// Check if user has a specific permission
const canView = await permissionsService.userHasPermission(
  userId,
  Permission.REPORT_VIEW_HIERARCHY
);

// Get all permissions for a role
const permissions = await permissionsService.getPermissionsForRole(roleId);

// Get effective permissions for user (Map<entityId, Set<permissions>>)
const permMap = await permissionsService.getEffectivePermissionsForUser(userId);
```

### Guards

Use the `@Roles()` decorator with `RolesGuard` to protect endpoints:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')  // Requires SYSTEM_ADMIN permission
@Get('admin-only')
adminEndpoint() { ... }
```

### SYSTEM_ADMIN Behavior

Users with `SYSTEM_ADMIN` permission bypass all permission checks and have full access to all resources.

## Migration from Boolean Flags

The previous system used boolean flags on the Role entity:

| Old Flag | New Permission(s) |
|----------|-------------------|
| `canManageOwnActivities` | `ACTIVITY_CREATE_OWN`, `ACTIVITY_READ_OWN`, `ACTIVITY_UPDATE_OWN`, `ACTIVITY_DELETE_OWN`, `USER_READ_OWN`, `ACTIVITY_TYPE_READ`, `ENTITY_READ`, `REPORTING_PERIOD_READ` |
| `canViewReports` | `REPORT_VIEW_HIERARCHY`, `ACTIVITY_READ_HIERARCHY`, `ENTITY_READ_HIERARCHY`, `USER_READ_HIERARCHY`, `REPORTING_PERIOD_READ_HIERARCHY` |
| `canManageHierarchyActivities` | `ACTIVITY_MANAGE_HIERARCHY`, `ACTIVITY_READ_HIERARCHY`, `ENTITY_READ_HIERARCHY`, `USER_READ_HIERARCHY` |
| `canManageEntities` | `ENTITY_READ_HIERARCHY`, `ENTITY_UPDATE_OWN`, `USER_READ_HIERARCHY`, `USER_UPDATE_HIERARCHY`, `ROLE_READ` |
| `isSystemAdmin` | `SYSTEM_ADMIN` |

## Source Files

- Permission enum: `src/auth/permissions/permission.enum.ts`
- Permissions service: `src/auth/permissions/permissions.service.ts`
- Role-Permission entity: `src/roles/role-permission.entity.ts`
- Role entity: `src/roles/role.entity.ts`
- Seed script: `scripts/seed-roles-and-activities.ts`

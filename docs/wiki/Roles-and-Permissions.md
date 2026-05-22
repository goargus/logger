# Roles and Permissions

## Model

Permissions are stored as explicit values and attached to roles. Users gain effective access through role assignments scoped to entities.

Relevant backend pieces:

- `backend/src/auth/permissions/permission.enum.ts`
- `backend/src/auth/permissions/permissions.service.ts`
- `backend/src/roles/role-permission.entity.ts`
- `backend/src/roles/user-role-assignment.entity.ts`

## Scope model

Permission names follow:

`resource:action:scope`

Examples:

- `activity:create:own`
- `activity:read:hierarchy`
- `report:view:hierarchy`
- `system:admin`

The practical scopes are:

- `own`
- `hierarchy`
- global, where no suffix is needed

## Effective access rules

- A user may access their own records when they hold the required `own` permissions.
- Leadership and secretary roles are expected to access data within their entity hierarchy.
- Admin users bypass ordinary permission boundaries through `system:admin`.
- Entity-scoped access is enforced both by permissions and by ability checks on specific resources.

## Seeded permission patterns

The seed script groups permissions into three broad families:

- **System admin**: full access
- **Leadership**: view reports and hierarchy-scoped data
- **Secretary**: leadership access plus hierarchy activity management and user/entity updates
- **Missionary-style roles**: manage own activity data and read the minimum supporting records

## Role assignment lifecycle

Role assignments are first-class records. Current routes support:

- creation
- bulk creation
- listing
- update of assignment end dates
- deletion

This means access can change over time without rewriting the role definitions themselves.

## Operational advice

- Keep roles small and permission-driven
- Prefer changing assignments over creating near-duplicate roles
- Treat entity scope as the main containment boundary
- Reserve `system:admin` for a very small set of maintainers

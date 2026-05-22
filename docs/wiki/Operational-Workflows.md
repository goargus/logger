# Operational Workflows

## 1. Bootstrap a new environment

Typical order:

1. Provision infrastructure and database access.
2. Run backend migrations.
3. Bootstrap the first admin identity.
4. Seed roles and activity types if needed.
5. Seed the hierarchy if you want the Honduras example structure.
6. Configure frontend and identity provider callback settings.

## 2. Bootstrap the first admin

The backend includes:

```bash
cd backend
npm run admin:bootstrap
```

This depends on:

- Database connectivity
- `ADMIN_EMAIL`
- `ADMIN_USERNAME`
- `ADMIN_IDP_ISSUER`
- `ADMIN_IDP_SUBJECT`

Use this to create the first local user record linked to a known external identity.

## 3. Configure the organization hierarchy

Entities are managed through the `entities` endpoints and are constrained to this shape:

`PLATFORM -> UNION -> ASSOCIATION -> FIELD`

Useful routes:

- `POST /entities/:type`
- `GET /entities`
- `GET /entities/hierarchy/valid-parents?type=FIELD`
- `GET /entities/:id/children`
- `GET /entities/:id/descendants`
- `GET /entities/:id/tree`
- `PATCH /entities/:id/activate`
- `PATCH /entities/:id/deactivate`

## 4. Create roles and role assignments

Useful routes:

- `POST /roles`
- `GET /roles`
- `POST /roles/assign`
- `POST /roles/assign/bulk`
- `GET /roles/user-assignments/:userId`
- `GET /roles/assignments`
- `PATCH /roles/assignments/:id`

Role assignments are entity-scoped, so the same user can hold different responsibilities in different branches of the hierarchy.

## 5. Configure activity types

Useful routes:

- `GET /activity-types`
- `GET /activity-types/authorized`
- `GET /activity-types/user-roles/me`
- `GET /activity-types/by-role/:roleId`
- `POST /activity-types`
- `PUT /activity-types/:id`
- `DELETE /activity-types/:id`

The seed script creates a large Spanish-language catalog mapped to role types such as missionary, minister, elder, and secretariat roles.

## 6. Operate date availability and locks

The current reporting model is date-availability based.

Useful routes:

- `GET /periods/availability?month=YYYY-MM`
- `PATCH /periods/admin-lock`
- `DELETE /periods/admin-lock/:entityId`
- `POST /periods/exceptions`
- `DELETE /periods/exceptions/:id`

Use admin locks to stop edits for an entity after a cutoff date.

Use exceptions when an individual user needs a temporary correction window without reopening the whole entity.

## 7. Review reports

Useful routes:

- `GET /reports/summary`
- `GET /reports/breakdowns`
- `GET /reports/engagement`
- `GET /reports/trends`
- `GET /reports/comparison`
- `GET /reports/rankings`
- `GET /reports/expenses`
- `GET /reports/users`
- `GET /reports/user/:targetUserId/activities`
- `GET /reports/export`

Use the E2E journey files in `e2e/features/journeys/` as realistic examples of how admins, pastors, leaders, and missionaries are expected to use the system.

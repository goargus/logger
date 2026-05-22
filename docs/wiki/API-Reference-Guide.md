# API Reference Guide

## Swagger

The authoritative interactive API documentation is exposed by the backend at:

```text
/api/docs
```

When running locally, that is usually:

```text
http://localhost:3000/api/docs
```

## Current route groups

### Health

- `GET /`
- `GET /health`
- `GET /admin/health`

### Auth

- `POST /auth/link-identity`

The backend does not expose a local username/password login flow. Authentication is expected to happen through the configured external identity provider, with JWTs sent to the API.

### Users

- `GET /users/me`
- `POST /admin/users`
- `GET /admin/users`
- `GET /admin/users/:id`
- `PATCH /admin/users/:id`

### Entities

- `POST /entities/:type`
- `GET /entities`
- `GET /entities/:id`
- `PATCH /entities/:id`
- `DELETE /entities/:id`
- `GET /entities/hierarchy/valid-parents`
- `GET /entities/:id/children`
- `GET /entities/:id/descendants`
- `GET /entities/:id/tree`
- `PATCH /entities/:id/deactivate`
- `PATCH /entities/:id/activate`

### Roles and assignments

- `GET /roles/users-by-role`
- `GET /roles/users-by-entity/:entityId`
- `POST /roles/assign`
- `DELETE /roles/assign`
- `POST /roles/assign/bulk`
- `GET /roles/user-entities-by-role`
- `GET /roles/user-assignments/:userId`
- `POST /roles`
- `GET /roles`
- `GET /roles/id/:id`
- `PATCH /roles/:id`
- `DELETE /roles/:id`
- `GET /roles/assignments`
- `GET /roles/assignments/:id`
- `PATCH /roles/assignments/:id`
- `DELETE /roles/assignments/:id`

### Activity types

- `GET /activity-types`
- `GET /activity-types/authorized`
- `GET /activity-types/user-roles/me`
- `GET /activity-types/by-role/:roleId`
- `GET /activity-types/:id`
- `POST /activity-types`
- `PUT /activity-types/:id`
- `DELETE /activity-types/:id`

### Activities

- `POST /activities`
- `GET /activities`
- `GET /activities/stats/monthly-expenses`
- `GET /activities/:id`
- `PATCH /activities/:id`
- `DELETE /activities/:id`

### Periods

- `GET /periods/availability`
- `PATCH /periods/admin-lock`
- `DELETE /periods/admin-lock/:entityId`
- `POST /periods/exceptions`
- `DELETE /periods/exceptions/:id`

### Reports

- `GET /reports/summary`
- `GET /reports/breakdowns`
- `GET /reports/engagement`
- `GET /reports/trends`
- `GET /reports/comparison`
- `GET /reports/rankings`
- `GET /reports/expenses`
- `GET /reports/user/:targetUserId/activities`
- `GET /reports/users`
- `GET /reports/export`

### Admin

- `GET /admin/dashboard`

## Documentation policy

- Use Swagger for request and response detail
- Use this wiki for operational intent and route grouping
- If Swagger and a wiki page disagree, trust the code and update the wiki

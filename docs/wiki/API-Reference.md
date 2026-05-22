# API Reference

Logger is an application, not a reusable package with a public import API. The most important interfaces are its HTTP endpoints, backend modules, and frontend service layers.

## HTTP API overview

The interactive contract is exposed through Swagger:

```text
http://localhost:3000/api/docs
```

Use Swagger for exact request and response schemas. This page documents the available interface groups and how they are meant to be used.

## Backend route groups

| Route group | Purpose |
| --- | --- |
| `/` and `/health` | Basic service verification |
| `/auth` | Identity linking |
| `/users` and `/admin/users` | Current-user and admin user operations |
| `/entities` | Hierarchy management |
| `/roles` | Roles and assignments |
| `/activity-types` | Authorized activity types and catalog management |
| `/activities` | Activity CRUD and expense summary |
| `/periods` | Date availability, admin locks, exceptions |
| `/reports` | Reporting, rankings, exports, and user activity views |
| `/admin` | Admin dashboard route |

## Selected internal interfaces

### Backend modules

These are the main backend integration boundaries for maintainers:

| Module | Responsibility |
| --- | --- |
| `ActivitiesModule` | Activity write and read flows |
| `ActivityTypesModule` | Activity type catalog and authorization filtering |
| `EntitiesModule` | Hierarchy CRUD and traversal |
| `RolesModule` | Role CRUD and assignment lifecycle |
| `ReportsModule` | Report calculations and exports |
| `PeriodsModule` | Date availability and lock controls |

### Frontend service layer

The frontend exposes service classes under `frontend/lib/services/` such as:

- `activity.dart`
- `activity_type.dart`
- `dashboard_stats_service.dart`
- `entity_service.dart`
- `periods_service.dart`
- `reports_service.dart`
- `user.dart`

These services are the main frontend abstraction over HTTP calls.

> Status: To be confirmed.
>
> A full method-by-method service reference would require dedicated extraction from each service file and is not yet generated automatically in this repository.

## Endpoint reference by area

### Health

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/` | Root endpoint |
| `GET` | `/health` | Primary health endpoint |
| `GET` | `/admin/health` | Admin health endpoint |

### Auth

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/auth/link-identity` | Admin-only identity linking |

### Users

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/users/me` | Returns current resolved user |
| `POST` | `/admin/users` | Admin create user |
| `GET` | `/admin/users` | Admin list users |
| `GET` | `/admin/users/:id` | Admin get user |
| `PATCH` | `/admin/users/:id` | Admin update user |

### Entities

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/entities/:type` | Create entity by type |
| `GET` | `/entities` | List entities |
| `GET` | `/entities/:id` | Get entity |
| `PATCH` | `/entities/:id` | Update entity |
| `DELETE` | `/entities/:id` | Delete entity |
| `GET` | `/entities/hierarchy/valid-parents` | Query valid parent entities |
| `GET` | `/entities/:id/children` | Direct children |
| `GET` | `/entities/:id/descendants` | Recursive descendants |
| `GET` | `/entities/:id/tree` | Nested tree |
| `PATCH` | `/entities/:id/deactivate` | Deactivate entity |
| `PATCH` | `/entities/:id/activate` | Activate entity |

### Roles

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/roles/users-by-role` | Filter users by role |
| `GET` | `/roles/users-by-entity/:entityId` | Filter users by entity |
| `POST` | `/roles/assign` | Assign a role |
| `DELETE` | `/roles/assign` | Remove a role assignment |
| `POST` | `/roles/assign/bulk` | Bulk assignment |
| `GET` | `/roles/user-entities-by-role` | Query user entities by role |
| `GET` | `/roles/user-assignments/:userId` | List assignments for a user |
| `POST` | `/roles` | Create role |
| `GET` | `/roles` | List roles |
| `GET` | `/roles/id/:id` | Get role by ID |
| `PATCH` | `/roles/:id` | Update role |
| `DELETE` | `/roles/:id` | Delete role |
| `GET` | `/roles/assignments` | List assignments |
| `GET` | `/roles/assignments/:id` | Get assignment |
| `PATCH` | `/roles/assignments/:id` | Update assignment |
| `DELETE` | `/roles/assignments/:id` | Delete assignment |

### Activity types

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/activity-types` | List activity types |
| `GET` | `/activity-types/authorized` | Types authorized for current user |
| `GET` | `/activity-types/user-roles/me` | Current user roles for activity type logic |
| `GET` | `/activity-types/by-role/:roleId` | Activity types for a role |
| `GET` | `/activity-types/:id` | Get activity type |
| `POST` | `/activity-types` | Create activity type |
| `PUT` | `/activity-types/:id` | Update activity type |
| `DELETE` | `/activity-types/:id` | Delete activity type |

### Activities

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/activities` | Create activity |
| `GET` | `/activities` | List current user activities |
| `GET` | `/activities/stats/monthly-expenses` | Monthly expense total |
| `GET` | `/activities/:id` | Get activity |
| `PATCH` | `/activities/:id` | Update activity |
| `DELETE` | `/activities/:id` | Archive activity, requires `confirm=true` |

### Periods

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/periods/availability` | Availability by month |
| `PATCH` | `/periods/admin-lock` | Set admin lock |
| `DELETE` | `/periods/admin-lock/:entityId` | Remove admin lock |
| `POST` | `/periods/exceptions` | Grant exception |
| `DELETE` | `/periods/exceptions/:id` | Revoke exception |

### Reports

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/reports/summary` | Summary metrics |
| `GET` | `/reports/breakdowns` | Breakdown metrics |
| `GET` | `/reports/engagement` | Active vs inactive user report |
| `GET` | `/reports/trends` | Multi-period trend report |
| `GET` | `/reports/comparison` | Current vs previous comparison |
| `GET` | `/reports/rankings` | Rankings and compliance views |
| `GET` | `/reports/expenses` | Expense breakdowns |
| `GET` | `/reports/user/:targetUserId/activities` | Hierarchy-scoped user activity view |
| `GET` | `/reports/users` | Paginated users report |
| `GET` | `/reports/export` | CSV or JSON export |

## Usage notes

- treat Swagger as the canonical schema reference
- use authenticated requests for all protected routes
- expect hierarchy and role scope to affect visible data
- prefer adding new route documentation here only after the controller and Swagger annotations exist

# System Overview

Logger is a full-stack system for recording ministry and administrative activity across a hierarchical organization.

## Main components

- **Backend**: NestJS + TypeScript API in `backend/`
- **Frontend**: Flutter web client in `frontend/`
- **Database**: PostgreSQL with TypeORM migrations
- **Identity**: Auth0 JWT validation plus Entra ID configuration inputs
- **Infrastructure**: Terraform for Azure Container Apps, PostgreSQL, networking, monitoring, and DNS

## Monorepo structure

- `backend/src/activities-type`: activity type catalog and authorization filters
- `backend/src/activity`: activity creation, listing, updates, soft-delete, expense tracking
- `backend/src/entities`: organizational hierarchy management
- `backend/src/roles`: role definitions, assignments, and permission linkage
- `backend/src/reports`: summaries, breakdowns, exports, rankings, trends, expenses
- `backend/src/periods`: date availability, admin locks, and exceptions
- `backend/src/auth` and `backend/src/casl`: authentication and authorization

## Core domain

### Entity hierarchy

The hierarchy is:

`PLATFORM -> UNION -> ASSOCIATION -> FIELD`

Permissions and reporting visibility follow that tree.

### Users and roles

Users are local application records linked to external identities. Access is derived from role assignments that are scoped to specific entities.

### Activities

Activities are the main operational records. They belong to a user, an entity context, an activity type, and a date. Some report views also include expense totals.

### Period locking model

The current implementation is not based on CRUD `reporting-periods` resources. Instead, the `periods` module exposes:

- `GET /periods/availability`
- `PATCH /periods/admin-lock`
- `DELETE /periods/admin-lock/:entityId`
- `POST /periods/exceptions`
- `DELETE /periods/exceptions/:id`

Those endpoints determine whether a date is open for activity entry, and whether admins have manually locked or excepted ranges.

## Environment model

- `develop`: frontend deploy workflow for development
- `main`: backend production deploy and frontend production deploy

The repository is `goargus/logger`, even though the local checkout directory is `secretary-backend`.

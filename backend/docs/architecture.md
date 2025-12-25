# Architecture Overview

The Secretary backend is a NestJS application implementing a modular, domain-driven architecture.

## Technology Stack

- **Framework**: NestJS (Node.js + TypeScript)
- **Database**: PostgreSQL 15 with TypeORM
- **Authentication**: Auth0 JWT with JWKS validation
- **Authorization**: CASL for attribute-based access control
- **Documentation**: Swagger/OpenAPI

## Module Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer                                 │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │Activities│ │   Entities │ │  Reports │ │ReportingPeriods  │ │
│  └──────────┘ └────────────┘ └──────────┘ └──────────────────┘ │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Users   │ │    Roles   │ │   Admin  │ │ Activity Types   │ │
│  └──────────┘ └────────────┘ └──────────┘ └──────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                     Service Layer                                │
│  Business logic, validation, domain rules                        │
├─────────────────────────────────────────────────────────────────┤
│                    Security Layer                                │
│  ┌──────────────────┐ ┌─────────────────────────────────────┐  │
│  │   Auth (JWT)     │ │         CASL (Authorization)        │  │
│  │  - JwtStrategy   │ │  - PoliciesGuard                    │  │
│  │  - JwtAuthGuard  │ │  - Ability factory                  │  │
│  │  - RolesGuard    │ │  - Entity-scoped permissions        │  │
│  └──────────────────┘ └─────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                   Data Access Layer                              │
│  TypeORM entities, repositories, migrations                      │
├─────────────────────────────────────────────────────────────────┤
│                      PostgreSQL                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Module Responsibilities

### Core Modules

| Module | Purpose |
|--------|---------|
| `entities` | Organizational hierarchy (Platform > Union > Association > Field) |
| `users` | User profiles and entity associations |
| `roles` | Role definitions and user-role assignments |
| `activities` | Activity tracking and CRUD operations |
| `activity-types` | Activity type definitions with role-based visibility |
| `reporting-periods` | Time-bounded periods with automatic locking |
| `reports` | Analytics, summaries, compliance reports |

### Infrastructure Modules

| Module | Purpose |
|--------|---------|
| `auth` | JWT validation, identity resolution, Auth0 integration |
| `casl` | CASL ability factory, policies guard, permission checks |
| `admin` | Administrative endpoints and bootstrap scripts |

## Authentication Flow

```
┌──────────┐     ┌─────────┐     ┌─────────────┐     ┌──────────────┐
│  Client  │────>│  Auth0  │────>│ JWT Token   │────>│   Backend    │
└──────────┘     └─────────┘     └─────────────┘     └──────────────┘
                                                            │
                                       ┌────────────────────┼────────────────────┐
                                       │                    │                    │
                                       v                    v                    v
                               ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
                               │ JwtStrategy   │   │ Identity      │   │ CASL Ability  │
                               │ validates JWT │   │ Resolution    │   │ Factory       │
                               └───────────────┘   └───────────────┘   └───────────────┘
```

1. User authenticates via Auth0
2. Client receives JWT token
3. Client includes token in Authorization header
4. `JwtStrategy` validates token using JWKS
5. `IdentityResolutionService` maps IDP subject to local user
6. `CaslAbilityFactory` builds user permissions from role assignments
7. `PoliciesGuard` enforces permissions per endpoint

## Authorization Model

The system uses CASL for attribute-based access control (ABAC):

- **Subjects**: Entity, User, Activity, ReportingPeriod, etc.
- **Actions**: Create, Read, Update, Delete, Manage
- **Conditions**: Entity-scoped (users can only access their entity and children)

```typescript
// Example: User can update activities in their entity scope
ability.can(Action.Update, Activity, { entityId: { $in: userEntityIds } })
```

## Scheduled Tasks

The application uses NestJS Schedule for automated jobs:

| Job | Schedule | Purpose |
|-----|----------|---------|
| `lockExpiredPeriods` | Daily at midnight | Transitions expired reporting periods to locked status |

## Database Design Patterns

- **Soft deletes**: `is_active` flags instead of hard deletes
- **Audit trails**: `created_at`, `updated_at`, `createdBy`, `updatedBy`
- **Hierarchical data**: Self-referential entities with parent-child relationships
- **Unique constraints**: Partial indexes for business rules (e.g., one active period per entity)

## Error Handling

- Validation errors return 400 with field-level details
- Authentication failures return 401
- Authorization failures return 403 with descriptive messages
- Not found errors return 404
- Conflict errors (duplicate data) return 409

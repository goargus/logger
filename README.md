# Secretary - Activity Tracking and Reporting System

[![CI](https://github.com/goargus/secretary-backend/workflows/CI/badge.svg)](https://github.com/goargus/secretary-backend/actions/workflows/ci.yml)

A full-stack application for managing organizational activities, role-based access control, and reporting within a hierarchical organizational structure. Built for religious organizations to track missionary and administrative activities across multiple organizational levels.

## Project Overview

Secretary is a monorepo containing both backend (NestJS/TypeScript) and frontend (Flutter/Dart) applications. The system enables users with different roles to record, manage, and report on activities within a hierarchical organizational structure.

### Core Purpose

- Track activities performed by missionaries and administrators across organizational entities
- Enforce role-based access control for activity types and data visibility
- Manage time-bounded reporting periods with automatic lifecycle management
- Provide hierarchical organizational management (Platform → Union → Association → Field)
- Enable reporting and analytics based on organizational hierarchy

## Architecture

### Technology Stack

**Backend:**
- NestJS framework with TypeScript
- PostgreSQL database with TypeORM
- Auth0 for JWT-based authentication
- Scheduled tasks via @nestjs/schedule

**Frontend:**
- Flutter/Dart for web application
- Riverpod for state management
- Auth0 Flutter SDK for authentication

### Repository Structure

```
.
├── backend/                    # NestJS TypeScript backend
│   ├── src/
│   │   ├── activities-type/    # Activity type definitions
│   │   ├── activity/           # Activity CRUD and lifecycle
│   │   ├── admin/              # Administrative endpoints
│   │   ├── auth/               # Authentication and authorization
│   │   ├── entities/           # Hierarchical organizational entities
│   │   ├── idp-identities/     # Identity provider mappings
│   │   ├── reporting-periods/  # Time-bounded reporting periods
│   │   ├── roles/              # Role definitions and assignments
│   │   └── users/              # User management
│   ├── scripts/                # Database initialization and admin bootstrap
│   └── test/                   # E2E tests
├── frontend/                   # Flutter web application
│   └── lib/
│       ├── auth/               # Authentication flow
│       ├── models/             # Data models
│       ├── pages/              # UI pages
│       ├── providers/          # Riverpod providers
│       ├── services/           # API services
│       └── widgets/            # Reusable UI components
└── docker-compose.yml          # Full stack development environment
```

## Domain Model

### Core Entities

**Organizational Hierarchy:**
- **Entity**: Represents organizational units with 4 hierarchical types:
  - PLATFORM (root level)
  - UNION (top organizational unit)
  - ASSOCIATION (mid-level unit)
  - FIELD (local unit)
- Self-referential parent-child relationships
- Each entity can have multiple children and one parent

**User Management:**
- **User**: System users with authentication credentials
- **Role**: Defines user permissions (admin, pastor, missionary, etc.)
- **UserRoleAssignment**: Many-to-many relationship between users, roles, and entities
- **IdpIdentity**: Maps external identity provider subjects to local users

**Activity Tracking:**
- **Activity**: Records of activities performed by users
  - Linked to activity type, user, and reporting period
  - Supports expense tracking
  - Has lifecycle status (active/archived)
- **ActivityType**: Categorizes activities with role-based access control
  - Defines which roles can submit each activity type
  - Examples: wedding, baptism, home visit, bible study
- **ReportingPeriod**: Time-bounded periods (14 days) for activity submission
  - Status: active or locked
  - Only one active period per entity at a time
  - Automatically transitions via scheduled tasks

### Key Relationships

1. **User ↔ Role ↔ Entity**: Users can have multiple role assignments across different entities
2. **Activity → ActivityType**: Each activity belongs to one activity type
3. **Activity → ReportingPeriod**: Activities are submitted to reporting periods
4. **Activity → User**: Each activity is created by and belongs to a user
5. **ReportingPeriod → Entity**: Periods are scoped to specific entities
6. **ActivityType ↔ Role**: Activity types define allowed roles for submission

## Implementation Status

### Milestone 1: Core Project Structure (CLOSED)
- Authentication via Auth0 with JWT tokens
- Core entities: User, Role, Entity
- Basic CRUD operations for activities
- Admin user management
- Organizational hierarchy management

### Milestone 2: Organizational Logic and Role Assignments (CLOSED)
- Multiple role support per user via UserRoleAssignment
- Hierarchical entity management with validation
- Frontend state management with Riverpod
- Enhanced entity hierarchy operations
- User profile endpoint (/me)

### Milestone 3: Activity Recording and Lifecycle Management (IN PROGRESS)
**Completed:**
- ReportingPeriod entity with automatic 14-day lifecycle
- Scheduled job for automatic period transitions (daily at midnight)
- Activities linked to reporting periods with enforcement
- Period-based locking prevents edits to activities in locked periods
- Role-based activity type authorization
- Activity type filtering by user roles
- Activity lifecycle locking

**Remaining:**
- Issue #80: Historical tracking for role assignments with start/end dates
- Issue #76: Admin endpoint to view all activities with role context
- Issue #75: Activity locked indicator in response DTOs (PARTIALLY IMPLEMENTED)
- Issue #72: Activity type endpoint renamed to /authorized

### Milestone 4: Data Retrieval for Reporting (PLANNED)
- Aggregated activity views by user, role, organization, time
- Dashboard endpoints with hierarchical scoping
- Reporting endpoints respecting organizational hierarchy

### Milestone 5: Production-Ready MVP (PLANNED)
- Production deployment configuration
- HTTPS and domain setup
- Initial user onboarding
- Support materials for administrators

## API Endpoints

### Authentication
- `POST /auth/login` - Authenticate and receive JWT token

### Users
- `GET /users/me` - Get current user profile and role context
- `GET /admin/users` - List all users (admin only)
- `POST /admin/users` - Create user (admin only)
- `PATCH /admin/users/:id` - Update user (admin only)

### Entities
- `GET /entities` - List organizational entities
- `POST /entities` - Create entity (admin only)
- `PATCH /entities/:id` - Update entity (admin only)
- `GET /entities/:id` - Get entity details

### Roles
- `GET /roles` - List all roles
- `POST /roles` - Create role (admin only)

### Activity Types
- `GET /activity-types` - List all activity types
- `GET /activity-types/my-activity-types` - Get activity types for current user's role
- `POST /activity-types` - Create activity type (admin only)
- `PUT /activity-types/:id` - Update activity type (admin only)
- `DELETE /activity-types/:id` - Delete activity type (admin only)

### Activities
- `GET /activities` - List user's activities (paginated)
- `GET /activities/:id` - Get single activity
- `POST /activities` - Create activity
- `PATCH /activities/:id` - Update activity
- `DELETE /activities/:id?confirm=true` - Archive activity
- `GET /activities/stats/monthly-expenses` - Get monthly expense totals

### Reporting Periods
- `GET /reporting-periods` - List reporting periods (filter by entity)
- `GET /reporting-periods/:id` - Get reporting period details
- `POST /reporting-periods` - Create reporting period (admin only)
- `PATCH /reporting-periods/:id` - Update reporting period (admin only)
- `PATCH /reporting-periods/:id/close` - Manually close/lock period (admin only)
- `DELETE /reporting-periods/:id` - Delete period if no activities (admin only)

## Business Rules

### Activity Submission Rules
1. Activities must be submitted to the currently active reporting period
2. Users can only submit activity types they are authorized for based on their roles
3. Activities cannot be created, updated, or deleted in locked reporting periods
4. Each activity can optionally include expense information
5. Activities are soft-deleted (archived) rather than permanently removed

### Reporting Period Rules
1. Reporting periods have a fixed 14-day duration
2. Only one active period per entity at any time
3. Periods automatically transition from active to locked at end date
4. New periods are automatically created when previous period locks

### Role-Based Access Control
1. Activity types define which roles can submit them
2. Users can have multiple role assignments across different entities
3. Role assignments are scoped to specific organizational entities
4. Admin role has elevated privileges across the system

### Organizational Hierarchy Rules
1. Platform is the root level (single instance)
2. Union entities belong to Platform
3. Association entities belong to Union
4. Field entities belong to Association
5. Parent-child relationships must be maintained

## Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 15
- Docker and Docker Compose (optional)
- Flutter SDK 3.0+ (for frontend)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env  # Configure environment variables

# Database setup
npm run migration:run
npm run admin:bootstrap

# Development server
npm run start:dev
```

### Frontend Setup

```bash
cd frontend
flutter pub get
flutter run -d web-server --web-port 8080
```

### Docker Development

```bash
# Start full stack (database + backend + frontend)
docker-compose up

# Database will be on port 5433
# Backend will be on port 3000
# Frontend will be on port 8080
```

### Environment Variables

**Required:**
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`
- `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `AUTH0_ISSUER`
- `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_IDP_ISSUER`, `ADMIN_IDP_SUBJECT`

## Testing

```bash
cd backend

# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## Code Quality

```bash
cd backend

# Linting
npm run lint

# Format code
npm run format
```

## Scheduled Tasks

The application runs automated background jobs:

**Daily at Midnight:**
- Transition expired reporting periods (active → locked)
- Create new reporting periods for entities
- Uses system user ID: `00000000-0000-0000-0000-000000000000`

## Known Issues and Technical Debt

1. **Incomplete Features**:
   - Issue #72: Endpoint named `/my-activity-types` instead of `/my-authorized`
   - Issue #75: Locked indicator exists but issue remains open
   - Issue #74: Role-based validation implemented but issue not closed
   - Issue #80: Historical role assignment tracking not implemented (no start/end dates on UserRoleAssignment)
   - Issue #76: No admin endpoint to view all activities across users

2. **Database Schema**: Currently using `synchronize: true` in TypeORM, which should be disabled in production and replaced with proper migrations.

3. **User-Role Relationship**: Users have both a direct `role_id` field and separate `UserRoleAssignment` records, creating potential inconsistency.

## Contributing

For development guidelines and conventions, see [CLAUDE.md](./CLAUDE.md).

## License

UNLICENSED - Private/Proprietary

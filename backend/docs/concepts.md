# Domain Concepts

This document explains the core domain model and business rules of the Secretary system.

## Organizational Hierarchy

The system uses a hierarchical entity structure with four levels:

```
PLATFORM (root)
    └── UNION
        └── ASSOCIATION
            └── FIELD
```

### Entity Types

| Type | Description | Parent |
|------|-------------|--------|
| PLATFORM | Top-level organization | None |
| UNION | Regional or functional grouping | PLATFORM |
| ASSOCIATION | Smaller organizational unit | UNION |
| FIELD | Operational unit (team/department) | ASSOCIATION |

### Entity Rules

- Each entity has exactly one parent (except PLATFORM)
- Entities can be active or inactive
- Users belong to exactly one primary entity
- Permissions cascade down the hierarchy

## Users and Roles

### User Model

Users have:
- Basic profile (username, email, full name)
- Primary entity assignment
- Primary role assignment
- Multiple role assignments (for different entities)

### Role Assignments

A role assignment links a user to a role within a specific entity scope:

```
User ──── Role Assignment ───┬─── Role
                             └─── Entity (scope)
```

This enables:
- Same user with different roles in different entities
- Time-bounded assignments (start/end dates)
- Multiple concurrent assignments

### Built-in Roles

| Role | Description |
|------|-------------|
| admin | Full system access |
| manager | Entity-level management |
| member | Standard user access |

## Activities

Activities are the core data tracked by the system.

### Activity Model

```
Activity
├── activityDate      # When the activity occurred
├── description       # What was done
├── duration          # Time spent (optional)
├── expense           # Associated cost (optional)
├── activityTypeId    # Type of activity
├── userId            # Who performed it
├── reportingPeriodId # Associated reporting period
└── entityId          # Organizational context
```

### Activity Types

Activity types define categories of work. They can be:
- System-wide or entity-specific
- Role-restricted (only certain roles can log certain types)
- Active or archived

## Reporting Periods

Reporting periods are time-bounded windows for activity tracking.

### Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                    ACTIVE                                │
│  Users can create, edit, and delete activities          │
└─────────────────────────────────────────────────────────┘
                         │
                         │ (automatic after 14 days)
                         v
┌─────────────────────────────────────────────────────────┐
│                    LOCKED                                │
│  Activities are read-only (except for exceptions)       │
└─────────────────────────────────────────────────────────┘
                         │
                         │ (manual admin action)
                         v
┌─────────────────────────────────────────────────────────┐
│                    CLOSED                                │
│  Period is finalized, no further changes                │
└─────────────────────────────────────────────────────────┘
```

### Period Rules

- Only one active period per entity at a time
- Periods automatically lock after their end date + grace period
- Locked periods prevent activity modifications

### Exceptions

Admins can grant exceptions to specific users for locked periods:

```
Exception
├── userId            # Who gets the exception
├── reportingPeriodId # Which period
├── exceptionDate     # Optional: specific date within period
├── reason            # Why the exception was granted
└── grantedBy         # Admin who approved
```

With an exception, users can modify activities in an otherwise locked period.

## Activity Locking

An activity is locked if ALL conditions are true:
1. It belongs to a reporting period
2. That reporting period is locked
3. The user does NOT have an exception for that period/date

```typescript
isLocked = reportingPeriod.isLocked && !hasUserException(userId, periodId, activityDate)
```

## Reports and Analytics

The system provides several report types:

| Report | Description |
|--------|-------------|
| Summary | Total activities, hours, expenses for a period |
| Breakdowns | Activities grouped by type, entity, or user |
| Compliance | Users who submitted vs. those who didn't |
| Trends | Activity patterns over multiple periods |
| Comparison | Current vs. previous period metrics |
| Rankings | Top performers and inactive users |
| Expenses | Expense breakdown by category |

Reports respect the organizational hierarchy - users only see data for their entity and its children.

## Permissions Model

Access control follows these principles:

1. **Entity Scope**: Users can only access data within their entity hierarchy
2. **Role-Based**: Certain actions require specific roles
3. **Owner-Based**: Users can modify their own activities (subject to locking)
4. **Admin Override**: Admins can access and modify all data

### Permission Matrix

| Action | Member | Manager | Admin |
|--------|--------|---------|-------|
| View own activities | Yes | Yes | Yes |
| Create activities | Yes | Yes | Yes |
| Edit own activities | Yes* | Yes* | Yes |
| View entity activities | No | Yes | Yes |
| Manage users | No | Limited | Yes |
| Manage periods | No | No | Yes |
| Grant exceptions | No | No | Yes |

*Subject to reporting period lock status

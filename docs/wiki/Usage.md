# Usage

Logger is not a reusable logging library. It is an application composed of a web frontend and an authenticated API. This page explains how to use the running system and how other services can interact with it.

## Primary usage model

The normal flow is:

1. a user signs in through the configured identity provider
2. the frontend obtains a token and calls the backend API
3. the backend resolves the external identity to a local user
4. access is granted based on the user’s role assignments and entity scope

## Using the web application

After starting the frontend and backend:

- open `http://localhost:8080`
- complete the configured sign-in flow
- use the frontend pages to view dashboards, activities, reports, and hierarchy data

Representative frontend areas from `frontend/lib/pages/`:

| Page | Purpose |
| --- | --- |
| `dashboard.dart` | Main landing and dashboard experience |
| `activities_list_page.dart` | Activity list with filters |
| `activity_detail_page.dart` | Single activity detail view |
| `reports_page.dart` and `reports_view.dart` | Reports and analytics |
| `hierarchy_reports_page.dart` | Hierarchy-focused reporting |
| `leadership_dashboard_page.dart` | Leadership-oriented report views |

## Using the backend API

The backend is intended to be called with a bearer token. Swagger is available at `/api/docs`.

### Example: health check

```bash
curl http://localhost:3000/health
```

### Example: get the current user

```bash
curl http://localhost:3000/users/me \
  -H "Authorization: Bearer <jwt>"
```

### Example: list activity types available to the signed-in user

```bash
curl "http://localhost:3000/activity-types/authorized" \
  -H "Authorization: Bearer <jwt>"
```

### Example: create an activity

```bash
curl -X POST http://localhost:3000/activities \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "activityDate": "2026-05-01",
    "activityTypeId": "00000000-0000-0000-0000-000000000000",
    "description": "Visited community members",
    "expenseAmount": 0
  }'
```

> Status: To be confirmed.
>
> The exact accepted request payload depends on the DTO definitions and should be verified in Swagger before external integration.

### Example: filter activities

```bash
curl "http://localhost:3000/activities?page=1&limit=20&search=visit&sortBy=activityDate&sortOrder=DESC" \
  -H "Authorization: Bearer <jwt>"
```

### Example: check date availability

```bash
curl "http://localhost:3000/periods/availability?month=2026-05" \
  -H "Authorization: Bearer <jwt>"
```

### Example: fetch a report summary

```bash
curl "http://localhost:3000/reports/summary?entityId=<uuid>" \
  -H "Authorization: Bearer <jwt>"
```

## Common use cases

### Activity entry

- fetch allowed activity types
- create a new activity
- list existing activities for review
- update or archive an activity if the date is still available

### Leadership reporting

- retrieve summary, breakdown, rankings, and trend endpoints
- export report data for sharing
- inspect user activity within the permitted hierarchy

### Administration

- create or manage entities
- create roles
- assign roles to users
- set admin locks or grant exceptions

## Integration notes for other services

Other services can integrate with Logger as an authenticated HTTP API.

Recommended approach:

- obtain tokens from the same identity provider configured for the system
- call documented endpoints through Swagger-backed contracts
- treat role and entity scope as mandatory access constraints
- use `X-Request-ID` if you want request correlation in backend logs

The backend generates and propagates correlation IDs through `nestjs-pino` and a correlation ID middleware.

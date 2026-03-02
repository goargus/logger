# Replace Binary "Reportado" with Engagement Signals

**Date**: 2026-03-01
**Status**: Approved

## Problem

The current "reportado" concept is a binary: did the user log at least 1 activity in the reporting period? This flattens all effort into a single boolean — a user who logged 1 activity and one who logged 20 both show as green checkmarks. Managers can't distinguish effort levels or identify who needs follow-up. Leadership can't see meaningful variation across entities.

Setting numeric targets (e.g., "10 activities per period") would trigger Goodhart's Law — the metric becomes a gaming target rather than useful insight.

## Solution

Replace the binary compliance concept with three engagement signals that show patterns without creating targets to game:

- **Activity count**: raw volume this period
- **Recency**: when was the last activity
- **Trend**: direction vs. previous period (% change)

At the hierarchy level, two aggregate signals:
- **Active ratio**: N of M users active (breadth of participation)
- **Average activity count**: avg activities per user (depth of engagement)

## Data Model

### Per-user engagement signals

```
activityCount: number           // raw count this period
lastActivityDate: string | null // ISO date of most recent activity
trend: number | null            // % change vs previous period
```

### Renamed aggregates

| Current | New |
|---------|-----|
| `usersSubmitted` | `activeUsers` |
| `usersExpected` | `totalUsers` |
| `complianceRate` | `activeRate` |
| `usersNotSubmitted` | `inactiveUsers` |

### New aggregate

- `avgActivitiesPerUser: number` — total activities / totalUsers

### Filter rename

`ComplianceFilter` → `EngagementFilter`: `all`, `active`, `inactive`

### Endpoint change

`GET /reports/compliance` → `GET /reports/engagement`

## Backend Changes

### EngagementCalculator (replaces ComplianceCalculator)

Returns a unified user list with engagement signals instead of two separate submitted/notSubmitted arrays.

```typescript
interface EngagementUserItem {
  userId: string;
  name: string;
  roles: string[];
  entity: string;
  activityCount: number;
  lastActivityDate: string | null;
  trend: number | null;
}

interface EngagementResponse {
  users: EngagementUserItem[];
  summary: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    avgActivitiesPerUser: number;
  };
}
```

Trend calculation: needs activities from current and previous periods. `trend = ((current - previous) / previous) * 100`. If previous = 0, trend = null.

### Other calculators

- SummaryCalculator: rename fields, add `avgActivitiesPerUser`
- TrendsCalculator, ComparisonCalculator, HierarchyBreakdownCalculator: rename `complianceRate` → `activeRate`, `usersSubmitted` → `activeUsers`
- RankingsCalculator: `lowestCompliance` → `lowestEngagement`

### DTOs

All interfaces in `report-responses.dto.ts` updated with renamed fields.

## Frontend Changes

### Models

- `report_summary.dart`: remove `isReported`, add `activityCount`, `lastActivityDate`, `trend`
- `users_report.dart`: remove `hasSubmitted`, rename filter enum, rename summary fields
- `compliance_report.dart` → `engagement_report.dart`: unified user list
- `hierarchy_breakdown.dart`, `leadership_reports.dart`: field renames

### Widgets

- `summary_cards.dart`: replace "Reportado" checkmark card with activity count + recency
- `reports_view.dart`: replace "Has reportado" badge with count + recency line
- `users_report_table.dart`: replace Reportado/Pendiente chip with count, last active, trend columns; filter labels to "Activos/Inactivos"
- `users_compliance_card.dart` → `users_engagement_card.dart`: single unified table
- `hierarchy_breakdown_card.dart`: rename column, add avg activities column

### Services & exports

- `reports_service.dart`: rename method and endpoint
- `pdf_service.dart`: rename method, updated summary labels, single table
- `csv-exporter.ts`: rename method, updated columns

## E2E & Verification

- Update feature files and step definitions with new terminology and response shapes
- Playwright smoke tests against docker-compose dev environment:
  1. Engagement endpoint returns correct shape
  2. Summary endpoint returns new fields
  3. Users report filters by engagement
  4. Hierarchy breakdown returns activeRate
  5. Frontend personal view shows count + recency
  6. Frontend users table shows new columns
  7. CSV export has updated columns

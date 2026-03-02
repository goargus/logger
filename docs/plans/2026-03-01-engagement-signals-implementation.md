# Engagement Signals Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the binary "reportado" compliance concept with three engagement signals (activity count, recency, trend) across backend and frontend.

**Architecture:** Rename compliance concepts to engagement concepts throughout the stack. Backend calculators produce richer per-user metrics instead of binary submitted/notSubmitted. Frontend renders count, recency, and trend instead of checkmark/X. Breaking API change — frontend and backend update together.

**Tech Stack:** NestJS (TypeScript), Flutter (Dart), Jest, Playwright, Docker Compose

---

## PR Strategy

This is split into 3 PRs to keep reviews manageable:

1. **PR 1: Backend** — DTOs, calculators, controller, service, CSV exporter, unit tests
2. **PR 2: Frontend** — Models, services, widgets, PDF export
3. **PR 3: E2E + Playwright** — Update e2e feature files/steps, playwright smoke tests

---

## Task 1: Backend DTOs — Rename Compliance to Engagement

**Branch:** `refactor/engagement-signals`

**Files:**
- Modify: `backend/src/reports/dto/report-responses.dto.ts`
- Modify: `backend/src/reports/dto/users-report.dto.ts`
- Modify: `backend/src/reports/dto/export-report.dto.ts`
- Modify: `backend/src/reports/dto/hierarchy-breakdown.dto.ts`

**Step 1: Update `report-responses.dto.ts`**

Rename all compliance fields:

```typescript
// SummaryTotals (line 14-20):
export interface SummaryTotals {
  activities: number;
  expenses: number;
  totalUsers: number;          // was usersExpected
  activeUsers: number;         // was usersSubmitted
  activeRate: number;          // was complianceRate
  avgActivitiesPerUser: number; // new
}

// HierarchicalEntityBreakdownItem (line 22-32) — remove, now uses hierarchy-breakdown.dto.ts
// (keep as-is since it references the same shape; we rename in hierarchy-breakdown.dto.ts)

// Replace SubmittedUser + NotSubmittedUser + ComplianceResponse (lines 74-91) with:
export interface EngagementUserItem {
  userId: string;
  name: string;
  roles: string[];
  entity: string;
  activityCount: number;
  lastActivityDate: string | null;
  trend: number | null;
}

export interface EngagementSummary {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  avgActivitiesPerUser: number;
}

export interface EngagementResponse {
  users: EngagementUserItem[];
  summary: EngagementSummary;
}

// TrendPeriod (lines 93-102):
export interface TrendPeriod {
  periodId: string;
  startDate: string;
  endDate: string;
  activities: number;
  expenses: number;
  activeRate: number;         // was complianceRate
  activeUsers: number;        // was usersSubmitted
  totalUsers: number;         // was usersExpected
}

// PeriodSummary (lines 108-115):
export interface PeriodSummary {
  periodId: string;
  dates: string;
  activities: number;
  expenses: number;
  activeRate: number;         // was complianceRate
  usersActive: number;        // unchanged
}

// ComparisonChanges (lines 122-127):
export interface ComparisonChanges {
  activities: Change;
  expenses: Change;
  activeRate: Change;         // was complianceRate
  usersActive: Change;
}

// LowCompliance -> LowEngagement (lines 143-148):
export interface LowEngagement {
  entityId: string;
  name: string;
  rate: number;
  missing: number;
}

// RankingsResponse (lines 157-161):
export interface RankingsResponse {
  topPerformers: TopPerformer[];
  lowestEngagement: LowEngagement[];  // was lowestCompliance
  inactiveUsers: InactiveUser[];
}
```

Remove the old `SubmittedUser`, `NotSubmittedUser`, `ComplianceResponse`, `LowCompliance` interfaces.

**Step 2: Update `users-report.dto.ts`**

```typescript
// Rename ComplianceFilter -> EngagementFilter (lines 20-24):
export enum EngagementFilter {
  ALL = 'all',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// In UsersReportQueryDto (line 66-69):
// Change property name from 'compliance' to 'engagement', type to EngagementFilter

// In UserReportItem (line 100):
// Remove hasSubmitted, add trend:
//   trend: number | null;

// In UsersReportResponse summary (lines 111-117):
//   activeUsers: number;         // was usersSubmitted
//   inactiveUsers: number;       // was usersNotSubmitted
//   avgActivitiesPerUser: number; // new
```

**Step 3: Update `export-report.dto.ts`**

```typescript
// ExportReportType (line 10-14):
export enum ExportReportType {
  SUMMARY = 'summary',
  ACTIVITIES = 'activities',
  ENGAGEMENT = 'engagement',   // was COMPLIANCE
}
```

**Step 4: Update `hierarchy-breakdown.dto.ts`**

Rename `usersExpected` → `totalUsers`, `usersSubmitted` → `activeUsers`, `complianceRate` → `activeRate`, add `avgActivitiesPerUser`.

**Step 5: Run tests to see what breaks**

Run: `cd backend && npm test 2>&1 | head -100`
Expected: Many failures from renamed types — this confirms the DTO changes propagated.

**Step 6: Commit**

```
refactor(reports): rename compliance DTOs to engagement signals
```

---

## Task 2: EngagementCalculator (replaces ComplianceCalculator)

**Files:**
- Create: `backend/src/reports/calculators/engagement.calculator.spec.ts`
- Create: `backend/src/reports/calculators/engagement.calculator.ts`
- Delete: `backend/src/reports/calculators/compliance.calculator.ts`

**Step 1: Write the failing test**

Create `engagement.calculator.spec.ts`:

```typescript
import { EngagementCalculator } from './engagement.calculator';
import { EngagementResponse } from '../dto/report-responses.dto';

describe('EngagementCalculator', () => {
  let calculator: EngagementCalculator;
  let userRepo: any;

  const createActivity = (userId: string, date: string) =>
    ({ userId, activityDate: date } as any);

  const createUser = (id: string, name: string, entityName: string, roleName: string | null) => ({
    id,
    full_name: name,
    username: name.toLowerCase().replace(' ', '.'),
    entity_id: 'entity-1',
    entity: { name: entityName },
    role: roleName ? { name: roleName } : null,
    status: 'active',
  });

  beforeEach(() => {
    userRepo = { find: jest.fn() };
    calculator = new EngagementCalculator(userRepo);
  });

  it('should return unified user list with engagement signals', async () => {
    const users = [
      createUser('u1', 'Alice', 'Field A', 'Pastor'),
      createUser('u2', 'Bob', 'Field A', 'Missionary'),
    ];
    userRepo.find.mockResolvedValue(users);

    const currentActivities = [
      createActivity('u1', '2026-02-10'),
      createActivity('u1', '2026-02-15'),
    ];
    const previousActivities = [
      createActivity('u1', '2026-01-10'),
    ];

    const result = await calculator.calculate(
      currentActivities,
      previousActivities,
      ['entity-1'],
    );

    expect(result.users).toHaveLength(2);

    const alice = result.users.find((u) => u.userId === 'u1')!;
    expect(alice.activityCount).toBe(2);
    expect(alice.lastActivityDate).toBe('2026-02-15');
    expect(alice.trend).toBe(100); // 1 -> 2 = +100%

    const bob = result.users.find((u) => u.userId === 'u2')!;
    expect(bob.activityCount).toBe(0);
    expect(bob.lastActivityDate).toBeNull();
    expect(bob.trend).toBeNull(); // 0 -> 0, no baseline

    expect(result.summary.totalUsers).toBe(2);
    expect(result.summary.activeUsers).toBe(1);
    expect(result.summary.inactiveUsers).toBe(1);
    expect(result.summary.avgActivitiesPerUser).toBe(1); // 2 activities / 2 users
  });

  it('should set trend to null when previous count is 0 and current > 0', async () => {
    const users = [createUser('u1', 'Alice', 'Field A', 'Pastor')];
    userRepo.find.mockResolvedValue(users);

    const currentActivities = [createActivity('u1', '2026-02-10')];
    const previousActivities: any[] = [];

    const result = await calculator.calculate(currentActivities, previousActivities, ['entity-1']);

    expect(result.users[0].trend).toBeNull();
  });

  it('should calculate negative trend', async () => {
    const users = [createUser('u1', 'Alice', 'Field A', 'Pastor')];
    userRepo.find.mockResolvedValue(users);

    const currentActivities = [createActivity('u1', '2026-02-10')];
    const previousActivities = [
      createActivity('u1', '2026-01-10'),
      createActivity('u1', '2026-01-11'),
      createActivity('u1', '2026-01-12'),
      createActivity('u1', '2026-01-13'),
    ];

    const result = await calculator.calculate(currentActivities, previousActivities, ['entity-1']);

    expect(result.users[0].trend).toBe(-75); // 4 -> 1 = -75%
  });

  it('should include roles and entity in user items', async () => {
    const users = [createUser('u1', 'Alice', 'Field A', 'Pastor')];
    userRepo.find.mockResolvedValue(users);

    const result = await calculator.calculate([], [], ['entity-1']);

    expect(result.users[0].roles).toEqual(['Pastor']);
    expect(result.users[0].entity).toBe('Field A');
  });

  it('should handle user with no role', async () => {
    const users = [createUser('u1', 'Alice', 'Field A', null)];
    userRepo.find.mockResolvedValue(users);

    const result = await calculator.calculate([], [], ['entity-1']);

    expect(result.users[0].roles).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npx jest --testPathPattern=engagement.calculator.spec -v`
Expected: FAIL — `engagement.calculator` module not found.

**Step 3: Write the implementation**

Create `engagement.calculator.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Activity } from '../../activity/activity.entity';
import { User } from '../../users/user.entity';
import { UserStatus } from '../../users/user-status.enum';
import { EngagementResponse } from '../dto/report-responses.dto';

@Injectable()
export class EngagementCalculator {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async calculate(
    currentActivities: Activity[],
    previousActivities: Activity[],
    entityIds: string[],
  ): Promise<EngagementResponse> {
    const usersInScope = await this.userRepo.find({
      where: { entity_id: In(entityIds), status: UserStatus.ACTIVE },
      relations: ['entity', 'role'],
    });

    // Build per-user current period metrics
    const currentMetrics = new Map<string, { count: number; lastDate: string | null }>();
    for (const a of currentActivities) {
      const m = currentMetrics.get(a.userId) || { count: 0, lastDate: null };
      m.count++;
      if (!m.lastDate || a.activityDate > m.lastDate) {
        m.lastDate = a.activityDate;
      }
      currentMetrics.set(a.userId, m);
    }

    // Build per-user previous period counts for trend
    const previousCounts = new Map<string, number>();
    for (const a of previousActivities) {
      previousCounts.set(a.userId, (previousCounts.get(a.userId) || 0) + 1);
    }

    const totalActivities = currentActivities.length;

    const users = usersInScope.map((u) => {
      const current = currentMetrics.get(u.id) || { count: 0, lastDate: null };
      const previousCount = previousCounts.get(u.id) || 0;

      let trend: number | null = null;
      if (previousCount > 0) {
        trend = Math.round(((current.count - previousCount) / previousCount) * 100);
      }
      // If previous = 0, trend stays null (no baseline)

      return {
        userId: u.id,
        name: u.full_name || u.username,
        roles: u.role ? [u.role.name] : [],
        entity: u.entity.name,
        activityCount: current.count,
        lastActivityDate: current.lastDate,
        trend,
      };
    });

    const activeUsers = users.filter((u) => u.activityCount > 0).length;

    return {
      users,
      summary: {
        totalUsers: usersInScope.length,
        activeUsers,
        inactiveUsers: usersInScope.length - activeUsers,
        avgActivitiesPerUser:
          usersInScope.length > 0
            ? Math.round((totalActivities / usersInScope.length) * 100) / 100
            : 0,
      },
    };
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd backend && npx jest --testPathPattern=engagement.calculator.spec -v`
Expected: All 5 tests PASS.

**Step 5: Delete old file and commit**

```bash
rm backend/src/reports/calculators/compliance.calculator.ts
```

```
feat(reports): add EngagementCalculator replacing ComplianceCalculator
```

---

## Task 3: Update SummaryCalculator

**Files:**
- Modify: `backend/src/reports/calculators/summary.calculator.ts`

**Step 1: Update the calculator**

Rename fields and add `avgActivitiesPerUser`:
- `usersExpected` → `totalUsers`
- `usersSubmitted` → `activeUsers`
- `complianceRate` → `activeRate`
- Add `avgActivitiesPerUser: totalActivities / totalUsers`

In the return value (lines 75-81):
```typescript
totals: {
  activities: totalActivities,
  expenses: Math.round(totalExpenses * 100) / 100,
  totalUsers: usersExpected,        // renamed variable
  activeUsers: usersSubmitted,      // renamed variable
  activeRate: Math.round(complianceRate * 100) / 100,
  avgActivitiesPerUser:
    usersExpected > 0
      ? Math.round((totalActivities / usersExpected) * 100) / 100
      : 0,
},
```

Also rename the local variables for clarity: `usersExpected` → `totalUsers`, `usersSubmitted` → `activeUsers`.

**Step 2: Run tests**

Run: `cd backend && npx jest --testPathPattern=reports.service.spec -v`
Expected: May need to update test mocks for new field names.

**Step 3: Commit**

```
refactor(reports): rename summary calculator fields to engagement terminology
```

---

## Task 4: Update TrendsCalculator, ComparisonCalculator, HierarchyBreakdownCalculator

**Files:**
- Modify: `backend/src/reports/calculators/trends.calculator.ts`
- Modify: `backend/src/reports/calculators/comparison.calculator.ts`
- Modify: `backend/src/reports/calculators/hierarchy-breakdown.calculator.ts`

**Step 1: Update TrendsCalculator**

Rename in the return object (lines 48-57):
- `complianceRate` → `activeRate`
- `usersSubmitted` → `activeUsers`
- `usersExpected` → `totalUsers`

Same rename for local variables.

**Step 2: Update ComparisonCalculator**

Rename in `getPeriodData` return (lines 56-63):
- `complianceRate` → `activeRate`

And in the `changes` object (lines 81-86):
- `complianceRate` → `activeRate`

**Step 3: Update HierarchyBreakdownCalculator**

Rename in the return (lines 82-93):
- `usersExpected` → `totalUsers`
- `usersSubmitted` → `activeUsers`
- `complianceRate` → `activeRate`
- Add `avgActivitiesPerUser`

Also update the `HierarchicalEntityBreakdown` interface in `hierarchy-breakdown.dto.ts` to match.

**Step 4: Run tests**

Run: `cd backend && npx jest --testPathPattern=hierarchy-breakdown -v`
Expected: Tests may need field name updates.

**Step 5: Commit**

```
refactor(reports): rename trends/comparison/hierarchy calculators to engagement
```

---

## Task 5: Update RankingsCalculator

**Files:**
- Modify: `backend/src/reports/calculators/rankings.calculator.ts`

**Step 1: Update the calculator**

Rename at line 94: `lowestCompliance` → `lowestEngagement`

And in the return (line 165): `lowestCompliance` → `lowestEngagement`

**Step 2: Run tests**

Run: `cd backend && npx jest --testPathPattern=rankings -v`

**Step 3: Commit**

```
refactor(reports): rename lowestCompliance to lowestEngagement in rankings
```

---

## Task 6: Update ReportsService and ReportsController

**Files:**
- Modify: `backend/src/reports/reports.service.ts`
- Modify: `backend/src/reports/reports.controller.ts`
- Modify: `backend/src/reports/reports.module.ts`

**Step 1: Update ReportsService**

Major changes:
1. Replace `ComplianceCalculator` import with `EngagementCalculator` (line 31, 65)
2. Rename `getCompliance()` → `getEngagement()` (line 347)
   - This method now needs to fetch both current AND previous period activities for trend calculation
   - Pass both to `engagementCalculator.calculate(currentActivities, previousActivities, entityIds)`
3. Update `getUsersReport()` (line 998):
   - Replace `ComplianceFilter` with `EngagementFilter` (line 50, 1110-1114)
   - Replace `hasSubmitted: metrics.count > 0` with `trend` calculation (line 1105)
   - Rename `usersSubmitted`/`usersNotSubmitted` in summary (lines 1128-1136)
   - Add `avgActivitiesPerUser` to summary
4. Update `exportReport()` (line 867):
   - `ExportReportType.COMPLIANCE` → `ExportReportType.ENGAGEMENT`
   - Call `getEngagement()` instead of `getCompliance()`
   - Call `csvExporter.exportEngagement()` instead of `exportCompliance()`
   - Filename `cumplimiento-*` → `participacion-*`
5. Update `buildEmptyComparisonResponse()` (line 104):
   - `complianceRate` → `activeRate`

**Step 2: Update ReportsController**

1. Rename endpoint (line 70): `@Get('compliance')` → `@Get('engagement')`
2. Rename method (line 73): `getCompliance()` → `getEngagement()`
3. Update return type: `ComplianceResponse` → `EngagementResponse`
4. Update API description (line 71)
5. Update imports (lines 15-21): remove `ComplianceResponse`, add `EngagementResponse`

**Step 3: Update ReportsModule**

Replace `ComplianceCalculator` with `EngagementCalculator` in imports and providers (lines 17, 41).

**Step 4: Run all tests**

Run: `cd backend && npm test 2>&1 | tail -30`
Expected: Tests that reference old field names will need updating.

**Step 5: Commit**

```
refactor(reports): update service and controller for engagement signals
```

---

## Task 7: Update CsvExporter

**Files:**
- Modify: `backend/src/reports/export/csv-exporter.ts`
- Modify: `backend/src/reports/export/csv-exporter.spec.ts`

**Step 1: Update `exportCompliance()` → `exportEngagement()`**

Replace the two-section (submitted/notSubmitted) layout with a single unified table:

```typescript
exportEngagement(engagement: EngagementResponse): string {
  const lines: string[] = [];

  lines.push('Reporte de Participacion');
  lines.push('');

  // Summary
  lines.push('Resumen');
  lines.push(`Total Usuarios,${engagement.summary.totalUsers}`);
  lines.push(`Usuarios Activos,${engagement.summary.activeUsers}`);
  lines.push(`Usuarios Inactivos,${engagement.summary.inactiveUsers}`);
  lines.push(`Promedio Actividades por Usuario,${engagement.summary.avgActivitiesPerUser}`);
  lines.push('');

  // Unified user table
  if (engagement.users.length > 0) {
    lines.push('Detalle por Usuario');
    lines.push('Nombre,Entidad,Roles,Actividades,Ultima Actividad,Tendencia');

    for (const user of engagement.users) {
      lines.push(
        [
          this.escapeValue(user.name),
          this.escapeValue(user.entity),
          this.escapeValue(user.roles.join('; ')),
          user.activityCount,
          user.lastActivityDate || '',
          user.trend !== null ? `${user.trend}%` : '',
        ].join(','),
      );
    }
  }

  return lines.join('\n');
}
```

Also update `exportSummary()` (lines 137-139):
- `Usuarios que Reportaron` → `Usuarios Activos`
- `Usuarios Esperados` → `Total Usuarios`
- `Tasa de Cumplimiento` → `Tasa de Participacion`
- Add `Promedio Actividades por Usuario`

**Step 2: Update spec file**

Update `csv-exporter.spec.ts` to test the new `exportEngagement()` method and updated `exportSummary()` labels.

**Step 3: Run tests**

Run: `cd backend && npx jest --testPathPattern=csv-exporter -v`

**Step 4: Commit**

```
refactor(reports): update CSV exporter for engagement signals
```

---

## Task 8: Fix All Existing Backend Tests

**Files:**
- Modify: `backend/src/reports/reports.controller.spec.ts`
- Modify: `backend/src/reports/reports.service.spec.ts`
- Modify: `backend/src/reports/reports.service.users-report.spec.ts`
- Modify: `backend/src/reports/reports.service.hierarchy.spec.ts`
- Modify: `backend/src/reports/calculators/hierarchy-breakdown.calculator.spec.ts`

**Step 1: Update all test files**

Replace all references:
- `complianceRate` → `activeRate`
- `usersSubmitted` → `activeUsers`
- `usersExpected` → `totalUsers`
- `hasSubmitted` → (remove or replace with trend)
- `ComplianceFilter` → `EngagementFilter`
- `SUBMITTED` → `ACTIVE`
- `NOT_SUBMITTED` → `INACTIVE`
- `compliance` (query param) → `engagement`
- `ComplianceCalculator` → `EngagementCalculator`
- `complianceCalculator` → `engagementCalculator`
- `getCompliance` → `getEngagement`
- `lowestCompliance` → `lowestEngagement`
- `submitted` / `notSubmitted` arrays → `users` array with engagement fields

**Step 2: Run full test suite**

Run: `cd backend && npm test`
Expected: All tests pass.

**Step 3: Run lint**

Run: `cd backend && npm run lint`

**Step 4: Commit**

```
test(reports): update all report tests for engagement signals
```

---

## Task 9: Create PR 1 (Backend)

**Step 1: Push and create PR**

```bash
git push -u origin refactor/engagement-signals
gh pr create --title "refactor(reports): replace compliance with engagement signals" --body "$(cat <<'EOF'
## Summary
- Replace binary "reportado" (submitted/not submitted) with engagement signals: activity count, recency (last activity date), and trend (% change vs previous period)
- Rename compliance terminology throughout backend: ComplianceCalculator → EngagementCalculator, complianceRate → activeRate, etc.
- New EngagementCalculator returns unified user list with per-user engagement metrics
- CSV export updated with unified table format
- All existing tests updated and passing

## Test plan
- [ ] `cd backend && npm test` — all tests pass
- [ ] `cd backend && npm run lint` — clean
EOF
)"
```

---

## Task 10: Frontend Models Update

**Branch:** `refactor/engagement-signals-frontend` (based on `refactor/engagement-signals`)

**Files:**
- Modify: `frontend/lib/models/report_summary.dart`
- Rename: `frontend/lib/models/compliance_report.dart` → `frontend/lib/models/engagement_report.dart`
- Modify: `frontend/lib/models/users_report.dart`
- Modify: `frontend/lib/models/hierarchy_breakdown.dart`
- Modify: `frontend/lib/models/leadership_reports.dart`

**Step 1: Update `report_summary.dart`**

Remove `isReported`, add `activityCount`, `lastActivityDate`, `trend`:

```dart
class ReportSummary {
  final int totalActivities;
  final double totalExpenses;
  final int activityCount;           // replaces isReported
  final String? lastActivityDate;     // new
  final double? trend;                // new
  final String periodStart;
  final String periodEnd;
  final String status;

  // ... constructor and fromApi updated:
  // activityCount = totalActivities (for personal view)
  // Read from totals['activeRate'], totals['avgActivitiesPerUser']
}
```

**Step 2: Create `engagement_report.dart`**

Replace `SubmittedUser` + `NotSubmittedUser` + `ComplianceResponse` with:

```dart
class EngagementUser {
  final String userId;
  final String name;
  final List<String> roles;
  final String entity;
  final int activityCount;
  final String? lastActivityDate;
  final double? trend;
  // ... fromApi factory
}

class EngagementSummary {
  final int totalUsers;
  final int activeUsers;
  final int inactiveUsers;
  final double avgActivitiesPerUser;
  // ... fromApi factory
}

class EngagementResponse {
  final List<EngagementUser> users;
  final EngagementSummary summary;
  // ... fromApi factory
}
```

Delete `compliance_report.dart`.

**Step 3: Update `users_report.dart`**

- Remove `hasSubmitted` from `UserReportItem`, add `trend: double?`
- Rename `ComplianceFilter` → `EngagementFilter` with values `all`/`active`/`inactive`, labels `Todos`/`Activos`/`Inactivos`
- Rename in `UsersReportSummary`: `usersSubmitted` → `activeUsers`, `usersNotSubmitted` → `inactiveUsers`, add `avgActivitiesPerUser`, `activeRate` → `activeRate`

**Step 4: Update `hierarchy_breakdown.dart`**

- `usersExpected` → `totalUsers`
- `usersSubmitted` → `activeUsers`
- `complianceRate` → `activeRate`
- `compliancePercent` → `activePercent`
- `complianceDisplay` → `activeDisplay`
- Add `avgActivitiesPerUser`

Same renames in `HierarchySummaryResponse`.

**Step 5: Update `leadership_reports.dart`**

- `TrendPeriod`: `complianceRate` → `activeRate`, `usersSubmitted` → `activeUsers`, `usersExpected` → `totalUsers`
- `PeriodSummary`: `complianceRate` → `activeRate`
- `ComparisonChanges`: `complianceRate` → `activeRate`
- `LowCompliance` → `LowEngagement`
- `RankingsResponse`: `lowestCompliance` → `lowestEngagement`

**Step 6: Commit**

```
refactor(frontend): update models for engagement signals
```

---

## Task 11: Frontend Services Update

**Files:**
- Modify: `frontend/lib/services/reports_service.dart`

**Step 1: Update service**

- Import `engagement_report.dart` instead of `compliance_report.dart`
- Rename `getCompliance()` → `getEngagement()`, endpoint `reports/compliance` → `reports/engagement`
- Return type: `ComplianceResponse` → `EngagementResponse`
- In `getUsersReport()`: parameter `ComplianceFilter?` → `EngagementFilter?`, query param key `compliance` → `engagement`

**Step 2: Commit**

```
refactor(frontend): update reports service for engagement endpoint
```

---

## Task 12: Frontend Widgets Update

**Files:**
- Modify: `frontend/lib/widgets/reports/summary_cards.dart`
- Modify: `frontend/lib/pages/reports_view.dart`
- Modify: `frontend/lib/widgets/reports/users_report_table.dart`
- Rename: `frontend/lib/widgets/hierarchy/users_compliance_card.dart` → `frontend/lib/widgets/hierarchy/users_engagement_card.dart`
- Modify: `frontend/lib/widgets/hierarchy/hierarchy_breakdown_card.dart`

**Step 1: Update `summary_cards.dart`**

Replace the "Reportado" card with a "Ultima Actividad" (last activity) card:

```dart
class SummaryCards extends StatelessWidget {
  final int activitiesCount;
  final double expenses;
  final String? lastActivityDate;  // replaces isReported
  final String currencySymbol;

  // The third card shows recency instead of checkmark:
  // title: 'Ultima Actividad'
  // value: formatted date or 'Sin actividad'
}
```

**Step 2: Update `reports_view.dart`**

Replace the "Has reportado" badge (lines 236-254) with activity count + recency info.

Update `SummaryCards` call to pass `lastActivityDate` instead of `isReported`.

**Step 3: Update `users_report_table.dart`**

- Replace `ComplianceFilter` references with `EngagementFilter`
- Replace `_buildStatusChip` (Reportado/Pendiente) with activity count + trend arrow
- Update summary chips: "N activos" / "N inactivos"
- Filter dropdown labels: "Todos / Activos / Inactivos"

**Step 4: Create `users_engagement_card.dart`**

Replace the two-section submitted/not-submitted layout with a single unified table showing all users with columns: Name, Activities, Last Active, Trend.

Delete `users_compliance_card.dart`.

**Step 5: Update `hierarchy_breakdown_card.dart`**

- Column header "Cumplimiento" → "Participacion"
- Badge: `activeRate` percentage with same color thresholds
- Add avg activities column

**Step 6: Commit**

```
refactor(frontend): update widgets for engagement signals
```

---

## Task 13: Frontend Providers Update

**Files:**
- Modify: `frontend/lib/providers/hierarchy_reports_provider.dart`

**Step 1: Update provider**

- Import `engagement_report.dart` instead of `compliance_report.dart`
- `ComplianceResponse? compliance` → `EngagementResponse? engagement`
- `ComplianceFilter usersComplianceFilter` → `EngagementFilter usersEngagementFilter`
- Call `reportsService.getEngagement()` instead of `getCompliance()`
- Update `filterUsersByCompliance()` → `filterUsersByEngagement()`

**Step 2: Commit**

```
refactor(frontend): update hierarchy reports provider for engagement
```

---

## Task 14: Frontend PDF Service Update

**Files:**
- Modify: `frontend/lib/services/pdf_service.dart`

**Step 1: Update PDF service**

- `generateComplianceReport()` → `generateEngagementReport()`
- Accept `EngagementResponse` instead of `ComplianceResponse`
- Summary labels: "Total Usuarios", "Activos", "Inactivos", "Participacion %"
- Single unified table instead of two sections
- Columns: Nombre, Entidad, Roles, Actividades, Ultima Actividad, Tendencia

**Step 2: Commit**

```
refactor(frontend): update PDF service for engagement signals
```

---

## Task 15: Run Frontend Tests and Lint

**Step 1: Run Flutter analyze**

Run: `cd frontend && flutter analyze`
Expected: Clean (or only pre-existing issues).

**Step 2: Run Flutter tests**

Run: `cd frontend && flutter test`
Expected: All tests pass.

**Step 3: Commit any test fixes**

```
test(frontend): fix tests for engagement signals
```

---

## Task 16: Create PR 2 (Frontend)

**Step 1: Push and create PR**

```bash
git push -u origin refactor/engagement-signals-frontend
gh pr create --base refactor/engagement-signals --title "refactor(frontend): replace compliance with engagement signals" --body "$(cat <<'EOF'
## Summary
- Replace binary "Reportado" display with engagement signals: activity count, recency, trend
- Rename all compliance terminology in models, services, providers, widgets
- Summary cards show last activity date instead of checkmark
- Users table shows count/trend columns instead of Reportado/Pendiente chip
- PDF and hierarchy views updated to match

## Test plan
- [ ] `cd frontend && flutter analyze` — clean
- [ ] `cd frontend && flutter test` — all tests pass
EOF
)"
```

---

## Task 17: Update E2E Tests

**Branch:** `refactor/engagement-signals-e2e` (based on `refactor/engagement-signals-frontend`)

**Files:**
- Modify: `e2e/support/api/api-client.ts` — rename `REPORTS_COMPLIANCE` → `REPORTS_ENGAGEMENT`
- Modify: `e2e/step-definitions/api/reports.steps.ts` — update step for engagement endpoint
- Modify: `e2e/features/api/reports/reports-additional.feature` — rename scenarios
- Modify: `e2e/features/journeys/pastor/reports-and-analytics.feature` — update terminology
- Modify: `e2e/features/journeys/leader/hierarchical-reports.feature` — update field names
- Modify: `e2e/step-definitions/journeys/pastor/reports-and-analytics.steps.ts` — update assertions
- Modify: `e2e/step-definitions/journeys/leader/hierarchical-reports.steps.ts` — update field names

**Step 1: Update `api-client.ts`**

Line 70: `REPORTS_COMPLIANCE: '/reports/compliance'` → `REPORTS_ENGAGEMENT: '/reports/engagement'`

**Step 2: Update `reports.steps.ts`**

Line 111: `When('I request the compliance report'` → `When('I request the engagement report'`
Update to use `ENDPOINTS.REPORTS_ENGAGEMENT`.

**Step 3: Update feature files**

In `reports-additional.feature`:
- "Get compliance report" → "Get engagement report"
- "Missionary cannot access compliance report" → "Missionary cannot access engagement report"

In `reports-and-analytics.feature`:
- "Checking team compliance" → "Checking team engagement"
- Update assertions to reference `users[]` with `activityCount` instead of `submitted`/`notSubmitted`

In `hierarchical-reports.feature`:
- Line 60: `usersSubmitted` → `activeUsers`
- Line 61: `complianceRate` → `activeRate`
- Add `totalUsers`, `avgActivitiesPerUser` to expected fields

**Step 4: Update step definition files**

Update assertions in journey step files to match new response shapes.

**Step 5: Commit**

```
test(e2e): update e2e tests for engagement signals
```

---

## Task 18: Docker Compose + Playwright Smoke Tests

**Step 1: Start docker-compose**

Run: `cd /mnt/shared/development/work/contracts/argus/repos/logger && docker-compose up -d`
Wait for health checks.

**Step 2: Playwright test — engagement endpoint shape**

```typescript
// GET /reports/engagement returns correct shape
const res = await request.get('/reports/engagement');
expect(res.status()).toBe(200);
const data = await res.json();
expect(data.users).toBeDefined();
expect(data.summary.totalUsers).toBeDefined();
expect(data.summary.activeUsers).toBeDefined();
expect(data.summary.avgActivitiesPerUser).toBeDefined();
if (data.users.length > 0) {
  expect(data.users[0]).toHaveProperty('activityCount');
  expect(data.users[0]).toHaveProperty('lastActivityDate');
  expect(data.users[0]).toHaveProperty('trend');
}
```

**Step 3: Playwright test — summary endpoint new fields**

```typescript
const res = await request.get('/reports/summary');
expect(res.status()).toBe(200);
const data = await res.json();
expect(data.totals.activeRate).toBeDefined();
expect(data.totals.totalUsers).toBeDefined();
expect(data.totals.activeUsers).toBeDefined();
expect(data.totals.avgActivitiesPerUser).toBeDefined();
// Old fields should NOT exist
expect(data.totals.complianceRate).toBeUndefined();
expect(data.totals.usersSubmitted).toBeUndefined();
```

**Step 4: Playwright test — users report with engagement filter**

```typescript
const res = await request.get('/reports/users?engagement=active');
expect(res.status()).toBe(200);
const data = await res.json();
for (const user of data.users) {
  expect(user.activitiesCount).toBeGreaterThan(0);
}
```

**Step 5: Playwright test — hierarchy breakdown**

```typescript
const res = await request.get('/reports/summary?includeHierarchyBreakdown=true');
expect(res.status()).toBe(200);
const data = await res.json();
if (data.hierarchyBreakdown?.length > 0) {
  expect(data.hierarchyBreakdown[0].activeRate).toBeDefined();
  expect(data.hierarchyBreakdown[0].complianceRate).toBeUndefined();
}
```

**Step 6: Playwright test — old compliance endpoint returns 404**

```typescript
const res = await request.get('/reports/compliance');
expect(res.status()).toBe(404);
```

**Step 7: Playwright test — frontend loads**

```typescript
await page.goto('http://localhost:8080');
// Verify the app loads without errors referencing 'compliance' or 'reportado'
```

**Step 8: Playwright test — CSV export**

```typescript
const res = await request.get('/reports/export?format=csv&reportType=engagement');
expect(res.status()).toBe(200);
const csv = await res.text();
expect(csv).toContain('Reporte de Participacion');
expect(csv).toContain('Usuarios Activos');
expect(csv).not.toContain('Tasa de Cumplimiento');
```

**Step 9: Tear down**

Run: `docker-compose down`

**Step 10: Commit**

```
test(e2e): add playwright smoke tests for engagement signals
```

---

## Task 19: Create PR 3 (E2E) and Merge All

**Step 1: Push and create PR**

```bash
git push -u origin refactor/engagement-signals-e2e
gh pr create --base refactor/engagement-signals-frontend --title "test(e2e): update e2e tests for engagement signals" --body "$(cat <<'EOF'
## Summary
- Update all e2e feature files and step definitions for engagement terminology
- Rename compliance endpoint to engagement in api-client constants
- Add playwright smoke tests verifying API shape and CSV export

## Test plan
- [ ] Docker-compose smoke tests pass
- [ ] Playwright tests pass
EOF
)"
```

**Step 2: Wait for CI on all 3 PRs**

**Step 3: Merge in order**

1. Merge PR 1 (backend) into main
2. Rebase PR 2 (frontend) onto main, merge
3. Rebase PR 3 (e2e) onto main, merge

---

## Verification Checklist

After all merged:
- [ ] `cd backend && npm test` — all tests pass
- [ ] `cd backend && npm run lint` — clean
- [ ] `cd frontend && flutter analyze` — clean
- [ ] `cd frontend && flutter test` — all tests pass
- [ ] Docker-compose dev environment starts cleanly
- [ ] All 8 playwright smoke tests pass
- [ ] No references to `complianceRate`, `hasSubmitted`, `Reportado` remain in codebase

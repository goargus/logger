# Leadership Dashboard - Design Document

**Date**: 2026-02-19
**Status**: Approved
**PR Reference**: #194 (to be superseded)

## Context

PR #194 adds a Leadership Dashboard surfacing backend reporting endpoints (trends, comparison, rankings, expenses). The implementation has critical issues: double error-swallowing, no permission gating, fake entity objects with `as any` casts, and inconsistent patterns. This design describes a proper reimplementation.

## Decisions

- **Backend**: Build on top of PR #194's backend changes (accept as-is)
- **Error handling**: Fix ALL ReportsService methods for consistency (remove catch-all, let exceptions propagate)
- **Permissions**: Hide nav item + route guard for unauthorized users
- **State management**: Single provider with `AsyncValue<LeadershipDashboardData>`, parallel loading via `Future.wait`
- **Process**: TDD with Ralph Loop, bottom-up (service -> provider -> page)
- **Commits**: No footers

## Section 1: ReportsService Error Handling Refactor

Remove all catch-all-return-empty blocks from ReportsService. The service layer is the wrong place to decide error handling.

**Before** (6 methods):
```dart
try {
  final data = await apiClient.get(...);
  return SomeResponse.fromApi(data);
} catch (e) {
  return SomeResponse.empty();  // swallows ALL errors
}
```

**After** (all methods):
```dart
final data = await apiClient.get(...);
return SomeResponse.fromApi(data as Map<String, dynamic>);
```

Methods affected:
- `getPersonalSummary` — remove catch-all
- `getPersonalBreakdown` — remove catch-all
- `getEntityBreakdown` — remove catch-all
- `getHierarchySummary` — remove catch-all
- `getCompliance` — remove catch-all
- `getUserActivities` — remove unnecessary try-catch-rethrow
- `getUsersReport` — remove unnecessary try-catch-rethrow

New methods (4, added without catch-all):
- `getTrends`
- `getComparison`
- `getRankings`
- `getExpenses`

Callers that relied on silent failures (e.g., `reports_view.dart`) get typed error handling.

## Section 2: Leadership Dashboard Provider

**Data model**:
```dart
class LeadershipDashboardData {
  final TrendsResponse trends;
  final ComparisonResponse comparison;
  final RankingsResponse rankings;
  final ExpensesResponse expenses;
}
```

**Provider**: `LeadershipDashboardNotifier extends StateNotifier<AsyncValue<LeadershipDashboardData>>`

**Loading**: All 4 endpoints called in parallel with `Future.wait`. If any fails, the whole dashboard errors. This is correct because:
- All endpoints require the same permission
- Network/auth errors affect all equally
- Simple state model (loading/error/data)

**Period controls**: `periodType`, `year`, `periodIndex` as mutable fields with `updatePeriodType()`, `previousPeriod()`, `nextPeriod()`.

## Section 3: Permission Gating

**Reuse** `canViewReportsProvider` (auth.dart:375) — already checks leadership roles.

**Navigation**: Conditionally render nav item in `sidebar_nav.dart` and `mobile_drawer.dart` based on `canViewReportsProvider`.

**Route guard**: `LeadershipDashboardContent.build()` checks permission and shows access-denied message for unauthorized users.

**Defense-in-depth**: Nav hidden + page guard + backend permission enforcement.

## Section 4: Models & Dashboard Page

**Models**: Keep PR #194's models with fix for `Change`:
```dart
bool get isPositive => value > 0;  // was >= 0
bool get isNeutral => value == 0;  // new
```

Three-way color: green (positive), grey (neutral), red (negative).

**Page structure**:
```
Column([
  _buildHeader(),
  _buildPeriodControls(),       // always visible
  dashboardAsync.when(          // loading/error/data
    loading: CircularProgressIndicator,
    error: _buildErrorState,    // typed error handling
    data: _buildDashboard,
  )
])
```

**Error state** leverages `AppException`:
- `AuthException` → session message
- `NetworkException` → connection message + retry
- `ServerException` → server message + retry
- Default → generic fallback

**reports_view.dart**: Add typed error handling to replace silent failures.

## Section 5: Testing Strategy (TDD)

Written before implementation, bottom-up order:

**1. ReportsService tests**: Verify error propagation, correct endpoints, deserialization. Cover all 10+ methods.

**2. LeadershipDashboardNotifier tests**: Mock service. Verify AsyncValue states (loading/data/error), period navigation, typed exception preservation.

**3. Widget tests**: Permission gate, loading/error/data states, neutral change color.

**Ralph Loop**: Each TDD cycle = one Ralph Loop iteration. Commit at each green state.

## Implementation Order

1. ReportsService refactor (remove catch-all from existing methods)
2. ReportsService new methods (4 leadership endpoints)
3. Leadership models
4. LeadershipDashboardNotifier provider
5. Permission gating (nav + page guard)
6. Dashboard page
7. reports_view.dart error handling fix

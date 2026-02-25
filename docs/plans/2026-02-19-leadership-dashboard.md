# Leadership Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Properly implement a Leadership Dashboard that surfaces backend reporting endpoints with correct error handling, permission gating, and TDD.

**Architecture:** Build on PR #194's backend. Refactor ReportsService to stop swallowing errors, add 4 new service methods, create a single AsyncValue-based provider, gate navigation by permission, and build the dashboard page. Bottom-up: service → provider → page.

**Tech Stack:** Flutter/Dart, Riverpod (StateNotifier + AsyncValue), GoRouter, AppException hierarchy

**Design Doc:** `docs/plans/2026-02-19-leadership-dashboard-design.md`

---

### Task 1: Create branch from PR #194's backend

**Files:**
- None (git only)

**Step 1: Create branch from surface-unsaed**

```bash
git fetch origin surface-unsaed
git checkout -b feat/leadership-dashboard origin/surface-unsaed
```

**Step 2: Verify backend tests pass**

Run: `cd backend && npm test -- --testPathPattern=reports`
Expected: All existing + PR #194 tests pass

**Step 3: Commit checkpoint**

No commit needed — branch just created.

---

### Task 2: ReportsService refactor — remove catch-all error swallowing

**Files:**
- Modify: `frontend/lib/services/reports_service.dart`
- Test: `frontend/test/services/reports_service_test.dart`

**Step 1: Write tests for error propagation**

Create `frontend/test/services/reports_service_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:logger/services/reports_service.dart';
import 'package:logger/core/api_client.dart';
import 'package:logger/core/errors/app_exception.dart';

/// Minimal mock ApiClient that throws a given exception on get()
class ThrowingApiClient extends ApiClient {
  final Exception exception;

  ThrowingApiClient(this.exception)
      : super(
          baseUrl: 'http://test',
          getAccessToken: () async => 'token',
        );

  @override
  Future<dynamic> get(String path,
      {Map<String, String>? queryParameters,
      Map<String, String>? headers}) async {
    throw exception;
  }
}

/// Mock ApiClient that returns a given response
class MockApiClient extends ApiClient {
  final dynamic response;

  MockApiClient(this.response)
      : super(
          baseUrl: 'http://test',
          getAccessToken: () async => 'token',
        );

  @override
  Future<dynamic> get(String path,
      {Map<String, String>? queryParameters,
      Map<String, String>? headers}) async {
    return response;
  }
}

void main() {
  group('ReportsService error propagation', () {
    late ReportsService service;

    group('getPersonalSummary', () {
      test('should propagate AuthException', () {
        service = ReportsService(
            apiClient: ThrowingApiClient(AuthException.forbidden()));
        expect(
          () => service.getPersonalSummary(
              periodStart: '2026-01-01', periodEnd: '2026-01-31'),
          throwsA(isA<AuthException>()),
        );
      });

      test('should propagate NetworkException', () {
        service = ReportsService(
            apiClient: ThrowingApiClient(NetworkException.timeout()));
        expect(
          () => service.getPersonalSummary(
              periodStart: '2026-01-01', periodEnd: '2026-01-31'),
          throwsA(isA<NetworkException>()),
        );
      });

      test('should propagate ServerException', () {
        service = ReportsService(
            apiClient: ThrowingApiClient(ServerException.internalError()));
        expect(
          () => service.getPersonalSummary(
              periodStart: '2026-01-01', periodEnd: '2026-01-31'),
          throwsA(isA<ServerException>()),
        );
      });
    });

    group('getPersonalBreakdown', () {
      test('should propagate AuthException', () {
        service = ReportsService(
            apiClient: ThrowingApiClient(AuthException.forbidden()));
        expect(
          () => service.getPersonalBreakdown(
              periodStart: '2026-01-01', periodEnd: '2026-01-31'),
          throwsA(isA<AuthException>()),
        );
      });
    });

    group('getEntityBreakdown', () {
      test('should propagate AuthException', () {
        service = ReportsService(
            apiClient: ThrowingApiClient(AuthException.forbidden()));
        expect(
          () => service.getEntityBreakdown(
              periodStart: '2026-01-01', periodEnd: '2026-01-31'),
          throwsA(isA<AuthException>()),
        );
      });
    });

    group('getHierarchySummary', () {
      test('should propagate AuthException', () {
        service = ReportsService(
            apiClient: ThrowingApiClient(AuthException.forbidden()));
        expect(
          () => service.getHierarchySummary(),
          throwsA(isA<AuthException>()),
        );
      });
    });

    group('getCompliance', () {
      test('should propagate AuthException', () {
        service = ReportsService(
            apiClient: ThrowingApiClient(AuthException.forbidden()));
        expect(
          () => service.getCompliance(),
          throwsA(isA<AuthException>()),
        );
      });
    });
  });
}
```

**Step 2: Run tests to verify they fail**

Run: `cd frontend && flutter test test/services/reports_service_test.dart`
Expected: FAIL — methods currently catch exceptions and return empty objects

**Step 3: Refactor ReportsService — remove all catch-all blocks**

In `frontend/lib/services/reports_service.dart`, transform each method:

`getPersonalSummary` (lines 26-43) becomes:
```dart
Future<ReportSummary> getPersonalSummary({
  required String periodStart,
  required String periodEnd,
}) async {
  final data = await apiClient.get(
    'reports/summary',
    queryParameters: {
      'dateFrom': periodStart,
      'dateTo': periodEnd,
    },
  );
  return ReportSummary.fromApi(data as Map<String, dynamic>);
}
```

`getPersonalBreakdown` (lines 45-65) becomes:
```dart
Future<List<ReportBreakdown>> getPersonalBreakdown({
  required String periodStart,
  required String periodEnd,
}) async {
  final data = await apiClient.get(
    'reports/breakdowns',
    queryParameters: {
      'dateFrom': periodStart,
      'dateTo': periodEnd,
    },
  );
  final items = data['byType'] as List<dynamic>? ?? [];
  return items
      .map((item) => ReportBreakdown.fromApi(item as Map<String, dynamic>))
      .toList();
}
```

`getEntityBreakdown` (lines 93-118) becomes:
```dart
Future<List<ReportBreakdown>> getEntityBreakdown({
  String? entityId,
  required String periodStart,
  required String periodEnd,
}) async {
  final queryParams = <String, String>{
    'dateFrom': periodStart,
    'dateTo': periodEnd,
  };
  if (entityId != null) queryParams['entityId'] = entityId;
  final data = await apiClient.get(
    'reports/breakdowns',
    queryParameters: queryParams,
  );
  final items = data['byType'] as List<dynamic>? ?? [];
  return items
      .map((item) => ReportBreakdown.fromApi(item as Map<String, dynamic>))
      .toList();
}
```

`getHierarchySummary` (lines 121-145) becomes:
```dart
Future<HierarchySummaryResponse> getHierarchySummary({
  String? entityId,
  String? periodStart,
  String? periodEnd,
  bool includeHierarchyBreakdown = true,
}) async {
  final queryParams = <String, String>{
    'includeHierarchyBreakdown': includeHierarchyBreakdown.toString(),
  };
  if (entityId != null) queryParams['entityId'] = entityId;
  if (periodStart != null) queryParams['dateFrom'] = periodStart;
  if (periodEnd != null) queryParams['dateTo'] = periodEnd;
  final data = await apiClient.get(
    'reports/summary',
    queryParameters: queryParams,
  );
  return HierarchySummaryResponse.fromApi(data as Map<String, dynamic>);
}
```

`getUserActivities` (lines 148-175) — remove try-catch-rethrow wrapper:
```dart
Future<UserActivitiesResponse> getUserActivities({
  required String userId,
  String? periodId,
  String? dateFrom,
  String? dateTo,
  int page = 1,
  int limit = 20,
}) async {
  final queryParams = <String, String>{
    'page': page.toString(),
    'limit': limit.toString(),
  };
  if (periodId != null) queryParams['periodId'] = periodId;
  if (dateFrom != null) queryParams['dateFrom'] = dateFrom;
  if (dateTo != null) queryParams['dateTo'] = dateTo;
  final data = await apiClient.get(
    'reports/user/$userId/activities',
    queryParameters: queryParams,
  );
  return UserActivitiesResponse.fromApi(data as Map<String, dynamic>);
}
```

`getCompliance` (lines 178-199) becomes:
```dart
Future<ComplianceResponse> getCompliance({
  String? entityId,
  String? dateFrom,
  String? dateTo,
}) async {
  final queryParams = <String, String>{};
  if (entityId != null) queryParams['entityId'] = entityId;
  if (dateFrom != null) queryParams['dateFrom'] = dateFrom;
  if (dateTo != null) queryParams['dateTo'] = dateTo;
  final data = await apiClient.get(
    'reports/compliance',
    queryParameters: queryParams,
  );
  return ComplianceResponse.fromApi(data as Map<String, dynamic>);
}
```

`getUsersReport` (lines 202-236) — remove try-catch-rethrow wrapper:
```dart
Future<UsersReportResponse> getUsersReport({
  String? entityId,
  String? dateFrom,
  String? dateTo,
  int page = 1,
  int limit = 20,
  String? sortBy,
  String? sortOrder,
  ComplianceFilter? compliance,
  String? search,
}) async {
  final queryParams = <String, String>{
    'page': page.toString(),
    'limit': limit.toString(),
  };
  if (entityId != null) queryParams['entityId'] = entityId;
  if (dateFrom != null) queryParams['dateFrom'] = dateFrom;
  if (dateTo != null) queryParams['dateTo'] = dateTo;
  if (sortBy != null) queryParams['sortBy'] = sortBy;
  if (sortOrder != null) queryParams['sortOrder'] = sortOrder;
  if (compliance != null) queryParams['compliance'] = compliance.apiValue;
  if (search != null && search.isNotEmpty) queryParams['search'] = search;
  final data = await apiClient.get(
    'reports/users',
    queryParameters: queryParams,
  );
  return UsersReportResponse.fromApi(data as Map<String, dynamic>);
}
```

**Step 4: Run tests to verify they pass**

Run: `cd frontend && flutter test test/services/reports_service_test.dart`
Expected: PASS — exceptions now propagate

**Step 5: Commit**

```bash
git add frontend/lib/services/reports_service.dart frontend/test/services/reports_service_test.dart
git commit -m "refactor: remove catch-all error swallowing from ReportsService"
```

---

### Task 3: Fix reports_view.dart callers to handle errors

**Files:**
- Modify: `frontend/lib/pages/reports_view.dart:40-83`

**Step 1: Add typed error handling to _loadReports**

The current code has a single try-catch wrapping both calls. Since `getPersonalSummary` no longer returns empty on error, we need proper error handling. Replace `_loadReports()` (lines 40-84):

```dart
Future<void> _loadReports() async {
  if (!mounted) return;

  setState(() {
    _isLoading = true;
  });

  final periodBounds = _calculatePeriodBounds();
  final periodStart = periodBounds['start']!.toIso8601String();
  final periodEnd = periodBounds['end']!.toIso8601String();

  ReportSummary? summary;
  BreakdownsComparisonResponse? comparisonBreakdown;

  try {
    summary = await _reportsService.getPersonalSummary(
      periodStart: periodStart,
      periodEnd: periodEnd,
    );
  } catch (e) {
    // Summary failed — continue, we'll show what we can
  }

  try {
    comparisonBreakdown = await _reportsService.getBreakdownWithComparison(
      periodType: _periodType,
      year: _year,
      month: _periodType == ReportPeriodType.monthly ? _periodIndex : null,
      quarter:
          _periodType == ReportPeriodType.quarterly ? _periodIndex : null,
      half: _periodType == ReportPeriodType.biannual ? _periodIndex : null,
    );
  } catch (e) {
    // Breakdown failed — continue, we'll show what we can
  }

  if (mounted) {
    setState(() {
      if (summary != null) _summary = summary;
      if (comparisonBreakdown != null) {
        _comparisonBreakdown = comparisonBreakdown;
      }
      _isLoading = false;
    });

    if (summary == null && comparisonBreakdown == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Error al cargar reportes. Intente de nuevo.')),
      );
    }
  }
}
```

**Step 2: Verify the app compiles**

Run: `cd frontend && flutter analyze lib/pages/reports_view.dart`
Expected: No errors

**Step 3: Commit**

```bash
git add frontend/lib/pages/reports_view.dart
git commit -m "fix: add error handling to reports_view after service refactor"
```

---

### Task 4: Add leadership models

**Files:**
- Create: `frontend/lib/models/leadership_reports.dart`
- Test: `frontend/test/models/leadership_reports_test.dart`

**Step 1: Write model tests**

Create `frontend/test/models/leadership_reports_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:logger/models/leadership_reports.dart';

void main() {
  group('TrendsResponse', () {
    test('fromApi parses periods correctly', () {
      final data = {
        'periods': [
          {
            'periodId': 'p1',
            'startDate': '2026-01-01',
            'endDate': '2026-01-14',
            'activities': 10,
            'expenses': 500.0,
            'complianceRate': 85.5,
            'usersSubmitted': 8,
            'usersExpected': 10,
          }
        ]
      };
      final result = TrendsResponse.fromApi(data);

      expect(result.periods.length, 1);
      expect(result.periods[0].activities, 10);
      expect(result.periods[0].expenses, 500.0);
      expect(result.periods[0].complianceRate, 85.5);
    });

    test('fromApi handles empty periods', () {
      final result = TrendsResponse.fromApi({'periods': []});
      expect(result.periods, isEmpty);
    });

    test('fromApi handles missing periods key', () {
      final result = TrendsResponse.fromApi({});
      expect(result.periods, isEmpty);
    });

    test('empty() returns empty response', () {
      final result = TrendsResponse.empty();
      expect(result.periods, isEmpty);
    });
  });

  group('ComparisonResponse', () {
    test('fromApi parses current and previous', () {
      final data = {
        'current': {
          'periodId': 'p1',
          'dates': '2026-01-01 - 2026-01-14',
          'activities': 10,
          'expenses': 500.0,
          'complianceRate': 85.0,
          'usersActive': 8,
        },
        'previous': {
          'periodId': 'p0',
          'dates': '2025-12-18 - 2025-12-31',
          'activities': 7,
          'expenses': 300.0,
          'complianceRate': 70.0,
          'usersActive': 6,
        },
        'changes': {
          'activities': {'value': 3.0, 'percent': 42.9},
          'expenses': {'value': 200.0, 'percent': 66.7},
          'complianceRate': {'value': 15.0, 'percent': 21.4},
          'usersActive': {'value': 2.0, 'percent': 33.3},
        },
      };
      final result = ComparisonResponse.fromApi(data);

      expect(result.current.activities, 10);
      expect(result.previous.activities, 7);
      expect(result.changes.activities.value, 3.0);
      expect(result.changes.activities.percent, 42.9);
    });
  });

  group('Change', () {
    test('isPositive returns true for positive values', () {
      const change = Change(value: 5.0, percent: 10.0);
      expect(change.isPositive, isTrue);
      expect(change.isNegative, isFalse);
      expect(change.isNeutral, isFalse);
    });

    test('isNegative returns true for negative values', () {
      const change = Change(value: -3.0, percent: -15.0);
      expect(change.isPositive, isFalse);
      expect(change.isNegative, isTrue);
      expect(change.isNeutral, isFalse);
    });

    test('isNeutral returns true for zero value', () {
      const change = Change(value: 0.0, percent: 0.0);
      expect(change.isPositive, isFalse);
      expect(change.isNegative, isFalse);
      expect(change.isNeutral, isTrue);
    });
  });

  group('RankingsResponse', () {
    test('fromApi parses all three lists', () {
      final data = {
        'topPerformers': [
          {
            'userId': 'u1',
            'name': 'Alice',
            'entity': 'Field A',
            'count': 15,
            'expenses': 200.0,
          }
        ],
        'lowestCompliance': [
          {'entityId': 'e1', 'name': 'Field B', 'rate': 40.0, 'missing': 3}
        ],
        'inactiveUsers': [
          {
            'userId': 'u2',
            'name': 'Bob',
            'entity': 'Field C',
            'periodsInactive': 2,
          }
        ],
      };
      final result = RankingsResponse.fromApi(data);

      expect(result.topPerformers.length, 1);
      expect(result.topPerformers[0].name, 'Alice');
      expect(result.lowestCompliance.length, 1);
      expect(result.lowestCompliance[0].rate, 40.0);
      expect(result.inactiveUsers.length, 1);
      expect(result.inactiveUsers[0].periodsInactive, 2);
    });
  });

  group('ExpensesResponse', () {
    test('fromApi parses total and breakdowns', () {
      final data = {
        'total': 1500.0,
        'byType': [
          {
            'typeId': 't1',
            'name': 'Travel',
            'total': 800.0,
            'percent': 53.3,
            'avgPerActivity': 100.0,
          }
        ],
        'byEntity': [
          {
            'entityId': 'e1',
            'name': 'Field A',
            'total': 1000.0,
            'percent': 66.7,
            'perUser': 250.0,
          }
        ],
        'byUser': [
          {
            'userId': 'u1',
            'name': 'Alice',
            'total': 500.0,
            'percent': 33.3,
          }
        ],
      };
      final result = ExpensesResponse.fromApi(data);

      expect(result.total, 1500.0);
      expect(result.byType.length, 1);
      expect(result.byType[0].name, 'Travel');
      expect(result.byEntity.length, 1);
      expect(result.byUser.length, 1);
    });

    test('empty() returns zero total and empty lists', () {
      final result = ExpensesResponse.empty();
      expect(result.total, 0.0);
      expect(result.byType, isEmpty);
    });
  });
}
```

**Step 2: Run tests to verify they fail**

Run: `cd frontend && flutter test test/models/leadership_reports_test.dart`
Expected: FAIL — file doesn't exist yet

**Step 3: Create the models file**

Create `frontend/lib/models/leadership_reports.dart` — use PR #194's models as base but fix `Change`:

```dart
class TrendPeriod {
  final String periodId;
  final String startDate;
  final String endDate;
  final int activities;
  final double expenses;
  final double complianceRate;
  final int usersSubmitted;
  final int usersExpected;

  const TrendPeriod({
    required this.periodId,
    required this.startDate,
    required this.endDate,
    required this.activities,
    required this.expenses,
    required this.complianceRate,
    required this.usersSubmitted,
    required this.usersExpected,
  });

  factory TrendPeriod.fromApi(Map<String, dynamic> data) {
    return TrendPeriod(
      periodId: data['periodId'] as String? ?? '',
      startDate: data['startDate'] as String? ?? '',
      endDate: data['endDate'] as String? ?? '',
      activities: (data['activities'] as num?)?.toInt() ?? 0,
      expenses: (data['expenses'] as num?)?.toDouble() ?? 0.0,
      complianceRate: (data['complianceRate'] as num?)?.toDouble() ?? 0.0,
      usersSubmitted: (data['usersSubmitted'] as num?)?.toInt() ?? 0,
      usersExpected: (data['usersExpected'] as num?)?.toInt() ?? 0,
    );
  }
}

class TrendsResponse {
  final List<TrendPeriod> periods;

  const TrendsResponse({required this.periods});

  factory TrendsResponse.fromApi(Map<String, dynamic> data) {
    final periodsData = data['periods'] as List<dynamic>? ?? [];
    return TrendsResponse(
      periods: periodsData
          .map((p) => TrendPeriod.fromApi(p as Map<String, dynamic>))
          .toList(),
    );
  }

  factory TrendsResponse.empty() => const TrendsResponse(periods: []);
}

class PeriodSummary {
  final String periodId;
  final String dates;
  final int activities;
  final double expenses;
  final double complianceRate;
  final int usersActive;

  const PeriodSummary({
    required this.periodId,
    required this.dates,
    required this.activities,
    required this.expenses,
    required this.complianceRate,
    required this.usersActive,
  });

  factory PeriodSummary.fromApi(Map<String, dynamic> data) {
    return PeriodSummary(
      periodId: data['periodId'] as String? ?? '',
      dates: data['dates'] as String? ?? '',
      activities: (data['activities'] as num?)?.toInt() ?? 0,
      expenses: (data['expenses'] as num?)?.toDouble() ?? 0.0,
      complianceRate: (data['complianceRate'] as num?)?.toDouble() ?? 0.0,
      usersActive: (data['usersActive'] as num?)?.toInt() ?? 0,
    );
  }
}

class Change {
  final double value;
  final double percent;

  const Change({required this.value, required this.percent});

  factory Change.fromApi(Map<String, dynamic> data) {
    return Change(
      value: (data['value'] as num?)?.toDouble() ?? 0.0,
      percent: (data['percent'] as num?)?.toDouble() ?? 0.0,
    );
  }

  bool get isPositive => value > 0;
  bool get isNegative => value < 0;
  bool get isNeutral => value == 0;
}

class ComparisonChanges {
  final Change activities;
  final Change expenses;
  final Change complianceRate;
  final Change usersActive;

  const ComparisonChanges({
    required this.activities,
    required this.expenses,
    required this.complianceRate,
    required this.usersActive,
  });

  factory ComparisonChanges.fromApi(Map<String, dynamic> data) {
    return ComparisonChanges(
      activities: Change.fromApi(data['activities'] as Map<String, dynamic>),
      expenses: Change.fromApi(data['expenses'] as Map<String, dynamic>),
      complianceRate:
          Change.fromApi(data['complianceRate'] as Map<String, dynamic>),
      usersActive:
          Change.fromApi(data['usersActive'] as Map<String, dynamic>),
    );
  }
}

class ComparisonResponse {
  final PeriodSummary current;
  final PeriodSummary previous;
  final ComparisonChanges changes;

  const ComparisonResponse({
    required this.current,
    required this.previous,
    required this.changes,
  });

  factory ComparisonResponse.fromApi(Map<String, dynamic> data) {
    return ComparisonResponse(
      current: PeriodSummary.fromApi(data['current'] as Map<String, dynamic>),
      previous:
          PeriodSummary.fromApi(data['previous'] as Map<String, dynamic>),
      changes:
          ComparisonChanges.fromApi(data['changes'] as Map<String, dynamic>),
    );
  }

  factory ComparisonResponse.empty() {
    return ComparisonResponse(
      current: PeriodSummary.fromApi(const {}),
      previous: PeriodSummary.fromApi(const {}),
      changes: ComparisonChanges.fromApi(const {
        'activities': {'value': 0.0, 'percent': 0.0},
        'expenses': {'value': 0.0, 'percent': 0.0},
        'complianceRate': {'value': 0.0, 'percent': 0.0},
        'usersActive': {'value': 0.0, 'percent': 0.0},
      }),
    );
  }
}

class TopPerformer {
  final String userId;
  final String name;
  final String entity;
  final int count;
  final double expenses;

  const TopPerformer({
    required this.userId,
    required this.name,
    required this.entity,
    required this.count,
    required this.expenses,
  });

  factory TopPerformer.fromApi(Map<String, dynamic> data) {
    return TopPerformer(
      userId: data['userId'] as String? ?? '',
      name: data['name'] as String? ?? '',
      entity: data['entity'] as String? ?? '',
      count: (data['count'] as num?)?.toInt() ?? 0,
      expenses: (data['expenses'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class LowCompliance {
  final String entityId;
  final String name;
  final double rate;
  final int missing;

  const LowCompliance({
    required this.entityId,
    required this.name,
    required this.rate,
    required this.missing,
  });

  factory LowCompliance.fromApi(Map<String, dynamic> data) {
    return LowCompliance(
      entityId: data['entityId'] as String? ?? '',
      name: data['name'] as String? ?? '',
      rate: (data['rate'] as num?)?.toDouble() ?? 0.0,
      missing: (data['missing'] as num?)?.toInt() ?? 0,
    );
  }
}

class InactiveUser {
  final String userId;
  final String name;
  final String entity;
  final int periodsInactive;

  const InactiveUser({
    required this.userId,
    required this.name,
    required this.entity,
    required this.periodsInactive,
  });

  factory InactiveUser.fromApi(Map<String, dynamic> data) {
    return InactiveUser(
      userId: data['userId'] as String? ?? '',
      name: data['name'] as String? ?? '',
      entity: data['entity'] as String? ?? '',
      periodsInactive: (data['periodsInactive'] as num?)?.toInt() ?? 0,
    );
  }
}

class RankingsResponse {
  final List<TopPerformer> topPerformers;
  final List<LowCompliance> lowestCompliance;
  final List<InactiveUser> inactiveUsers;

  const RankingsResponse({
    required this.topPerformers,
    required this.lowestCompliance,
    required this.inactiveUsers,
  });

  factory RankingsResponse.fromApi(Map<String, dynamic> data) {
    return RankingsResponse(
      topPerformers: (data['topPerformers'] as List<dynamic>? ?? [])
          .map((i) => TopPerformer.fromApi(i as Map<String, dynamic>))
          .toList(),
      lowestCompliance: (data['lowestCompliance'] as List<dynamic>? ?? [])
          .map((i) => LowCompliance.fromApi(i as Map<String, dynamic>))
          .toList(),
      inactiveUsers: (data['inactiveUsers'] as List<dynamic>? ?? [])
          .map((i) => InactiveUser.fromApi(i as Map<String, dynamic>))
          .toList(),
    );
  }

  factory RankingsResponse.empty() => const RankingsResponse(
        topPerformers: [],
        lowestCompliance: [],
        inactiveUsers: [],
      );
}

class ExpenseByType {
  final String typeId;
  final String name;
  final double total;
  final double percent;
  final double avgPerActivity;

  const ExpenseByType({
    required this.typeId,
    required this.name,
    required this.total,
    required this.percent,
    required this.avgPerActivity,
  });

  factory ExpenseByType.fromApi(Map<String, dynamic> data) {
    return ExpenseByType(
      typeId: data['typeId'] as String? ?? '',
      name: data['name'] as String? ?? '',
      total: (data['total'] as num?)?.toDouble() ?? 0.0,
      percent: (data['percent'] as num?)?.toDouble() ?? 0.0,
      avgPerActivity: (data['avgPerActivity'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class ExpenseByEntity {
  final String entityId;
  final String name;
  final double total;
  final double percent;
  final double perUser;

  const ExpenseByEntity({
    required this.entityId,
    required this.name,
    required this.total,
    required this.percent,
    required this.perUser,
  });

  factory ExpenseByEntity.fromApi(Map<String, dynamic> data) {
    return ExpenseByEntity(
      entityId: data['entityId'] as String? ?? '',
      name: data['name'] as String? ?? '',
      total: (data['total'] as num?)?.toDouble() ?? 0.0,
      percent: (data['percent'] as num?)?.toDouble() ?? 0.0,
      perUser: (data['perUser'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class ExpenseByUser {
  final String userId;
  final String name;
  final double total;
  final double percent;

  const ExpenseByUser({
    required this.userId,
    required this.name,
    required this.total,
    required this.percent,
  });

  factory ExpenseByUser.fromApi(Map<String, dynamic> data) {
    return ExpenseByUser(
      userId: data['userId'] as String? ?? '',
      name: data['name'] as String? ?? '',
      total: (data['total'] as num?)?.toDouble() ?? 0.0,
      percent: (data['percent'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class ExpensesResponse {
  final double total;
  final List<ExpenseByType> byType;
  final List<ExpenseByEntity> byEntity;
  final List<ExpenseByUser> byUser;

  const ExpensesResponse({
    required this.total,
    required this.byType,
    required this.byEntity,
    required this.byUser,
  });

  factory ExpensesResponse.fromApi(Map<String, dynamic> data) {
    return ExpensesResponse(
      total: (data['total'] as num?)?.toDouble() ?? 0.0,
      byType: (data['byType'] as List<dynamic>? ?? [])
          .map((i) => ExpenseByType.fromApi(i as Map<String, dynamic>))
          .toList(),
      byEntity: (data['byEntity'] as List<dynamic>? ?? [])
          .map((i) => ExpenseByEntity.fromApi(i as Map<String, dynamic>))
          .toList(),
      byUser: (data['byUser'] as List<dynamic>? ?? [])
          .map((i) => ExpenseByUser.fromApi(i as Map<String, dynamic>))
          .toList(),
    );
  }

  factory ExpensesResponse.empty() => const ExpensesResponse(
        total: 0.0,
        byType: [],
        byEntity: [],
        byUser: [],
      );
}
```

**Step 4: Run tests to verify they pass**

Run: `cd frontend && flutter test test/models/leadership_reports_test.dart`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/lib/models/leadership_reports.dart frontend/test/models/leadership_reports_test.dart
git commit -m "feat: add leadership dashboard models with corrected Change semantics"
```

---

### Task 5: Add 4 new service methods for leadership endpoints

**Files:**
- Modify: `frontend/lib/services/reports_service.dart`
- Modify: `frontend/test/services/reports_service_test.dart`

**Step 1: Add tests for new methods**

Append to `frontend/test/services/reports_service_test.dart`:

```dart
// Add these groups inside the existing main() function

group('Leadership endpoint methods', () {
  group('getTrends', () {
    test('should propagate exceptions', () {
      final service = ReportsService(
          apiClient: ThrowingApiClient(AuthException.forbidden()));
      expect(
        () => service.getTrends(dateFrom: '2026-01-01', dateTo: '2026-01-31'),
        throwsA(isA<AuthException>()),
      );
    });

    test('should call correct endpoint', () async {
      String? capturedPath;
      final mockClient = _CapturingApiClient(
        response: {'periods': []},
        onGet: (path, params) => capturedPath = path,
      );
      final service = ReportsService(apiClient: mockClient);
      await service.getTrends(dateFrom: '2026-01-01', dateTo: '2026-01-31');
      expect(capturedPath, 'reports/trends');
    });
  });

  group('getComparison', () {
    test('should propagate exceptions', () {
      final service = ReportsService(
          apiClient: ThrowingApiClient(ServerException.internalError()));
      expect(
        () => service.getComparison(
            dateFrom: '2026-01-01', dateTo: '2026-01-31'),
        throwsA(isA<ServerException>()),
      );
    });
  });

  group('getRankings', () {
    test('should propagate exceptions', () {
      final service = ReportsService(
          apiClient: ThrowingApiClient(AuthException.forbidden()));
      expect(
        () => service.getRankings(
            dateFrom: '2026-01-01', dateTo: '2026-01-31'),
        throwsA(isA<AuthException>()),
      );
    });
  });

  group('getExpenses', () {
    test('should propagate exceptions', () {
      final service = ReportsService(
          apiClient: ThrowingApiClient(NetworkException.timeout()));
      expect(
        () => service.getExpenses(
            dateFrom: '2026-01-01', dateTo: '2026-01-31'),
        throwsA(isA<NetworkException>()),
      );
    });
  });
});
```

Also add the `_CapturingApiClient` helper class at the top of the test file:

```dart
class _CapturingApiClient extends ApiClient {
  final dynamic response;
  final void Function(String path, Map<String, String>? params)? onGet;

  _CapturingApiClient({required this.response, this.onGet})
      : super(baseUrl: 'http://test', getAccessToken: () async => 'token');

  @override
  Future<dynamic> get(String path,
      {Map<String, String>? queryParameters,
      Map<String, String>? headers}) async {
    onGet?.call(path, queryParameters);
    return response;
  }
}
```

**Step 2: Run tests to verify they fail**

Run: `cd frontend && flutter test test/services/reports_service_test.dart`
Expected: FAIL — methods don't exist yet

**Step 3: Add the 4 new methods to ReportsService**

Add to `frontend/lib/services/reports_service.dart` (after `exportReport`, before the closing `}`), plus the import:

At top of file, add import:
```dart
import '../models/leadership_reports.dart';
```

Methods:
```dart
Future<TrendsResponse> getTrends({
  String? entityId,
  String? dateFrom,
  String? dateTo,
}) async {
  final queryParams = <String, String>{};
  if (entityId != null) queryParams['entityId'] = entityId;
  if (dateFrom != null) queryParams['dateFrom'] = dateFrom;
  if (dateTo != null) queryParams['dateTo'] = dateTo;
  final data = await apiClient.get(
    'reports/trends',
    queryParameters: queryParams,
  );
  return TrendsResponse.fromApi(data as Map<String, dynamic>);
}

Future<ComparisonResponse> getComparison({
  String? entityId,
  String? dateFrom,
  String? dateTo,
  ReportPeriodType? periodType,
  int? year,
  int? month,
  int? quarter,
  int? half,
}) async {
  final queryParams = <String, String>{};
  if (entityId != null) queryParams['entityId'] = entityId;
  if (dateFrom != null) queryParams['dateFrom'] = dateFrom;
  if (dateTo != null) queryParams['dateTo'] = dateTo;
  if (periodType != null) queryParams['periodType'] = periodType.apiValue;
  if (year != null) queryParams['year'] = year.toString();
  if (month != null) queryParams['month'] = month.toString();
  if (quarter != null) queryParams['quarter'] = quarter.toString();
  if (half != null) queryParams['half'] = half.toString();
  final data = await apiClient.get(
    'reports/comparison',
    queryParameters: queryParams,
  );
  return ComparisonResponse.fromApi(data as Map<String, dynamic>);
}

Future<RankingsResponse> getRankings({
  String? entityId,
  String? dateFrom,
  String? dateTo,
  int limit = 10,
}) async {
  final queryParams = <String, String>{
    'limit': limit.toString(),
  };
  if (entityId != null) queryParams['entityId'] = entityId;
  if (dateFrom != null) queryParams['dateFrom'] = dateFrom;
  if (dateTo != null) queryParams['dateTo'] = dateTo;
  final data = await apiClient.get(
    'reports/rankings',
    queryParameters: queryParams,
  );
  return RankingsResponse.fromApi(data as Map<String, dynamic>);
}

Future<ExpensesResponse> getExpenses({
  String? entityId,
  String? dateFrom,
  String? dateTo,
}) async {
  final queryParams = <String, String>{};
  if (entityId != null) queryParams['entityId'] = entityId;
  if (dateFrom != null) queryParams['dateFrom'] = dateFrom;
  if (dateTo != null) queryParams['dateTo'] = dateTo;
  final data = await apiClient.get(
    'reports/expenses',
    queryParameters: queryParams,
  );
  return ExpensesResponse.fromApi(data as Map<String, dynamic>);
}
```

**Step 4: Run tests to verify they pass**

Run: `cd frontend && flutter test test/services/reports_service_test.dart`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/lib/services/reports_service.dart frontend/test/services/reports_service_test.dart
git commit -m "feat: add leadership endpoint methods to ReportsService"
```

---

### Task 6: Create LeadershipDashboardNotifier provider

**Files:**
- Create: `frontend/lib/models/leadership_dashboard_data.dart`
- Create: `frontend/lib/providers/leadership_dashboard_provider.dart`

**Step 1: Create the data class**

Create `frontend/lib/models/leadership_dashboard_data.dart`:

```dart
import 'leadership_reports.dart';

class LeadershipDashboardData {
  final TrendsResponse trends;
  final ComparisonResponse comparison;
  final RankingsResponse rankings;
  final ExpensesResponse expenses;

  const LeadershipDashboardData({
    required this.trends,
    required this.comparison,
    required this.rankings,
    required this.expenses,
  });
}
```

**Step 2: Create the provider**

Create `frontend/lib/providers/leadership_dashboard_provider.dart`:

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/leadership_dashboard_data.dart';
import '../models/leadership_reports.dart';
import '../models/report_period_type.dart';
import '../services/reports_service.dart';
import 'auth.dart';

final leadershipDashboardProvider = StateNotifierProvider<
    LeadershipDashboardNotifier, AsyncValue<LeadershipDashboardData>>(
  (ref) {
    final authState = ref.watch(authNotifierProvider);
    Future<String> getAccessToken() async => authState.accessToken ?? '';

    return LeadershipDashboardNotifier(
      reportsService: ReportsService.localhost(getAccessToken),
    );
  },
);

class LeadershipDashboardNotifier
    extends StateNotifier<AsyncValue<LeadershipDashboardData>> {
  LeadershipDashboardNotifier({required this.reportsService})
      : super(const AsyncValue.loading());

  final ReportsService reportsService;

  ReportPeriodType _periodType = ReportPeriodType.monthly;
  int _year = DateTime.now().year;
  int _periodIndex = DateTime.now().month;

  ReportPeriodType get periodType => _periodType;
  int get year => _year;
  int get periodIndex => _periodIndex;

  Map<String, String> _calculatePeriodBounds() {
    DateTime start;
    DateTime end;

    switch (_periodType) {
      case ReportPeriodType.monthly:
        start = DateTime(_year, _periodIndex, 1);
        end = DateTime(_year, _periodIndex + 1, 0, 23, 59, 59);
        break;
      case ReportPeriodType.quarterly:
        final startMonth = (_periodIndex - 1) * 3 + 1;
        start = DateTime(_year, startMonth, 1);
        end = DateTime(_year, startMonth + 3, 0, 23, 59, 59);
        break;
      case ReportPeriodType.biannual:
        final startMonth = (_periodIndex - 1) * 6 + 1;
        start = DateTime(_year, startMonth, 1);
        end = DateTime(_year, startMonth + 6, 0, 23, 59, 59);
        break;
      case ReportPeriodType.annual:
        start = DateTime(_year, 1, 1);
        end = DateTime(_year, 12, 31, 23, 59, 59);
        break;
    }

    String format(DateTime d) =>
        '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

    return {'dateFrom': format(start), 'dateTo': format(end)};
  }

  Future<void> loadDashboard({String? entityId}) async {
    state = const AsyncValue.loading();
    final bounds = _calculatePeriodBounds();
    final dateFrom = bounds['dateFrom']!;
    final dateTo = bounds['dateTo']!;

    try {
      final results = await Future.wait([
        reportsService.getTrends(
          entityId: entityId,
          dateFrom: dateFrom,
          dateTo: dateTo,
        ),
        reportsService.getComparison(
          entityId: entityId,
          dateFrom: dateFrom,
          dateTo: dateTo,
          periodType: _periodType,
          year: _year,
          month:
              _periodType == ReportPeriodType.monthly ? _periodIndex : null,
          quarter:
              _periodType == ReportPeriodType.quarterly ? _periodIndex : null,
          half:
              _periodType == ReportPeriodType.biannual ? _periodIndex : null,
        ),
        reportsService.getRankings(
          entityId: entityId,
          dateFrom: dateFrom,
          dateTo: dateTo,
        ),
        reportsService.getExpenses(
          entityId: entityId,
          dateFrom: dateFrom,
          dateTo: dateTo,
        ),
      ]);

      if (mounted) {
        state = AsyncValue.data(LeadershipDashboardData(
          trends: results[0] as TrendsResponse,
          comparison: results[1] as ComparisonResponse,
          rankings: results[2] as RankingsResponse,
          expenses: results[3] as ExpensesResponse,
        ));
      }
    } catch (e, stack) {
      if (mounted) {
        state = AsyncValue.error(e, stack);
      }
    }
  }

  Future<void> updatePeriodType(ReportPeriodType newType) async {
    final now = DateTime.now();
    _periodType = newType;
    _year = now.year;
    switch (newType) {
      case ReportPeriodType.monthly:
        _periodIndex = now.month;
        break;
      case ReportPeriodType.quarterly:
        _periodIndex = ((now.month - 1) ~/ 3) + 1;
        break;
      case ReportPeriodType.biannual:
        _periodIndex = now.month <= 6 ? 1 : 2;
        break;
      case ReportPeriodType.annual:
        _periodIndex = 1;
        break;
    }
    await loadDashboard();
  }

  Future<void> previousPeriod({String? entityId}) async {
    if (_periodIndex > 1) {
      _periodIndex--;
    } else {
      _year--;
      _periodIndex = _periodType.maxPeriodIndex;
    }
    await loadDashboard(entityId: entityId);
  }

  Future<void> nextPeriod({String? entityId}) async {
    if (_periodIndex < _periodType.maxPeriodIndex) {
      _periodIndex++;
    } else {
      _year++;
      _periodIndex = 1;
    }
    await loadDashboard(entityId: entityId);
  }
}
```

**Step 3: Verify compilation**

Run: `cd frontend && flutter analyze lib/providers/leadership_dashboard_provider.dart lib/models/leadership_dashboard_data.dart`
Expected: No errors

**Step 4: Commit**

```bash
git add frontend/lib/models/leadership_dashboard_data.dart frontend/lib/providers/leadership_dashboard_provider.dart
git commit -m "feat: add LeadershipDashboardNotifier with AsyncValue and parallel loading"
```

---

### Task 7: Add permission gating to navigation

**Files:**
- Modify: `frontend/lib/widgets/nav/sidebar_nav.dart:73-97`
- Modify: `frontend/lib/widgets/nav/mobile_drawer.dart:9,65-92`
- Modify: `frontend/lib/router.dart`
- Modify: `frontend/lib/widgets/layouts/app_shell.dart:99-119`

**Step 1: Add nav item to sidebar (already a ConsumerWidget)**

In `sidebar_nav.dart`, after the Reportes nav item (line 96), add:

```dart
if (ref.watch(canViewReportsProvider))
  _buildNavItem(
    context,
    icon: Icons.analytics,
    label: 'Rendimiento',
    path: AppRoutes.leadershipDashboard,
    isActive: currentPath == AppRoutes.leadershipDashboard,
  ),
```

**Step 2: Convert MobileDrawer to ConsumerWidget and add nav item**

Change `MobileDrawer` from `StatelessWidget` to `ConsumerWidget`:
- Line 9: `class MobileDrawer extends ConsumerWidget`
- Line 24: `Widget build(BuildContext context, WidgetRef ref)`

After the Reportes nav item (line 91), add the same conditional nav item.

**Step 3: Add route and import to router.dart**

In `router.dart`:
- Add import: `import 'pages/leadership_dashboard_page.dart';`
- Add route constant: `static const leadershipDashboard = '/leadership';`
- Add GoRoute after userActivities route (after line 74):

```dart
GoRoute(
  path: AppRoutes.leadershipDashboard,
  pageBuilder: (context, state) => const NoTransitionPage(
    child: LeadershipDashboardContent(),
  ),
),
```

**Step 4: Add title to AppShell**

In `app_shell.dart`, add case in `_buildAppBarTitle` (after line 110):

```dart
case '/leadership':
  title = 'Rendimiento';
  break;
```

**Step 5: Verify compilation**

Run: `cd frontend && flutter analyze`
Expected: May fail because `LeadershipDashboardContent` doesn't exist yet — that's OK, we create a placeholder.

**Step 6: Create placeholder page**

Create `frontend/lib/pages/leadership_dashboard_page.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth.dart';

class LeadershipDashboardContent extends ConsumerWidget {
  const LeadershipDashboardContent({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final canView = ref.watch(canViewReportsProvider);
    if (!canView) {
      return const Center(
        child: Text('No tienes acceso a esta sección.'),
      );
    }

    return const Center(child: Text('Leadership Dashboard — coming soon'));
  }
}
```

**Step 7: Verify compilation**

Run: `cd frontend && flutter analyze`
Expected: No errors

**Step 8: Commit**

```bash
git add frontend/lib/widgets/nav/sidebar_nav.dart frontend/lib/widgets/nav/mobile_drawer.dart frontend/lib/router.dart frontend/lib/widgets/layouts/app_shell.dart frontend/lib/pages/leadership_dashboard_page.dart
git commit -m "feat: add permission-gated navigation and route for leadership dashboard"
```

---

### Task 8: Build the leadership dashboard page

**Files:**
- Modify: `frontend/lib/pages/leadership_dashboard_page.dart`

**Context:** This is the UI task. The page consumes the `leadershipDashboardProvider` and renders 4 sections: comparison cards, trends table, rankings, and expenses. Period controls stay visible during loading/error. Use PR #194's layout as reference but wire to AsyncValue.

**Step 1: Implement the full page**

Replace the placeholder in `frontend/lib/pages/leadership_dashboard_page.dart` with the full implementation. Key structure:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/leadership_dashboard_provider.dart';
import '../providers/auth.dart';
import '../core/errors/app_exception.dart';
import '../utils/currency_formatter.dart';
import '../models/leadership_reports.dart';
import '../models/leadership_dashboard_data.dart';
import '../widgets/reports/period_type_selector.dart';
import '../widgets/reports/enhanced_time_selector.dart';

class LeadershipDashboardContent extends ConsumerStatefulWidget {
  const LeadershipDashboardContent({super.key});

  @override
  ConsumerState<LeadershipDashboardContent> createState() =>
      _LeadershipDashboardContentState();
}

class _LeadershipDashboardContentState
    extends ConsumerState<LeadershipDashboardContent> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDashboard();
    });
  }

  void _loadDashboard() {
    final authState = ref.read(authNotifierProvider);
    final primaryEntity =
        authState.user?['primary_entity'] as Map<String, dynamic>?;
    final entityId = primaryEntity?['id'] as String?;
    ref.read(leadershipDashboardProvider.notifier).loadDashboard(
          entityId: entityId,
        );
  }

  @override
  Widget build(BuildContext context) {
    final canView = ref.watch(canViewReportsProvider);
    if (!canView) {
      return const Center(
        child: Text('No tienes acceso a esta sección.'),
      );
    }

    final notifier = ref.read(leadershipDashboardProvider.notifier);
    final dashboardAsync = ref.watch(leadershipDashboardProvider);
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header — always visible
          _buildHeader(theme, notifier),
          const SizedBox(height: 16),
          // Period controls — always visible
          _buildPeriodControls(theme, notifier),
          const SizedBox(height: 16),
          // Content — loading/error/data
          dashboardAsync.when(
            loading: () => const Center(
              child: Padding(
                padding: EdgeInsets.all(40),
                child: CircularProgressIndicator(),
              ),
            ),
            error: (error, _) => _buildErrorState(error, theme),
            data: (data) => _buildDashboard(data, theme),
          ),
        ],
      ),
    );
  }

  // ... _buildHeader, _buildPeriodControls, _buildErrorState, _buildDashboard
  // ... _buildComparisonSection, _buildTrendsSection, _buildRankingsSection, _buildExpensesSection
  // Reuse PR #194's widget code for these, adapted to use the data parameter
}
```

The `_buildErrorState` method uses typed errors:

```dart
Widget _buildErrorState(Object error, ThemeData theme) {
  String message;
  bool canRetry = false;

  if (error is AuthException) {
    message = error.userMessage;
  } else if (error is NetworkException) {
    message = error.userMessage;
    canRetry = true;
  } else if (error is ServerException) {
    message = error.userMessage;
    canRetry = true;
  } else if (error is AppException) {
    message = error.userMessage;
    canRetry = error.shouldRetry;
  } else {
    message = 'Error inesperado. Intente de nuevo.';
    canRetry = true;
  }

  return Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Icon(Icons.error_outline, size: 64, color: theme.colorScheme.error),
          const SizedBox(height: 16),
          Text(message, textAlign: TextAlign.center),
          if (canRetry) ...[
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadDashboard,
              child: const Text('Reintentar'),
            ),
          ],
        ],
      ),
    ),
  );
}
```

The comparison cards use three-way color via `Change`:

```dart
Color changeColor;
IconData changeIcon;
if (change.isNeutral) {
  changeColor = Colors.grey;
  changeIcon = Icons.remove;
} else if (change.isPositive) {
  changeColor = Colors.green;
  changeIcon = Icons.arrow_upward;
} else {
  changeColor = Colors.red;
  changeIcon = Icons.arrow_downward;
}
```

**Step 2: Verify compilation and analyze**

Run: `cd frontend && flutter analyze lib/pages/leadership_dashboard_page.dart`
Expected: No errors

**Step 3: Commit**

```bash
git add frontend/lib/pages/leadership_dashboard_page.dart
git commit -m "feat: implement leadership dashboard page with typed error handling"
```

---

### Task 9: Final verification

**Step 1: Run all frontend tests**

Run: `cd frontend && flutter test`
Expected: All tests pass

**Step 2: Run backend tests**

Run: `cd backend && npm test`
Expected: All tests pass

**Step 3: Run flutter analyze**

Run: `cd frontend && flutter analyze`
Expected: No errors

**Step 4: Review the full diff**

Run: `git diff main...HEAD --stat`
Expected: Shows all changed files, reasonable line counts

**Step 5: Final commit if any fixes needed**

Only if Steps 1-3 revealed issues.

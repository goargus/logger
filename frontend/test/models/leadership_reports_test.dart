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

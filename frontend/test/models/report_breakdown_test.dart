import 'package:flutter_test/flutter_test.dart';
import 'package:logger/models/report_breakdown.dart';

void main() {
  group('ReportBreakdown', () {
    group('fromApi', () {
      test('should parse all fields correctly', () {
        final breakdown = ReportBreakdown.fromApi({
          'name': 'Meeting',
          'count': 10,
          'expenses': 250.50,
        });

        expect(breakdown.activityTypeName, 'Meeting');
        expect(breakdown.count, 10);
        expect(breakdown.totalExpenses, 250.50);
      });

      test('should handle missing name with empty string', () {
        final breakdown = ReportBreakdown.fromApi({
          'count': 5,
          'expenses': 100.0,
        });

        expect(breakdown.activityTypeName, '');
      });

      test('should handle missing count with zero', () {
        final breakdown = ReportBreakdown.fromApi({
          'name': 'Test',
          'expenses': 100.0,
        });

        expect(breakdown.count, 0);
      });

      test('should handle missing expenses with zero', () {
        final breakdown = ReportBreakdown.fromApi({
          'name': 'Test',
          'count': 5,
        });

        expect(breakdown.totalExpenses, 0.0);
      });

      test('should handle integer expenses', () {
        final breakdown = ReportBreakdown.fromApi({
          'name': 'Test',
          'count': 5,
          'expenses': 100,
        });

        expect(breakdown.totalExpenses, 100.0);
      });
    });

    group('sorting', () {
      test('should sort by count descending', () {
        final breakdowns = [
          ReportBreakdown.fromApi({'name': 'Low', 'count': 2, 'expenses': 100.0}),
          ReportBreakdown.fromApi({'name': 'High', 'count': 10, 'expenses': 50.0}),
          ReportBreakdown.fromApi({'name': 'Medium', 'count': 5, 'expenses': 200.0}),
        ];

        breakdowns.sort((a, b) => b.count.compareTo(a.count));

        expect(breakdowns[0].activityTypeName, 'High');
        expect(breakdowns[1].activityTypeName, 'Medium');
        expect(breakdowns[2].activityTypeName, 'Low');
      });

      test('should sort by expenses descending', () {
        final breakdowns = [
          ReportBreakdown.fromApi({'name': 'Low', 'count': 10, 'expenses': 50.0}),
          ReportBreakdown.fromApi({'name': 'High', 'count': 2, 'expenses': 500.0}),
          ReportBreakdown.fromApi({'name': 'Medium', 'count': 5, 'expenses': 200.0}),
        ];

        breakdowns.sort((a, b) => b.totalExpenses.compareTo(a.totalExpenses));

        expect(breakdowns[0].activityTypeName, 'High');
        expect(breakdowns[1].activityTypeName, 'Medium');
        expect(breakdowns[2].activityTypeName, 'Low');
      });
    });
  });

  group('ReportBreakdownWithComparison', () {
    test('should parse current period data', () {
      final breakdown = ReportBreakdownWithComparison.fromApi({
        'typeId': 'type-123',
        'name': 'Meeting',
        'count': 10,
        'expenses': 500.0,
        'growthDirection': 'positive',
      });

      expect(breakdown.typeId, 'type-123');
      expect(breakdown.activityTypeName, 'Meeting');
      expect(breakdown.count, 10);
      expect(breakdown.totalExpenses, 500.0);
      expect(breakdown.growthDirection, GrowthDirection.positive);
    });

    test('should parse previous period data', () {
      final breakdown = ReportBreakdownWithComparison.fromApi({
        'typeId': 'type-123',
        'name': 'Meeting',
        'count': 10,
        'expenses': 500.0,
        'previous': {
          'count': 5,
          'expenses': 250.0,
        },
        'growthDirection': 'positive',
      });

      expect(breakdown.previousCount, 5);
      expect(breakdown.previousExpenses, 250.0);
    });

    test('should parse change data', () {
      final breakdown = ReportBreakdownWithComparison.fromApi({
        'typeId': 'type-123',
        'name': 'Meeting',
        'count': 10,
        'expenses': 500.0,
        'change': {
          'count': {'value': 5.0, 'percent': 100.0},
          'expenses': {'value': 250.0, 'percent': 100.0},
        },
        'growthDirection': 'positive',
      });

      expect(breakdown.change, isNotNull);
      expect(breakdown.change!.count.value, 5.0);
      expect(breakdown.change!.count.percent, 100.0);
      expect(breakdown.change!.expenses.value, 250.0);
    });

    test('should handle negative growth direction', () {
      final breakdown = ReportBreakdownWithComparison.fromApi({
        'typeId': 'type-123',
        'name': 'Meeting',
        'count': 10,
        'expenses': 500.0,
        'growthDirection': 'negative',
      });

      expect(breakdown.growthDirection, GrowthDirection.negative);
    });

    test('should handle neutral growth direction', () {
      final breakdown = ReportBreakdownWithComparison.fromApi({
        'typeId': 'type-123',
        'name': 'Meeting',
        'count': 10,
        'expenses': 500.0,
        'growthDirection': 'neutral',
      });

      expect(breakdown.growthDirection, GrowthDirection.neutral);
    });
  });

  group('ChangeValue', () {
    test('should format positive value with plus sign', () {
      final change = ChangeValue.fromApi({'value': 5.0, 'percent': 25.0});

      expect(change.formattedValue, '+5');
      expect(change.formattedPercent, '+25.0%');
    });

    test('should format negative value without plus sign', () {
      final change = ChangeValue.fromApi({'value': -5.0, 'percent': -25.0});

      expect(change.formattedValue, '-5');
      expect(change.formattedPercent, '-25.0%');
    });

    test('should format decimal values', () {
      final change = ChangeValue.fromApi({'value': 5.55, 'percent': 25.5});

      expect(change.formattedValue, '+5.55');
      expect(change.formattedPercent, '+25.5%');
    });

    test('should format combined string', () {
      final change = ChangeValue.fromApi({'value': 10.0, 'percent': 50.0});

      expect(change.formatted, '+10 (+50.0%)');
    });
  });
}

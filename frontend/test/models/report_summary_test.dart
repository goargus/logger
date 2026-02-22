import 'package:flutter_test/flutter_test.dart';
import 'package:logger/models/report_summary.dart';

void main() {
  group('ReportSummary', () {
    group('fromApi', () {
      test('parses complete API response', () {
        final summary = ReportSummary.fromApi({
          'totals': {'activities': 5, 'expenses': 120.50, 'usersSubmitted': 1},
          'period': {
            'startDate': '2024-01-01',
            'endDate': '2024-01-14',
            'status': 'active',
          },
        });

        expect(summary.totalActivities, 5);
        expect(summary.totalExpenses, 120.50);
        expect(summary.isReported, isTrue);
        expect(summary.periodStart, '2024-01-01');
        expect(summary.periodEnd, '2024-01-14');
        expect(summary.status, 'active');
      });

      test('defaults missing fields gracefully', () {
        final summary = ReportSummary.fromApi({});

        expect(summary.totalActivities, 0);
        expect(summary.totalExpenses, 0.0);
        expect(summary.isReported, isFalse);
        expect(summary.periodStart, '');
        expect(summary.periodEnd, '');
        expect(summary.status, 'Activo');
      });
    });

    group('statusLabel', () {
      test('translates active to Activo', () {
        final summary = _summaryWithStatus('active');
        expect(summary.statusLabel, 'Activo');
      });

      test('translates locked to Bloqueado', () {
        final summary = _summaryWithStatus('locked');
        expect(summary.statusLabel, 'Bloqueado');
      });

      test('handles uppercase variants', () {
        final summary = _summaryWithStatus('ACTIVE');
        expect(summary.statusLabel, 'Activo');
      });

      test('returns raw value for unknown statuses', () {
        final summary = _summaryWithStatus('custom');
        expect(summary.statusLabel, 'custom');
      });
    });

    group('empty', () {
      test('creates zeroed summary with Activo status', () {
        final summary = ReportSummary.empty();

        expect(summary.totalActivities, 0);
        expect(summary.totalExpenses, 0.0);
        expect(summary.isReported, isFalse);
        expect(summary.status, 'Activo');
      });
    });
  });
}

ReportSummary _summaryWithStatus(String status) {
  return ReportSummary(
    totalActivities: 0,
    totalExpenses: 0.0,
    isReported: false,
    periodStart: '',
    periodEnd: '',
    status: status,
  );
}

import 'package:flutter_test/flutter_test.dart';
import 'package:logger/models/report_summary.dart';
import 'package:logger/utils/currency_formatter.dart';

void main() {
  group('Reports bugs', () {
    group('BUG-001: status label localization', () {
      test('statusLabel maps "active" to "Activo"', () {
        final summary = ReportSummary.fromApi({
          'totals': {'activities': 5, 'expenses': 100.0},
          'period': {
            'startDate': '2026-02-01',
            'endDate': '2026-02-28',
            'status': 'active',
          },
        });
        expect(summary.statusLabel, equals('Activo'));
      });

      test('statusLabel maps "locked" to "Bloqueado"', () {
        final summary = ReportSummary.fromApi({
          'totals': {'activities': 0, 'expenses': 0},
          'period': {
            'startDate': '2026-02-01',
            'endDate': '2026-02-28',
            'status': 'locked',
          },
        });
        expect(summary.statusLabel, equals('Bloqueado'));
      });

      test('statusLabel passes through unknown status values', () {
        final summary = ReportSummary.fromApi({
          'totals': {'activities': 0, 'expenses': 0},
          'period': {
            'startDate': '2026-02-01',
            'endDate': '2026-02-28',
            'status': 'custom',
          },
        });
        expect(summary.statusLabel, equals('custom'));
      });

      test('status defaults to "Activo" when missing from API', () {
        final summary = ReportSummary.fromApi({
          'totals': {'activities': 0, 'expenses': 0},
          'period': {
            'startDate': '2026-02-01',
            'endDate': '2026-02-28',
          },
        });
        expect(summary.status, equals('Activo'));
      });

      test('status defaults to "Activo" when period is null', () {
        final summary = ReportSummary.fromApi({});
        expect(summary.status, equals('Activo'));
      });
    });

    group('BUG-002: Currency symbol inconsistency', () {
      // reports_view.dart:274-278 creates SummaryCards WITHOUT passing currencySymbol.
      // SummaryCards defaults to '\$' (summary_cards.dart:15).
      // Same for ComparisonBreakdownTable at reports_view.dart:281-284.
      //
      // The fix: ReportsViewContent should be a ConsumerStatefulWidget that
      // reads ref.watch(currencySymbolProvider) and passes it to child widgets.

      test('CurrencyFormatter.format uses provided symbol, not hardcoded', () {
        expect(CurrencyFormatter.format(100.0, 'L.'), equals('L.100.00'));
        expect(CurrencyFormatter.format(100.0, '\$'), equals('\$100.00'));
        expect(CurrencyFormatter.format(0.0, 'L.'), equals('L.0.00'));
      });

      test('CurrencyFormatter.format respects decimal places', () {
        expect(CurrencyFormatter.format(1250.75, 'L.', decimals: 2),
            equals('L.1250.75'));
        expect(CurrencyFormatter.format(1250.75, 'L.', decimals: 0),
            equals('L.1251'));
      });

      test('CurrencyFormatter.formatString handles null/empty values', () {
        expect(CurrencyFormatter.formatString(null, 'L.'), equals('L.0'));
        expect(CurrencyFormatter.formatString('', 'L.'), equals('L.0'));
        expect(
            CurrencyFormatter.formatString('150.50', 'L.'), equals('L.150.50'));
      });
    });

    group('ReportSummary model', () {
      test('fromApi parses complete response', () {
        final summary = ReportSummary.fromApi({
          'totals': {
            'activities': 10,
            'expenses': 500.75,
            'usersSubmitted': 3,
          },
          'period': {
            'startDate': '2026-02-01',
            'endDate': '2026-02-28',
            'status': 'active',
          },
        });
        expect(summary.totalActivities, equals(10));
        expect(summary.totalExpenses, equals(500.75));
        expect(summary.isReported, isTrue);
        expect(summary.periodStart, equals('2026-02-01'));
        expect(summary.periodEnd, equals('2026-02-28'));
      });

      test('fromApi handles empty totals', () {
        final summary = ReportSummary.fromApi(<String, dynamic>{
          'totals': <String, dynamic>{},
          'period': <String, dynamic>{
            'startDate': '2026-01-01',
            'endDate': '2026-01-31',
          },
        });
        expect(summary.totalActivities, equals(0));
        expect(summary.totalExpenses, equals(0.0));
        expect(summary.isReported, isFalse);
      });

      test('isReported is true only when usersSubmitted > 0', () {
        final reported = ReportSummary.fromApi(<String, dynamic>{
          'totals': <String, dynamic>{'usersSubmitted': 1},
          'period': <String, dynamic>{},
        });
        expect(reported.isReported, isTrue);

        final notReported = ReportSummary.fromApi(<String, dynamic>{
          'totals': <String, dynamic>{'usersSubmitted': 0},
          'period': <String, dynamic>{},
        });
        expect(notReported.isReported, isFalse);
      });

      test('empty factory returns sensible defaults', () {
        final empty = ReportSummary.empty();
        expect(empty.totalActivities, equals(0));
        expect(empty.totalExpenses, equals(0.0));
        expect(empty.isReported, isFalse);
        expect(empty.status, equals('Activo'));
      });
    });
  });
}

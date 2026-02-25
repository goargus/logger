import 'package:flutter_test/flutter_test.dart';
import 'package:logger/models/dashboard_stats.dart';
import '../helpers/fake_data.dart';

void main() {
  group('DashboardStats', () {
    group('fromApi parsing', () {
      test('parses standard API response correctly', () {
        final stats =
            DashboardStats.fromApi(FakeData.dashboardStatsApiResponse());
        expect(stats.totalActivities, equals(8));
        expect(stats.viaticoUsed, equals(1250.75));
        expect(stats.visits, equals(5));
        expect(stats.bibleStudies, equals(3));
        expect(stats.month, equals(2));
        expect(stats.year, equals(2026));
      });

      test('handles empty breakdown gracefully', () {
        final stats = DashboardStats.fromApi(
            FakeData.dashboardStatsApiResponse(byType: []));
        expect(stats.visits, equals(0));
        expect(stats.bibleStudies, equals(0));
        expect(stats.totalActivities, equals(8));
      });

      test('handles missing summary gracefully', () {
        final stats = DashboardStats.fromApi({});
        expect(stats.totalActivities, equals(0));
        expect(stats.viaticoUsed, equals(0.0));
        expect(stats.visits, equals(0));
        expect(stats.bibleStudies, equals(0));
      });

      test('handles null breakdown gracefully', () {
        final stats = DashboardStats.fromApi({
          'summary': {
            'totals': {'activities': 5, 'expenses': 100.0},
            'period': {'startDate': '2026-02-01'},
          },
          'breakdown': null,
        });
        expect(stats.totalActivities, equals(5));
        expect(stats.visits, equals(0));
      });

      test('counts Visita types correctly (case insensitive pattern)', () {
        final stats = DashboardStats.fromApi(
          FakeData.dashboardStatsApiResponse(byType: [
            {'name': 'Visita Pastoral', 'count': 3},
            {'name': 'Visita de Enfermo', 'count': 2},
            {'name': 'Estudio Bíblico', 'count': 1},
          ]),
        );
        expect(stats.visits, equals(5));
        expect(stats.bibleStudies, equals(1));
      });

      test(
          'BUG-007: stat card names depend on activity type name patterns', () {
        // DashboardStats.fromApi checks name.contains('visita') for visits
        // and name.contains('estudio') && name.contains('b') && name.contains('blic')
        // for bible studies. This is fragile string matching.

        // If type name is "Visitas Domiciliarias" (contains 'visita'), it counts
        final stats1 = DashboardStats.fromApi(
          FakeData.dashboardStatsApiResponse(byType: [
            {'name': 'Visitas Domiciliarias', 'count': 4},
          ]),
        );
        expect(stats1.visits, equals(4));

        // If type name doesn't match the pattern, it's NOT counted as visits
        final stats2 = DashboardStats.fromApi(
          FakeData.dashboardStatsApiResponse(byType: [
            {'name': 'Reunión Familiar', 'count': 4},
          ]),
        );
        expect(stats2.visits, equals(0));

        // "Estudio Bíblico" matches the bible study pattern
        final stats3 = DashboardStats.fromApi(
          FakeData.dashboardStatsApiResponse(byType: [
            {'name': 'Estudio Bíblico', 'count': 2},
          ]),
        );
        expect(stats3.bibleStudies, equals(2));
      });

      test('handles zero expenses correctly', () {
        final stats = DashboardStats.fromApi(
            FakeData.dashboardStatsApiResponse(expenses: 0.0));
        expect(stats.viaticoUsed, equals(0.0));
      });

      test('handles large expense values', () {
        final stats = DashboardStats.fromApi(
            FakeData.dashboardStatsApiResponse(expenses: 999999.99));
        expect(stats.viaticoUsed, equals(999999.99));
      });
    });

    group('empty factory', () {
      test('creates stats with zero values for current month', () {
        final stats = DashboardStats.empty();
        expect(stats.visits, equals(0));
        expect(stats.bibleStudies, equals(0));
        expect(stats.viaticoUsed, equals(0.0));
        expect(stats.totalActivities, equals(0));
        expect(stats.month, equals(DateTime.now().month));
        expect(stats.year, equals(DateTime.now().year));
      });
    });
  });
}

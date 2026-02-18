import 'package:logger/models/activity.dart';
import 'package:logger/models/dashboard_stats.dart';

class FakeData {
  static DashboardStats dashboardStats() => const DashboardStats(
        visits: 5,
        bibleStudies: 3,
        viaticoUsed: 1250.75,
        reportsCount: 8,
        month: 2,
        year: 2026,
        totalActivities: 8,
      );

  static DashboardStats emptyDashboardStats() => DashboardStats.empty();

  static List<Activity> recentActivities() => [
        Activity(
          id: 'act-001',
          date: DateTime(2026, 2, 15),
          category: 'Visita Pastoral',
          activityTypeId: 'type-001',
          description: 'Visited family in need',
          expense: 150.50,
          hasExpense: true,
          locked: false,
          status: 'active',
          ownerUserId: 'user-field-001',
          ownerUsername: 'obrero.campo1',
        ),
        Activity(
          id: 'act-002',
          date: DateTime(2026, 2, 14),
          category: 'Estudio Bíblico',
          activityTypeId: 'type-002',
          description: 'Weekly bible study group',
          expense: 0,
          hasExpense: false,
          locked: false,
          status: 'active',
          ownerUserId: 'user-field-001',
          ownerUsername: 'obrero.campo1',
        ),
      ];

  /// API response format for DashboardStats.fromApi()
  static Map<String, dynamic> dashboardStatsApiResponse({
    int activities = 8,
    double expenses = 1250.75,
    String startDate = '2026-02-01',
    List<Map<String, dynamic>>? byType,
  }) =>
      {
        'summary': {
          'totals': {'activities': activities, 'expenses': expenses},
          'period': {'startDate': startDate},
        },
        'breakdown': {
          'byType': byType ??
              [
                {'name': 'Visita Pastoral', 'count': 5},
                {'name': 'Estudio Bíblico', 'count': 3},
              ],
        },
      };
}

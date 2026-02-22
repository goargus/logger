import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'widgets/layouts/app_shell.dart';
import 'pages/dashboard.dart';
import 'pages/activities_list_page.dart';
import 'pages/activity_detail_page.dart';
import 'pages/reports_page.dart';
import 'pages/user_activities_page.dart';
import 'pages/leadership_dashboard_page.dart';

/// Route path constants
class AppRoutes {
  static const dashboard = '/';
  static const activities = '/activities';
  static const activityDetail = '/activities/:id';
  static const reports = '/reports';
  static const userActivities = '/reports/user/:userId';
  static const leadershipDashboard = '/leadership';

  /// Generate activity detail path with ID
  static String activityDetailPath(String id) => '/activities/$id';

  /// Generate user activities path with user ID
  static String userActivitiesPath(String userId) => '/reports/user/$userId';
}

/// GoRouter configuration provider
final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: AppRoutes.dashboard,
    routes: [
      ShellRoute(
        builder: (context, state, child) {
          return AppShell(
            currentPath: state.uri.path,
            child: child,
          );
        },
        routes: [
          GoRoute(
            path: AppRoutes.dashboard,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: DashboardContent(),
            ),
          ),
          GoRoute(
            path: AppRoutes.activities,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ActivitiesListContent(),
            ),
          ),
          GoRoute(
            path: AppRoutes.activityDetail,
            pageBuilder: (context, state) {
              final id = state.pathParameters['id']!;
              return NoTransitionPage(
                child: ActivityDetailContent(activityId: id),
              );
            },
          ),
          GoRoute(
            path: AppRoutes.reports,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ReportsPage(),
            ),
          ),
          GoRoute(
            path: AppRoutes.userActivities,
            pageBuilder: (context, state) {
              final userId = state.pathParameters['userId']!;
              return NoTransitionPage(
                child: UserActivitiesPage(userId: userId),
              );
            },
          ),
          GoRoute(
            path: AppRoutes.leadershipDashboard,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: LeadershipDashboardContent(),
            ),
          ),
        ],
      ),
    ],
  );
});

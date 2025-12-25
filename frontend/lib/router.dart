import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'widgets/layouts/app_shell.dart';
import 'pages/dashboard.dart';
import 'pages/activities_list_page.dart';
import 'pages/activity_detail_page.dart';
import 'pages/reports_view.dart';

/// Route path constants
class AppRoutes {
  static const dashboard = '/';
  static const activities = '/activities';
  static const activityDetail = '/activities/:id';
  static const reports = '/reports';

  /// Generate activity detail path with ID
  static String activityDetailPath(String id) => '/activities/$id';
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
              child: ReportsViewContent(),
            ),
          ),
        ],
      ),
    ],
  );
});

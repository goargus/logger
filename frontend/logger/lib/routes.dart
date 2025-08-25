import 'package:flutter/material.dart';
import 'pages/ dashboard_missionary.dart';
import 'pages/reports_view.dart';

class Routes {
  static const dashboardMissionary = '/';
  static const reports = '/reports';
}

Map<String, WidgetBuilder> appRoutes(String userName) {
  return {
    Routes.dashboardMissionary: (_) =>
        DashboardMissionaryPage(userName: userName),
    Routes.reports: (_) => const ReportsViewPage(),
  };
}

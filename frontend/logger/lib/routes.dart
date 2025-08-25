import 'package:flutter/material.dart';
import 'pages/ dashboard_missionary.dart';
import 'pages/reports_view.dart';

class Routes {
  static const dashboardMissionary = '/';
  static const reports = '/reports';
}

final Map<String, WidgetBuilder> appRoutes = {
  Routes.dashboardMissionary: (_) => const DashboardMissionaryPage(),
  Routes.reports: (_) => const ReportsViewPage(),
};

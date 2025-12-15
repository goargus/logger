import 'package:flutter/material.dart';
import 'pages/dashboard.dart';
import 'pages/reports_view.dart';

class Routes {
  static const dashboard = '/';
  static const reports = '/reports';
}

Map<String, WidgetBuilder> appRoutes() {
  return {
    Routes.dashboard: (_) => const DashboardPage(),
    Routes.reports: (_) => const ReportsViewPage(),
  };
}

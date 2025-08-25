import 'package:flutter/material.dart';
import 'routes.dart';
import 'theme/ app_theme.dart';

class MissionaryApp extends StatelessWidget {
  const MissionaryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Missionary App',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routes: appRoutes,
      initialRoute: Routes.dashboardMissionary,
    );
  }
}

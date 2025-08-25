import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'routes.dart';
import 'theme/ app_theme.dart';

class MissionaryApp extends StatelessWidget {
  final String userName;
  const MissionaryApp({super.key, required this.userName});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Missionary App',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,

      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('es'),
        Locale('en'),
      ],
      locale: const Locale('es'),

      routes: appRoutes(userName),
      initialRoute: Routes.dashboardMissionary,
    );
  }
}

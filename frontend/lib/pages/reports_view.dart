import 'package:flutter/material.dart';
import '../../widgets/layouts/app_shell.dart';
import '../../widgets/layouts/responsive_container.dart';
import '../routes.dart';

class ReportsViewPage extends StatelessWidget {
  const ReportsViewPage({super.key});

  @override
  Widget build(BuildContext context) {
    return AppShell(
      activeRoute: Routes.reports,
      body: const ResponsiveContainer(
        child: Center(child: Text('Aquí verás tus reportes (TODO).')),
      ),
    );
  }
}

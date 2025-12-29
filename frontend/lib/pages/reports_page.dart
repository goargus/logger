import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth.dart';
import 'reports_view.dart';
import 'hierarchy_reports_page.dart';

/// Unified reports page with conditional tabs based on user permissions
class ReportsPage extends ConsumerWidget {
  const ReportsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final canViewReports = ref.watch(canViewReportsProvider);

    // If user can't view hierarchy reports, show personal reports directly
    if (!canViewReports) {
      return const ReportsViewContent();
    }

    // User has permission - show tabbed interface
    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          Container(
            color: Theme.of(context).colorScheme.surface,
            child: const TabBar(
              tabs: [
                Tab(
                  icon: Icon(Icons.person),
                  text: 'Mi Reporte',
                ),
                Tab(
                  icon: Icon(Icons.business),
                  text: 'Entidad',
                ),
              ],
            ),
          ),
          const Expanded(
            child: TabBarView(
              children: [
                ReportsViewContent(),
                HierarchyReportsContent(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

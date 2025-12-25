import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../widgets/activities/activity_filters.dart';
import '../widgets/activities/paginated_activities_table.dart';
import '../widgets/common/pdf_export_button.dart';
import '../providers/activities_list_provider.dart';
import '../core/layout_constants.dart';
import '../router.dart';

/// Content-only widget for activities list - shell is handled by AppShell via router
class ActivitiesListContent extends ConsumerWidget {
  const ActivitiesListContent({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activitiesAsync = ref.watch(activitiesListProvider);

    return SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.max,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with title and PDF export
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Text(
                'Mis Actividades',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                ),
              ),
              activitiesAsync.when(
                data: (state) => PdfExportButton(
                  activities: state.items,
                  filter: state.filter,
                ),
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ],
          ),
          const SizedBox(height: LayoutConstants.spacing24),

          // Filter bar
          const ActivityFilters(),
          const SizedBox(height: LayoutConstants.spacing24),

          // Table with pagination
          activitiesAsync.when(
            data: (state) => PaginatedActivitiesTable(
              items: state.items,
              page: state.page,
              totalPages: state.totalPages,
              total: state.total,
              onPageChange: (page) {
                ref.read(activitiesListProvider.notifier).setPage(page);
              },
              onRowTap: (activity) {
                if (activity.id != null) {
                  context.go(AppRoutes.activityDetailPath(activity.id!));
                }
              },
            ),
            loading: () => const Center(
              child: Padding(
                padding: EdgeInsets.all(40.0),
                child: CircularProgressIndicator(),
              ),
            ),
            error: (error, stackTrace) => Center(
              child: Padding(
                padding: const EdgeInsets.all(40.0),
                child: Column(
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 48,
                      color: Colors.red.shade300,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Error al cargar actividades',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Colors.red.shade700,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      error.toString(),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey.shade600,
                          ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () {
                        ref.read(activitiesListProvider.notifier).refresh();
                      },
                      icon: const Icon(Icons.refresh),
                      label: const Text('Reintentar'),
                    ),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: LayoutConstants.spacing40),
        ],
      ),
    );
  }
}

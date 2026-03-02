import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/activity.dart';
import '../widgets/activities/activity_filters.dart';
import '../widgets/activities/paginated_activities_table.dart';
import '../widgets/common/pdf_export_button.dart';
import '../widgets/dialogs/activity_form_dialog.dart';
import '../widgets/dialogs/delete_activity_dialog.dart';
import '../providers/activities_list_provider.dart';
import '../providers/auth.dart';
import '../core/layout_constants.dart';
import '../core/snackbars.dart';
import '../config/api_config.dart';
import '../auth/auth_utils.dart';
import '../router.dart';

/// Content-only widget for activities list - shell is handled by AppShell via router
class ActivitiesListContent extends ConsumerStatefulWidget {
  const ActivitiesListContent({super.key});

  @override
  ConsumerState<ActivitiesListContent> createState() =>
      _ActivitiesListContentState();
}

class _ActivitiesListContentState extends ConsumerState<ActivitiesListContent> {
  static const _sortColumns = [
    'activityDate',
    'activityType',
    'description',
    'expenseAmount'
  ];

  int? _sortColumnIndex(String? sortBy) {
    if (sortBy == null) return null;
    final idx = _sortColumns.indexOf(sortBy);
    return idx >= 0 ? idx : null;
  }

  void _onSort(int columnIndex, bool ascending) {
    if (columnIndex >= _sortColumns.length) return;
    ref.read(activitiesListProvider.notifier).setSort(
          _sortColumns[columnIndex],
          ascending,
        );
  }

  Future<void> _showEditDialog(Activity activity) async {
    final activityData = {
      'id': activity.id,
      'activityTypeId': activity.activityTypeId,
      'activityDate': activity.date.toIso8601String(),
      'description': activity.description,
      'hasExpense': activity.hasExpense,
      'expenseAmount': activity.expense.toString(),
    };

    final result = await showDialog<Map<String, dynamic>?>(
      context: context,
      builder: (_) => ActivityFormDialog(
        baseUrl: ApiConfig.baseUrl,
        existingActivity: activityData,
        getAccessToken: () async {
          return await AuthUtils.getAccessTokenEnsured(ref) ?? '';
        },
        onRequireLogin: () {
          Navigator.of(context).pop();
          ref.read(authNotifierProvider.notifier).login();
        },
      ),
    );

    if (result != null && mounted) {
      Snackbars.showSuccess(context, 'Actividad actualizada');
      ref.read(activitiesListProvider.notifier).refresh();
    }
  }

  Future<void> _showDeleteDialog(Activity activity) async {
    final activityData = {
      'id': activity.id,
      'activityTypeName': activity.category,
      'activityDate': activity.date.toIso8601String(),
    };

    final deleted = await showDialog<bool?>(
      context: context,
      barrierDismissible: false,
      builder: (_) => DeleteActivityDialog(
        activity: activityData,
        baseUrl: ApiConfig.baseUrl,
        getAccessToken: () async {
          return await AuthUtils.getAccessTokenEnsured(ref) ?? '';
        },
        onRequireLogin: () {
          Navigator.of(context).pop();
          ref.read(authNotifierProvider.notifier).login();
        },
      ),
    );

    if (deleted == true && mounted) {
      Snackbars.showSuccess(context, 'Actividad eliminada');
      ref.read(activitiesListProvider.notifier).refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
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
              sortColumnIndex: _sortColumnIndex(state.sortBy),
              sortAscending: state.sortAscending,
              onSort: _onSort,
              onPageChange: (page) {
                ref.read(activitiesListProvider.notifier).setPage(page);
              },
              onRowTap: (activity) {
                if (activity.id != null) {
                  context.go(AppRoutes.activityDetailPath(activity.id!));
                }
              },
              onEdit: _showEditDialog,
              onDelete: _showDeleteDialog,
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

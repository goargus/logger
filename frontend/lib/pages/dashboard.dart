import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../models/dashboard_stats.dart';
import '../router.dart';

import '../core/layout_constants.dart';
import '../core/snackbars.dart';
import '../core/errors/error_handler.dart';
import '../auth/auth_utils.dart';

import '../widgets/headers/welcome_header.dart';
import '../widgets/pills/month_header_pill.dart';
import '../widgets/lists/activities_section.dart';
import '../widgets/stats/stats_section.dart';
import '../widgets/buttons/primary_action_button.dart';
import '../widgets/dialogs/activity_form_dialog.dart';
import '../widgets/dialogs/delete_activity_dialog.dart';

import '../models/activity.dart';
import '../providers/auth.dart';
import '../providers/activities.dart';
import '../providers/expenses.dart';
import '../config/api_config.dart';

/// Content-only widget for dashboard - shell is handled by AppShell via router
class DashboardContent extends ConsumerStatefulWidget {
  const DashboardContent({super.key});

  @override
  ConsumerState<DashboardContent> createState() => _DashboardContentState();
}

class _DashboardContentState extends ConsumerState<DashboardContent> {
  final DashboardStats _cfg = const DashboardStats(
    visits: 15,
    bibleStudies: 10,
    viaticoUsed: 1500,
    reportsCount: 20,
    month: 10,
    year: 2025,
  );

  Future<void> _openCreateDialog() async {
    if (!mounted) return;

    try {
      final created = await showDialog<Map<String, dynamic>?>(
        context: context,
        barrierDismissible: false,
        builder: (_) => ActivityFormDialog(
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

      if (created != null && mounted) {
        // Refresh activities
        ref.read(recentActivitiesProvider.notifier).refresh();

        final expense = () {
          final v = created['expenseAmount'] ?? created['expense_amount'];
          if (v == null) return 0.0;
          final s = v.toString();
          return double.tryParse(s) ?? 0.0;
        }();

        // Refresh expenses if there's an expense amount
        if (expense > 0) {
          ref.read(monthlyExpensesProvider.notifier).refresh();
        }

        if (mounted) {
          Snackbars.showSuccess(
            context,
            'Actividad creada exitosamente',
          );
        }
      }
    } catch (e) {
      debugPrint('Error en _openCreateDialog: $e');
      if (mounted) {
        Snackbars.showError(context, 'Error: $e');
      }
    }
  }

  Future<void> _openEditDialog(Activity activity) async {
    if (!mounted) return;

    final activityData = {
      'id': activity.id,
      'activityTypeId': activity.activityTypeId,
      'activityDate': activity.date.toIso8601String(),
      'description': activity.description,
      'hasExpense': activity.hasExpense,
      'expenseAmount': activity.expense.toString(),
    };

    try {
      final result = await showDialog<Map<String, dynamic>?>(
        context: context,
        barrierDismissible: false,
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
        ref.read(recentActivitiesProvider.notifier).refresh();
        ref.read(monthlyExpensesProvider.notifier).refresh();
        Snackbars.showSuccess(context, 'Actividad actualizada');
      }
    } catch (e) {
      debugPrint('Error en _openEditDialog: $e');
      if (mounted) {
        Snackbars.showError(context, 'Error: $e');
      }
    }
  }

  Future<void> _openDeleteDialog(Activity activity) async {
    if (!mounted) return;

    final activityData = {
      'id': activity.id,
      'activityTypeName': activity.category,
      'activityDate': activity.date.toIso8601String(),
    };

    try {
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
        ref.read(recentActivitiesProvider.notifier).refresh();
        ref.read(monthlyExpensesProvider.notifier).refresh();
        Snackbars.showSuccess(context, 'Actividad eliminada');
      }
    } catch (e) {
      debugPrint('Error en _openDeleteDialog: $e');
      if (mounted) {
        Snackbars.showError(context, 'Error: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);
    final activitiesAsync = ref.watch(recentActivitiesProvider);
    final expensesAsync = ref.watch(monthlyExpensesProvider);

    final userName = authState.user?['first_name'] ??
        authState.user?['name'] ??
        authState.user?['nickname'] ??
        'Usuario';

    return SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.max,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          WelcomeHeader(userName: userName),
          const SizedBox(height: LayoutConstants.spacing20),
          const MonthHeaderPill(),
          const SizedBox(height: LayoutConstants.spacing20),
          // Expenses section with AsyncValue
          expensesAsync.when(
            data: (expenses) => StatsSection(
              stats: _cfg,
              isLoadingExpenses: false,
              monthlyExpenseTotal: expenses.total,
              onReportsTap: () => context.go(AppRoutes.reports),
            ),
            loading: () => StatsSection(
              stats: _cfg,
              isLoadingExpenses: true,
              monthlyExpenseTotal: 0.0,
              onReportsTap: () => context.go(AppRoutes.reports),
            ),
            error: (error, stack) => StatsSection(
              stats: _cfg,
              isLoadingExpenses: false,
              monthlyExpenseTotal: 0.0,
              onReportsTap: () => context.go(AppRoutes.reports),
            ),
          ),
          const SizedBox(height: LayoutConstants.spacing40),
          Row(
            children: [
              PrimaryActionButton(
                label: 'Agregar Actividad',
                icon: Icons.add,
                onPressed: _openCreateDialog,
              ),
              const SizedBox(width: LayoutConstants.spacing12),
              // Show refresh button on error
              if (activitiesAsync.hasError)
                TextButton.icon(
                  onPressed: () {
                    ref.read(recentActivitiesProvider.notifier).refresh();
                  },
                  icon: const Icon(Icons.refresh),
                  label: const Text('Recargar'),
                ),
            ],
          ),
          const SizedBox(height: LayoutConstants.spacing24),
          // Activities section with AsyncValue
          activitiesAsync.when(
            data: (activities) => ActivitiesSection(
              isLoading: false,
              isAuthenticated: authState.isAuthenticated,
              activities: activities,
              onRefresh: () {
                ref.read(recentActivitiesProvider.notifier).refresh();
              },
              onEdit: _openEditDialog,
              onDelete: _openDeleteDialog,
            ),
            loading: () => ActivitiesSection(
              isLoading: true,
              isAuthenticated: authState.isAuthenticated,
              activities: const [],
              onRefresh: () {
                ref.read(recentActivitiesProvider.notifier).refresh();
              },
              onEdit: _openEditDialog,
              onDelete: _openDeleteDialog,
            ),
            error: (error, stack) => Column(
              children: [
                ActivitiesSection(
                  isLoading: false,
                  isAuthenticated: authState.isAuthenticated,
                  activities: const [],
                  onRefresh: () {
                    ref.read(recentActivitiesProvider.notifier).refresh();
                  },
                  onEdit: _openEditDialog,
                  onDelete: _openDeleteDialog,
                ),
                const SizedBox(height: LayoutConstants.spacing12),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.errorContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.error_outline,
                        color: Theme.of(context).colorScheme.onErrorContainer,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          ErrorHandler.normalizeError(error).userMessage,
                          style: TextStyle(
                            color:
                                Theme.of(context).colorScheme.onErrorContainer,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: LayoutConstants.spacing24),
        ],
      ),
    );
  }
}

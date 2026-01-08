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
import '../providers/dashboard_stats.dart';
import '../config/api_config.dart';

class DashboardContent extends ConsumerStatefulWidget {
  const DashboardContent({super.key});

  @override
  ConsumerState<DashboardContent> createState() => _DashboardContentState();
}

class _DashboardContentState extends ConsumerState<DashboardContent> {
  String? _getUserId() {
    final authState = ref.read(authNotifierProvider);
    return authState.user?['id'] as String?;
  }

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(dashboardStatsProvider.notifier).refresh(_getUserId());
    });
  }

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
        ref.read(recentActivitiesProvider.notifier).refresh();
        ref.read(dashboardStatsProvider.notifier).refresh(_getUserId());

        final expense = () {
          final v = created['expenseAmount'] ?? created['expense_amount'];
          if (v == null) return 0.0;
          final s = v.toString();
          return double.tryParse(s) ?? 0.0;
        }();

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
        ref.read(dashboardStatsProvider.notifier).refresh(_getUserId());
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
        ref.read(dashboardStatsProvider.notifier).refresh(_getUserId());
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
    final dashboardStatsAsync = ref.watch(dashboardStatsProvider);

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
          // Stats section with AsyncValue
          dashboardStatsAsync.when(
            data: (stats) => expensesAsync.when(
              data: (expenses) => StatsSection(
                stats: stats,
                isLoadingExpenses: false,
                monthlyExpenseTotal: expenses.total,
                onReportsTap: () => context.go(AppRoutes.reports),
              ),
              loading: () => StatsSection(
                stats: stats,
                isLoadingExpenses: true,
                monthlyExpenseTotal: 0.0,
                onReportsTap: () => context.go(AppRoutes.reports),
              ),
              error: (error, stack) => StatsSection(
                stats: stats,
                isLoadingExpenses: false,
                monthlyExpenseTotal: 0.0,
                onReportsTap: () => context.go(AppRoutes.reports),
              ),
            ),
            loading: () => StatsSection(
              stats: DashboardStats.empty(),
              isLoadingExpenses: true,
              monthlyExpenseTotal: 0.0,
              onReportsTap: () => context.go(AppRoutes.reports),
            ),
            error: (error, stack) => StatsSection(
              stats: DashboardStats.empty(),
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

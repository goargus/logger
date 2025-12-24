import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/dashboard_stats.dart';
import '../routes.dart';

import '../core/layout_constants.dart';
import '../core/snackbars.dart';
import '../core/errors/error_handler.dart';
import '../auth/auth_utils.dart';

import '../widgets/nav/sidebar_nav.dart';
import '../widgets/headers/welcome_header.dart';
import '../widgets/pills/month_header_pill.dart';
import '../widgets/lists/activities_section.dart';
import '../widgets/stats/stats_section.dart';
import '../widgets/buttons/primary_action_button.dart';
import '../widgets/dialogs/create_activity_dialog.dart';

import '../providers/auth.dart';
import '../providers/activities.dart';
import '../providers/expenses.dart';
import '../config/api_config.dart';

class DashboardPage extends ConsumerStatefulWidget {
  const DashboardPage({super.key});

  @override
  ConsumerState<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends ConsumerState<DashboardPage> {
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
        builder: (_) => CreateActivityDialog(
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

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);
    final activitiesAsync = ref.watch(recentActivitiesProvider);
    final expensesAsync = ref.watch(monthlyExpensesProvider);

    final userName = authState.user?['first_name'] ??
        authState.user?['name'] ??
        authState.user?['nickname'] ??
        'Usuario';
    final userEmail = authState.user?['first_name'] ?? '';

    return GestureDetector(
      onTap: () {
        FocusScope.of(context).unfocus();
        FocusManager.instance.primaryFocus?.unfocus();
      },
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        body: SafeArea(
          top: true,
          child: Row(
            mainAxisSize: MainAxisSize.max,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (MediaQuery.of(context).size.width >
                  LayoutConstants.desktopBreakpoint)
                SidebarNav(
                  userName: userName,
                  userEmail: userEmail,
                  userPicture: authState.user?['picture'],
                  activeRoute: Routes.dashboard,
                  onCreateActivity: _openCreateDialog,
                ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(
                    LayoutConstants.spacing20,
                    LayoutConstants.spacing20,
                    LayoutConstants.spacing20,
                    0.0,
                  ),
                  child: SingleChildScrollView(
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
                            onReportsTap: () =>
                                Navigator.pushNamed(context, Routes.reports),
                          ),
                          loading: () => StatsSection(
                            stats: _cfg,
                            isLoadingExpenses: true,
                            monthlyExpenseTotal: 0.0,
                            onReportsTap: () =>
                                Navigator.pushNamed(context, Routes.reports),
                          ),
                          error: (error, stack) => StatsSection(
                            stats: _cfg,
                            isLoadingExpenses: false,
                            monthlyExpenseTotal: 0.0,
                            onReportsTap: () =>
                                Navigator.pushNamed(context, Routes.reports),
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
                                  ref
                                      .read(recentActivitiesProvider.notifier)
                                      .refresh();
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
                              ref
                                  .read(recentActivitiesProvider.notifier)
                                  .refresh();
                            },
                          ),
                          loading: () => ActivitiesSection(
                            isLoading: true,
                            isAuthenticated: authState.isAuthenticated,
                            activities: const [],
                            onRefresh: () {
                              ref
                                  .read(recentActivitiesProvider.notifier)
                                  .refresh();
                            },
                          ),
                          error: (error, stack) => Column(
                            children: [
                              ActivitiesSection(
                                isLoading: false,
                                isAuthenticated: authState.isAuthenticated,
                                activities: const [],
                                onRefresh: () {
                                  ref
                                      .read(recentActivitiesProvider.notifier)
                                      .refresh();
                                },
                              ),
                              const SizedBox(height: LayoutConstants.spacing12),
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .errorContainer,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      Icons.error_outline,
                                      color: Theme.of(context)
                                          .colorScheme
                                          .onErrorContainer,
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        ErrorHandler.normalizeError(error)
                                            .userMessage,
                                        style: TextStyle(
                                          color: Theme.of(context)
                                              .colorScheme
                                              .onErrorContainer,
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
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

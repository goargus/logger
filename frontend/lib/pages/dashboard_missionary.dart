import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/activity.dart';
import '../models/dashboard_config.dart';
import '../routes.dart';

import '../core/layout_constants.dart';
import '../core/snackbars.dart';
import '../auth/auth_utils.dart';

import '../widgets/nav/sidebar_nav.dart';
import '../widgets/headers/welcome_header.dart';
import '../widgets/pills/month_header_pill.dart';
import '../widgets/lists/activities_section.dart';
import '../widgets/stats/stats_section.dart';
import '../widgets/buttons/primary_action_button.dart';
import '../widgets/dialogs/create_activity_dialog.dart';

import '../providers/auth.dart';
import '../services/activity.dart';

class DashboardMissionaryPage extends ConsumerStatefulWidget {
  const DashboardMissionaryPage({super.key});

  @override
  ConsumerState<DashboardMissionaryPage> createState() =>
      _DashboardMissionaryPageState();
}

class _DashboardMissionaryPageState
    extends ConsumerState<DashboardMissionaryPage> {
  static const String _apiBaseUrl = 'http://localhost:3000';

  late ActivityService _activityService;
  double _monthlyExpenseTotal = 0.0;
  bool _isLoadingExpenses = false;
  List<Activity> _recentActivities = [];
  bool _isLoadingActivities = false;
  bool _hasAttemptedLoad = false;

  @override
  void initState() {
    super.initState();
    _activityService = ActivityService.localhost(
        () async => await AuthUtils.getAccessTokenEnsured(ref) ?? '');
  }

  Future<void> _initializeData() async {
    if (_isLoadingExpenses || _isLoadingActivities) {
      return;
    }

    final authState = ref.read(authNotifierProvider);
    if (!authState.isAuthenticated || authState.accessToken == null) {
      return;
    }

    if (!mounted) return;
    setState(() {
      _isLoadingExpenses = true;
      _isLoadingActivities = true;
    });

    try {
      final token = await AuthUtils.getAccessTokenEnsured(ref);

      if (token != null && token.isNotEmpty && mounted) {
        await _loadMonthlyExpenses();
        if (mounted) {
          await _loadRecentActivities();
        }
      } else {
        if (mounted) {
          setState(() {
            _isLoadingExpenses = false;
            _isLoadingActivities = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingExpenses = false;
          _isLoadingActivities = false;
        });
      }
    }
  }

  Future<void> _loadMonthlyExpenses() async {
    if (!mounted) return;

    try {
      final now = DateTime.now();
      final total = await _activityService.getMonthlyExpenseTotal(
        year: now.year,
        month: now.month,
      );
      if (mounted) {
        setState(() {
          _monthlyExpenseTotal = total;
          _isLoadingExpenses = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _monthlyExpenseTotal = 0.0;
          _isLoadingExpenses = false;
        });
      }
    }
  }

  Future<void> _loadRecentActivities() async {
    if (!mounted) return;

    try {
      final activitiesData =
          await _activityService.getRecentActivities(limit: 5);
      final activities =
          activitiesData.map((data) => Activity.fromApi(data)).toList();

      if (mounted) {
        setState(() {
          _recentActivities = activities;
          _isLoadingActivities = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _recentActivities = [];
          _isLoadingActivities = false;
        });
      }
    }
  }

  final DashboardConfig _cfg = const DashboardConfig(
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
          baseUrl: _apiBaseUrl,
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
        await _loadRecentActivities();

        final expense = () {
          final v = created['expenseAmount'] ?? created['expense_amount'];
          if (v == null) return 0.0;
          final s = v.toString();
          return double.tryParse(s) ?? 0.0;
        }();

        if (expense > 0) {
          await _loadMonthlyExpenses();
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
    return Consumer(
      builder: (context, ref, _) {
        final authState = ref.watch(authNotifierProvider);

        if (authState.isAuthenticated &&
            authState.accessToken != null &&
            _recentActivities.isEmpty &&
            !_isLoadingActivities &&
            !_hasAttemptedLoad) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              setState(() {
                _hasAttemptedLoad = true;
              });
              _initializeData();
            }
          });
        }

        if (!authState.isAuthenticated) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              setState(() {
                _isLoadingExpenses = false;
                _isLoadingActivities = false;
                _hasAttemptedLoad = false;
                _recentActivities = [];
                _monthlyExpenseTotal = 0.0;
              });
            }
          });
        }

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
                            StatsSection(
                              config: _cfg,
                              isLoadingExpenses: _isLoadingExpenses,
                              monthlyExpenseTotal: _monthlyExpenseTotal,
                              onReportsTap: () =>
                                  Navigator.pushNamed(context, Routes.reports),
                            ),
                            const SizedBox(height: LayoutConstants.spacing40),
                            Row(
                              children: [
                                PrimaryActionButton(
                                  label: 'Agregar Actividad',
                                  icon: Icons.add,
                                  onPressed: _openCreateDialog,
                                ),
                                const SizedBox(
                                    width: LayoutConstants.spacing12),
                                if (authState.isAuthenticated &&
                                    _recentActivities.isEmpty &&
                                    !_isLoadingActivities &&
                                    _hasAttemptedLoad)
                                  TextButton.icon(
                                    onPressed: () {
                                      setState(() {
                                        _hasAttemptedLoad = false;
                                      });
                                      _initializeData();
                                    },
                                    icon: const Icon(Icons.refresh),
                                    label: const Text('Recargar'),
                                  ),
                              ],
                            ),
                            const SizedBox(height: LayoutConstants.spacing24),
                            ActivitiesSection(
                              isLoading: _isLoadingActivities,
                              isAuthenticated: authState.isAuthenticated,
                              activities: _recentActivities,
                              onRefresh: () {
                                setState(() {
                                  _hasAttemptedLoad = false;
                                });
                                _initializeData();
                              },
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
      },
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/activity.dart';
import '../models/dashboard_config.dart';
import '../routes.dart';

import '../widgets/layouts/app_shell.dart';
import '../widgets/layouts/responsive_container.dart';
import '../widgets/headers/page_title.dart';
import '../widgets/pills/info_pill.dart';
import '../widgets/stats/stat_card.dart';
import '../widgets/stats/stat_grid.dart';
import '../widgets/stats/cta_report_card.dart';
import '../widgets/buttons/primary_action_button.dart';
import '../widgets/lists/activities_table.dart';
import '../widgets/dialogs/create_activity_dialog.dart';

import '../auth/session.dart';
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
        () async => await _getAccessTokenEnsured() ?? '');
  }

  Future<void> _initializeData() async {
    if (_isLoadingExpenses || _isLoadingActivities) {
      return;
    }

    final authState = ref.read(authProvider);
    if (!authState.isAuthenticated || authState.credentials == null) {
      return;
    }

    if (!mounted) return;
    setState(() {
      _isLoadingExpenses = true;
      _isLoadingActivities = true;
    });

    try {
      final token = await _getAccessTokenEnsured();
      
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

  Future<String?> _getAccessTokenEnsured() async {
    try {
      final authState = ref.read(authProvider);
      if (authState.isAuthenticated && authState.credentials != null) {
        final token = authState.credentials!.accessToken;
        

        await Session.instance.setAccessToken(token);
        return token;
      }

      final sessionToken = await Session.instance.getAccessToken();
      if (sessionToken != null && sessionToken.isNotEmpty) {
        return sessionToken;
      }

      return null;
    } catch (e) {
      return null;
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
      final activitiesData = await _activityService.getRecentActivities(limit: 3);
      final activities = activitiesData
          .map((data) => Activity.fromApi(data))
          .toList();
      
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
            final authState = ref.read(authProvider);
            if (authState.isAuthenticated && authState.credentials != null) {
              return authState.credentials!.accessToken;
            }
            
            final sessionToken = await Session.instance.getAccessToken();
            if (sessionToken != null && sessionToken.isNotEmpty) {
              return sessionToken;
            }
            
            return '';
          },
          onRequireLogin: () {
            Navigator.of(context).pop();
            ref.read(authProvider.notifier).login();
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
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Actividad creada exitosamente'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Error en _openCreateDialog: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const association = 'Asociación Central';
    const fields = ['Siguatepeque', 'Comayagua'];

    final subtitle =
        'Asociación: $association\nCampos a Cargo: ${fields.join(', ')}';

    return Consumer(
      builder: (context, ref, _) {
        final authState = ref.watch(authProvider);
        
        if (authState.isAuthenticated && 
            authState.credentials != null &&
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
        
        return AppShell(
          activeRoute: Routes.dashboardMissionary,
          body: ResponsiveContainer(
            child: ListView(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Consumer(
                    builder: (context, ref, _) {
                      final authState = ref.watch(authProvider);
                      final userName = authState.credentials?.user.name ??
                          authState.credentials?.user.nickname ??
                          'Usuario';
                      return PageTitle(
                        title: 'Bienvenido, $userName',
                        subtitle: subtitle,
                      );
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const InfoPill(
                    label: 'Actividades en el Mes', icon: Icons.checklist),
                const SizedBox(width: 8),
                InfoPill(
                    label: _monthLabel(_cfg.month, _cfg.year),
                    icon: Icons.calendar_month),
              ],
            ),
            const SizedBox(height: 12),
            StatGrid(
              children: [
                StatCard(
                  title: 'Visitas Misioneras',
                  value: '${_cfg.visits}',
                  icon: Icons.groups_2,
                ),
                StatCard(
                  title: 'Estudios Bíblicos',
                  value: '${_cfg.bibleStudies}',
                  icon: Icons.menu_book_outlined,
                ),
                StatCard(
                  title: 'Viático Utilizado',
                  value: _isLoadingExpenses
                      ? 'Cargando...'
                      : 'L.${_monthlyExpenseTotal.toStringAsFixed(0)}',
                  icon: Icons.payments_outlined,
                ),
                CtaReportCard(
                  reports: _cfg.reportsCount,
                  onTap: () => Navigator.pushNamed(context, Routes.reports),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.only(top: 4.0, bottom: 8.0),
              child: Row(
                children: [
                  PrimaryActionButton(
                    label: 'Agregar Actividad',
                    icon: Icons.add,
                    onPressed: _openCreateDialog,
                  ),
                  const SizedBox(width: 12),
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
            ),
            Text('Actividades Recientes',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            _isLoadingActivities
                ? const Center(child: CircularProgressIndicator())
                : _recentActivities.isEmpty
                    ? Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            children: [
                              const Icon(Icons.info_outline, size: 48, color: Colors.grey),
                              const SizedBox(height: 8),
                              Text(
                                'No hay actividades recientes',
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                authState.isAuthenticated 
                                    ? 'Agrega tu primera actividad para verla aquí'
                                    : 'Inicia sesión para ver tus actividades',
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                    : ActivitiesTable(items: _recentActivities),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
      },
    );
  }

  String _monthLabel(int month, int year) {
    const m = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre'
    ];
    return '${m[month - 1]} $year';
  }
}

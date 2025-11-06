import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../models/activity.dart';
import '../models/dashboard_config.dart';
import '../routes.dart';
import '../theme/app_theme.dart';

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
      final authState = ref.read(authNotifierProvider);
      if (authState.isAuthenticated && authState.accessToken != null) {
        final token = authState.accessToken!;

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
      final activitiesData =
          await _activityService.getRecentActivities(limit: 3);
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
            final authState = ref.read(authNotifierProvider);
            if (authState.isAuthenticated && authState.accessToken != null) {
              return authState.accessToken!;
            }

            final sessionToken = await Session.instance.getAccessToken();
            if (sessionToken != null && sessionToken.isNotEmpty) {
              return sessionToken;
            }

            return '';
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
                  // Sidebar Navigation
                  if (MediaQuery.of(context).size.width > 900)
                    Container(
                      width: 270.0,
                      height: double.infinity,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [
                            AppTheme.sidebarStart,
                            AppTheme.sidebarEnd,
                          ],
                          stops: [0.0, 1.0],
                          begin: AlignmentDirectional(0.0, -1.0),
                          end: AlignmentDirectional(0, 1.0),
                        ),
                        border: Border.all(
                          color: Theme.of(context).dividerColor,
                          width: 1.0,
                        ),
                      ),
                      child: Padding(
                        padding: const EdgeInsetsDirectional.fromSTEB(
                            0.0, 24.0, 0.0, 16.0),
                        child: Column(
                          mainAxisSize: MainAxisSize.max,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Logo
                            Padding(
                              padding: const EdgeInsetsDirectional.fromSTEB(
                                  16.0, 0.0, 16.0, 12.0),
                              child: Row(
                                mainAxisSize: MainAxisSize.max,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(8.0),
                                    child: Image.asset(
                                      'assets/images/LOGO2.png',
                                      width: 150.0,
                                      height: 150.0,
                                      fit: BoxFit.cover,
                                      errorBuilder: (context, error, stackTrace) {
                                        return Container(
                                          width: 150.0,
                                          height: 150.0,
                                          color: Colors.white24,
                                          child: const Icon(
                                            Icons.church,
                                            size: 60,
                                            color: Colors.white,
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Divider(
                              height: 12.0,
                              thickness: 2.0,
                              color: Theme.of(context).dividerColor,
                            ),
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsetsDirectional.fromSTEB(
                                    0.0, 80.0, 0.0, 0.0),
                                child: Column(
                                  mainAxisSize: MainAxisSize.max,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Padding(
                                      padding:
                                          const EdgeInsetsDirectional.fromSTEB(
                                              16.0, 12.0, 0.0, 0.0),
                                      child: Text(
                                        'Platform Navigation',
                                        style: Theme.of(context)
                                            .textTheme
                                            .labelMedium
                                            ?.copyWith(
                                              color: Colors.white70,
                                              letterSpacing: 0.0,
                                            ),
                                      ),
                                    ),
                                    // Dashboard Nav Item
                                    Padding(
                                      padding:
                                          const EdgeInsetsDirectional.fromSTEB(
                                              16.0, 0.0, 16.0, 0.0),
                                      child: Container(
                                        width: double.infinity,
                                        height: 44.0,
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.2),
                                          borderRadius:
                                              BorderRadius.circular(12.0),
                                        ),
                                        child: Padding(
                                          padding: const EdgeInsetsDirectional
                                              .fromSTEB(8.0, 0.0, 6.0, 0.0),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.max,
                                            children: [
                                              const Icon(
                                                Icons.dashboard,
                                                color: Colors.white,
                                                size: 24.0,
                                              ),
                                              Padding(
                                                padding:
                                                    const EdgeInsetsDirectional
                                                        .fromSTEB(
                                                        12.0, 0.0, 0.0, 0.0),
                                                child: Text(
                                                  'Dashboard',
                                                  style: Theme.of(context)
                                                      .textTheme
                                                      .bodyMedium
                                                      ?.copyWith(
                                                        color: Colors.white,
                                                        letterSpacing: 0.0,
                                                      ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                    // Create Activity Nav Item
                                    Padding(
                                      padding:
                                          const EdgeInsetsDirectional.fromSTEB(
                                              16.0, 0.0, 16.0, 0.0),
                                      child: InkWell(
                                        onTap: _openCreateDialog,
                                        child: Container(
                                          width: double.infinity,
                                          height: 44.0,
                                          decoration: BoxDecoration(
                                            color: Colors.transparent,
                                            borderRadius:
                                                BorderRadius.circular(12.0),
                                          ),
                                          child: Padding(
                                            padding:
                                                const EdgeInsetsDirectional
                                                    .fromSTEB(
                                                    8.0, 0.0, 6.0, 0.0),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.max,
                                              children: [
                                                const Icon(
                                                  Icons.add_circle_outline,
                                                  color: Colors.white,
                                                  size: 24.0,
                                                ),
                                                Padding(
                                                  padding:
                                                      const EdgeInsetsDirectional
                                                          .fromSTEB(12.0, 0.0,
                                                          0.0, 0.0),
                                                  child: Text(
                                                    'Nueva Actividad',
                                                    style: Theme.of(context)
                                                        .textTheme
                                                        .bodyMedium
                                                        ?.copyWith(
                                                          color: Colors.white,
                                                          letterSpacing: 0.0,
                                                        ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                    // Reports Nav Item
                                    Padding(
                                      padding:
                                          const EdgeInsetsDirectional.fromSTEB(
                                              16.0, 0.0, 16.0, 0.0),
                                      child: InkWell(
                                        onTap: () => Navigator.pushNamed(
                                            context, Routes.reports),
                                        child: Container(
                                          width: double.infinity,
                                          height: 44.0,
                                          decoration: BoxDecoration(
                                            color: Colors.transparent,
                                            borderRadius:
                                                BorderRadius.circular(12.0),
                                          ),
                                          child: Padding(
                                            padding:
                                                const EdgeInsetsDirectional
                                                    .fromSTEB(
                                                    8.0, 0.0, 6.0, 0.0),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.max,
                                              children: [
                                                const Icon(
                                                  Icons.bar_chart,
                                                  color: Colors.white,
                                                  size: 24.0,
                                                ),
                                                Padding(
                                                  padding:
                                                      const EdgeInsetsDirectional
                                                          .fromSTEB(12.0, 0.0,
                                                          0.0, 0.0),
                                                  child: Text(
                                                    'Reportes',
                                                    style: Theme.of(context)
                                                        .textTheme
                                                        .bodyMedium
                                                        ?.copyWith(
                                                          color: Colors.white,
                                                          letterSpacing: 0.0,
                                                        ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 12.0),
                                  ],
                                ),
                              ),
                            ),
                            Divider(
                              height: 12.0,
                              thickness: 2.0,
                              color: Theme.of(context).dividerColor,
                            ),
                            // User Profile Section
                            Padding(
                              padding: const EdgeInsetsDirectional.fromSTEB(
                                  16.0, 12.0, 16.0, 12.0),
                              child: Row(
                                mainAxisSize: MainAxisSize.max,
                                children: [
                                  Container(
                                    width: 50.0,
                                    height: 50.0,
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(12.0),
                                      border: Border.all(
                                        color: Colors.white,
                                        width: 2.0,
                                      ),
                                    ),
                                    child: Padding(
                                      padding: const EdgeInsets.all(2.0),
                                      child: ClipRRect(
                                        borderRadius:
                                            BorderRadius.circular(8.0),
                                        child: authState.user?['picture'] != null
                                            ? Image.network(
                                                authState.user!['picture'],
                                                width: 44.0,
                                                height: 44.0,
                                                fit: BoxFit.cover,
                                                errorBuilder: (context, error,
                                                    stackTrace) {
                                                  return Container(
                                                    width: 44.0,
                                                    height: 44.0,
                                                    color: Colors.white24,
                                                    child: const Icon(
                                                      Icons.person,
                                                      color: Colors.white,
                                                    ),
                                                  );
                                                },
                                              )
                                            : Container(
                                                width: 44.0,
                                                height: 44.0,
                                                color: Colors.white24,
                                                child: const Icon(
                                                  Icons.person,
                                                  color: Colors.white,
                                                ),
                                              ),
                                      ),
                                    ),
                                  ),
                                  Expanded(
                                    child: Padding(
                                      padding:
                                          const EdgeInsetsDirectional.fromSTEB(
                                              12.0, 0.0, 0.0, 0.0),
                                      child: Column(
                                        mainAxisSize: MainAxisSize.max,
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            userName,
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodyLarge
                                                ?.copyWith(
                                                  color: Colors.white,
                                                  letterSpacing: 0.0,
                                                ),
                                          ),
                                          Text(
                                            userEmail,
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodySmall
                                                ?.copyWith(
                                                  color: Colors.white70,
                                                  letterSpacing: 0.0,
                                                ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  // Main Content Area
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsetsDirectional.fromSTEB(
                          20.0, 20.0, 20.0, 0.0),
                      child: SingleChildScrollView(
                        child: Column(
                          mainAxisSize: MainAxisSize.max,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Welcome Header
                            Text(
                              'Bienvenido, Hno $userName',
                              style: Theme.of(context)
                                  .textTheme
                                  .headlineLarge
                                  ?.copyWith(
                                    color: const Color(0xFFFFB547),
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.0,
                                  ),
                            ),
                            const SizedBox(height: 12),
                            // Campos a Cargo
                            Row(
                              children: [
                                Text(
                                  'Campos a Cargo:',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodyLarge
                                      ?.copyWith(
                                        fontWeight: FontWeight.w600,
                                        color: Colors.black87,
                                      ),
                                ),
                                const SizedBox(width: 12),
                                ...fields.map((field) => Padding(
                                      padding: const EdgeInsets.only(right: 8.0),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 16.0,
                                          vertical: 6.0,
                                        ),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFEFEFFF),
                                          borderRadius: BorderRadius.circular(20.0),
                                        ),
                                        child: Text(
                                          field,
                                          style: const TextStyle(
                                            color: Color.fromARGB(255, 0, 0, 0),
                                            fontWeight: FontWeight.w600,
                                            fontSize: 14,
                                          ),
                                        ),
                                      ),
                                    )),
                              ],
                            ),
                            const SizedBox(height: 12),
                            // Asociación
                            Row(
                              children: [
                                Text(
                                  'Asociación:',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodyLarge
                                      ?.copyWith(
                                        fontWeight: FontWeight.w600,
                                        color: Colors.black87,
                                      ),
                                ),
                                const SizedBox(width: 12),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16.0,
                                    vertical: 6.0,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEFEFFF),
                                    borderRadius: BorderRadius.circular(20.0),
                                  ),
                                  child: Text(
                                    association,
                                    style: const TextStyle(
                                      color: Color.fromARGB(255, 0, 0, 0),
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),
                            // Month Header
                            Row(
                              children: [
                                Text(
                                  'Actividades en el Mes',
                                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                    fontWeight: FontWeight.w600,
                                    color: Colors.black87,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF5A623),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(
                                        Icons.calendar_today,
                                        size: 16,
                                        color: Colors.white,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        DateFormat('MMMM yyyy', 'es').format(DateTime.now()),
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w600,
                                          fontSize: 14,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),
                            // Stats Grid
                            StatGrid(
                              children: [
                                StatCard(
                                  title: 'Visitas Misioneras',
                                  value: '${_cfg.visits}',
                                  icon: Icons.groups_2,
                                  backgroundImage: const AssetImage(
                                      'assets/high-angle-children-holding-hands.jpg'),
                                ),
                                StatCard(
                                  title: 'Estudios Bíblicos',
                                  value: '${_cfg.bibleStudies}',
                                  icon: Icons.menu_book_outlined,
                                  backgroundImage: const AssetImage(
                                      'assets/medium-shot-people-book-club.jpg'),
                                ),
                                StatCard(
                                  title: 'Viático Utilizado',
                                  value: _isLoadingExpenses
                                      ? 'Cargando...'
                                      : 'L.${_monthlyExpenseTotal.toStringAsFixed(0)}',
                                  icon: Icons.payments_outlined,
                                  backgroundImage: const AssetImage(
                                      'assets/financial-data-analysis.jpg'),
                                ),
                                CtaReportCard(
                                  reports: _cfg.reportsCount,
                                  onTap: () =>
                                      Navigator.pushNamed(context, Routes.reports),
                                ),
                              ],
                            ),
                            const SizedBox(height: 40),
                            // Add Activity Button
                            Row(
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
                            const SizedBox(height: 24),
                            // Recent Activities Section
                            _isLoadingActivities
                                ? const Center(
                                    child: CircularProgressIndicator())
                                : _recentActivities.isEmpty
                                    ? Card(
                                        child: Padding(
                                          padding: const EdgeInsets.all(32.0),
                                          child: Column(
                                            children: [
                                              const Icon(Icons.info_outline,
                                                  size: 48, color: Colors.grey),
                                              const SizedBox(height: 8),
                                              Text(
                                                'No hay actividades recientes',
                                                style: Theme.of(context)
                                                    .textTheme
                                                    .titleMedium,
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                authState.isAuthenticated
                                                    ? 'Agrega tu primera actividad para verla aquí'
                                                    : 'Inicia sesión para ver tus actividades',
                                                style: Theme.of(context)
                                                    .textTheme
                                                    .bodyMedium
                                                    ?.copyWith(
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

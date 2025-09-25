import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/ activity.dart';
import '../models/dashboard_config.dart';
import '../routes.dart';

import '../widgets/layouts/app_shell.dart';
import '../widgets/layouts/responsive_container.dart';
import '../widgets/headers/ page_title.dart';
import '../widgets/pills/ info_pill.dart';
import '../widgets/stats/stat_card.dart';
import '../widgets/stats/stat_grid.dart';
import '../widgets/stats/ cta_report_card.dart';
import '../widgets/buttons/primary_action_button.dart';
import '../widgets/lists/ activities_table.dart';
import '../widgets/dialogs/create_activity_dialog.dart';

import '../auth/session.dart';
import '../providers/auth.dart';

class DashboardMissionaryPage extends ConsumerStatefulWidget {
  const DashboardMissionaryPage({super.key});

  @override
  ConsumerState<DashboardMissionaryPage> createState() =>
      _DashboardMissionaryPageState();
}

class _DashboardMissionaryPageState extends ConsumerState<DashboardMissionaryPage> {
  static const String _apiBaseUrl = 'http://localhost:3000';

  @override
  void initState() {
    super.initState();
    _warmAuth();
  }

  Future<void> _warmAuth() async {
    try {
      await _getAccessTokenEnsured();
    } catch (_) {
    }
  }

Future<String?> _getAccessTokenEnsured() async {
  // Get token from current auth state
  final authState = ref.read(authProvider);
  if (authState.isAuthenticated && authState.credentials != null) {
  final token = authState.credentials!.accessToken;
    await Session.instance.setAccessToken(token);
    return token;
  }
  
  // Check session storage
  final sessionToken = await Session.instance.getAccessToken();
  if (sessionToken != null && sessionToken.isNotEmpty) {
    print('DEBUG: Session Token: ${sessionToken.substring(0, 50)}...');
    return sessionToken;
  }
  
  print('DEBUG: No token available');
  return null;
}


  final DashboardConfig _cfg = const DashboardConfig(
    visits: 15,
    bibleStudies: 10,
    viaticoUsed: 1500,
    reportsCount: 20,
    month: 6,
    year: 2025,
  );

  final List<Activity> _recent = [
    Activity(
      date: DateTime(2025, 6, 5),
      category: 'Visita Misionera',
      description: 'Visita a la Hna. Lidia en Lajas, Comayagua',
      expense: 180,
    ),
    Activity(
      date: DateTime(2025, 6, 5),
      category: 'Visita Misionera',
      description: 'Visita a la Hna. Lidia en Lajas, Comayagua',
      expense: 180,
    ),
    Activity(
      date: DateTime(2025, 6, 5),
      category: 'Visita Misionera',
      description: 'Visita a la Hna. Lidia en Lajas, Comayagua',
      expense: 180,
    ),
  ];

  Future<void> _openCreateDialog() async {
    final token = await _getAccessTokenEnsured();
    if (token == null || token.isEmpty) {
      ref.read(authProvider.notifier).login();
      return;
    }

    final created = await showDialog<Map<String, dynamic>?>(
      context: context,
      barrierDismissible: false,
      builder: (_) => CreateActivityDialog(
        baseUrl: _apiBaseUrl,
        getAccessToken: _getAccessTokenEnsured,
        onRequireLogin: () => ref.read(authProvider.notifier).login(),
      ),
    );

    if (created != null) {
      final DateTime date = () {
        final raw = created['date'];
        if (raw is String) {
          try {
            return DateTime.parse(raw);
          } catch (_) {}
        }
        return DateTime.now();
      }();

      final String category =
          (created['type'] is Map && (created['type']['name'] is String))
              ? created['type']['name'] as String
              : (created['type_name'] as String? ??
                  created['typeId'] as String? ??
                  created['type_id'] as String? ??
                  'Actividad');

      final String description = (created['description'] as String?) ?? '';

      final double expense = () {
        final v = created['expenseAmount'] ?? created['expense_amount'];
        if (v == null) return 0.0;
        final s = v.toString();
        return double.tryParse(s) ?? 0.0;
      }();

      final activity = Activity(
        date: date,
        category: category,
        description: description,
        expense: expense,
      );

      setState(() => _recent.insert(0, activity));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Actividad creada')),
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
                const InfoPill(label: 'Actividades en el Mes', icon: Icons.checklist),
                const SizedBox(width: 8),
                InfoPill(label: _monthLabel(_cfg.month, _cfg.year), icon: Icons.calendar_month),
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
                  value: 'L.${_cfg.viaticoUsed.toStringAsFixed(0)}',
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
              child: Align(
                alignment: Alignment.centerLeft,
                child: PrimaryActionButton(
                  label: 'Agregar Actividad',
                  icon: Icons.add,
                  onPressed: _openCreateDialog,
                ),
              ),
            ),

            Text('Actividades Recientes',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            ActivitiesTable(items: _recent),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  String _monthLabel(int month, int year) {
    const m = [
      'Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio',
      'Agosto','Septiembre','Octubre','Noviembre','Diciembre'
    ];
    return '${m[month - 1]} $year';
  }
}

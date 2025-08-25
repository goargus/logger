import 'package:flutter/material.dart';

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

class DashboardMissionaryPage extends StatefulWidget {
  final String userName;
  const DashboardMissionaryPage({super.key, required this.userName});

  @override
  State<DashboardMissionaryPage> createState() =>
      _DashboardMissionaryPageState();
}

class _DashboardMissionaryPageState extends State<DashboardMissionaryPage> {
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
    final created = await showDialog<Activity>(
      context: context,
      barrierDismissible: false,
      builder: (_) => const CreateActivityDialog(),
    );
    if (created != null) {
      setState(() {
        _recent.insert(0, created);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Actividad creada.')),
      );
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
                  child: PageTitle(
                    title: 'Bienvenido, ${widget.userName}',
                    subtitle: subtitle,
                  ),
                ),
                PrimaryActionButton(
                  label: 'Agregar Actividad',
                  icon: Icons.add,
                  onPressed: _openCreateDialog,
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

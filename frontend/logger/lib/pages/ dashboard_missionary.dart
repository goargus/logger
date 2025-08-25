import 'package:flutter/material.dart';
import '../../models/user.dart';
import '../../models/user_role.dart';
import '../../models/ activity.dart';
import '../../models/dashboard_config.dart';
import '../routes.dart';
import '../theme/ app_theme.dart';
import '../../widgets/layouts/app_shell.dart';
import '../../widgets/layouts/responsive_container.dart';
import '../../widgets/headers/ page_title.dart';
import '../../widgets/pills/ info_pill.dart';
import '../../widgets/stats/stat_card.dart';
import '../../widgets/stats/stat_grid.dart';
import '../../widgets/stats/ cta_report_card.dart';
import '../../widgets/buttons/primary_action_button.dart';
import '../../widgets/lists/ activities_table.dart';

class DashboardMissionaryPage extends StatelessWidget {
  const DashboardMissionaryPage({super.key});

  // Mock data para empezar (luego conectarás a tu backend)
  AppUser get _user => const AppUser(
        id: 'u1',
        name: 'Hno Andrew',
        email: 'andrew@email.com',
        role: UserRole.missionary,
        association: 'Asociación Central',
        fields: ['Siguatepeque', 'Comayagua'],
      );

  DashboardConfig get _cfg => const DashboardConfig(
        visits: 15,
        bibleStudies: 10,
        viaticoUsed: 1500,
        reportsCount: 20,
        month: 6,
        year: 2025,
      );

  List<Activity> get _recent => [
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

  @override
  Widget build(BuildContext context) {
    final subtitle =
        'Asociación: ${_user.association}\nCampos a Cargo: ${_user.fields.join(', ')}';

    return AppShell(
      activeRoute: Routes.dashboardMissionary,
      body: ResponsiveContainer(
        child: ListView(
          children: [
            // Encabezado
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: PageTitle(
                    title: 'Bienvenido, ${_user.name}',
                    subtitle: subtitle,
                  ),
                ),
                PrimaryActionButton(
                  label: 'Agregar Actividad',
                  icon: Icons.add,
                  onPressed: () {
                    // TODO: abrir dialogo de crear actividad
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Crear actividad (TODO)')),
                    );
                  },
                )
              ],
            ),
            const SizedBox(height: 16),

            // Mes
            Row(
              children: [
                const Icon(Icons.calendar_month, size: 18),
                const SizedBox(width: 6),
                InfoPill(label: 'Actividades en el Mes'),
                const SizedBox(width: 8),
                InfoPill(label: _monthLabel(_cfg.month, _cfg.year)),
              ],
            ),
            const SizedBox(height: 12),

            // Stats
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

            // Tabla actividades
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

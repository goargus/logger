import 'package:flutter/material.dart';

import '../../models/dashboard_stats.dart';
import '../stats/stat_card.dart';
import '../stats/stat_grid.dart';

class StatsSection extends StatelessWidget {
  final DashboardConfig config;
  final bool isLoadingExpenses;
  final double monthlyExpenseTotal;
  final VoidCallback onReportsTap;

  const StatsSection({
    super.key,
    required this.config,
    required this.isLoadingExpenses,
    required this.monthlyExpenseTotal,
    required this.onReportsTap,
  });

  @override
  Widget build(BuildContext context) {
    return StatGrid(
      children: [
        StatCard(
          title: 'Visitas Misioneras',
          value: '${config.visits}',
          icon: Icons.groups_2,
          backgroundImage: const AssetImage(
            'assets/high-angle-children-holding-hands.jpg',
          ),
        ),
        StatCard(
          title: 'Estudios Bíblicos',
          value: '${config.bibleStudies}',
          icon: Icons.menu_book_outlined,
          backgroundImage: const AssetImage(
            'assets/medium-shot-people-book-club.jpg',
          ),
        ),
        StatCard(
          title: 'Viático Utilizado',
          value: isLoadingExpenses
              ? 'Cargando...'
              : 'L.${monthlyExpenseTotal.toStringAsFixed(0)}',
          icon: Icons.payments_outlined,
          backgroundImage: const AssetImage(
            'assets/financial-data-analysis.jpg',
          ),
        ),
      ],
    );
  }
}

class DashboardStats {
  final int visits;
  final int bibleStudies;
  final double viaticoUsed;
  final int reportsCount;
  final int month; // 1..12
  final int year;
  final int totalActivities;

  const DashboardStats({
    required this.visits,
    required this.bibleStudies,
    required this.viaticoUsed,
    required this.reportsCount,
    required this.month,
    required this.year,
    required this.totalActivities,
  });

  factory DashboardStats.fromApi(Map<String, dynamic> data) {
    final summary = data['summary'] as Map<String, dynamic>?;
    final breakdown = data['breakdown'] as Map<String, dynamic>?;

    final totals = summary?['totals'] as Map<String, dynamic>? ?? {};
    final totalActivities = (totals['activities'] as num?)?.toInt() ?? 0;
    final totalExpenses = (totals['expenses'] as num?)?.toDouble() ?? 0.0;

    final period = summary?['period'] as Map<String, dynamic>? ?? {};
    final startDate = period['startDate'] as String? ?? '';
    final now = DateTime.now();
    final periodDate =
        startDate.isNotEmpty ? DateTime.tryParse(startDate) ?? now : now;

    final byType = breakdown?['byType'] as List<dynamic>? ?? [];
    int visits = 0;
    int bibleStudies = 0;

    for (final item in byType) {
      final itemMap = item as Map<String, dynamic>;
      final name = (itemMap['name'] as String? ?? '').toLowerCase();
      final count = (itemMap['count'] as num?)?.toInt() ?? 0;

      if (name.contains('visita')) {
        visits += count;
      } 
      else if (name.contains('estudio') && name.contains('b') && name.contains('blic')) {
        bibleStudies += count;
      }
    }

    return DashboardStats(
      visits: visits,
      bibleStudies: bibleStudies,
      viaticoUsed: totalExpenses,
      reportsCount: totalActivities,
      month: periodDate.month,
      year: periodDate.year,
      totalActivities: totalActivities,
    );
  }

  factory DashboardStats.empty() {
    final now = DateTime.now();
    return DashboardStats(
      visits: 0,
      bibleStudies: 0,
      viaticoUsed: 0.0,
      reportsCount: 0,
      month: now.month,
      year: now.year,
      totalActivities: 0,
    );
  }
}

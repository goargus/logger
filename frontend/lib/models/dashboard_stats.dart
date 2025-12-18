class DashboardStats {
  final int visits;
  final int bibleStudies;
  final double viaticoUsed;
  final int reportsCount;
  final int month; // 1..12
  final int year;

  const DashboardStats({
    required this.visits,
    required this.bibleStudies,
    required this.viaticoUsed,
    required this.reportsCount,
    required this.month,
    required this.year,
  });
}

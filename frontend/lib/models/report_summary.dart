class ReportSummary {
  final int totalActivities;
  final double totalExpenses;
  final bool isReported;
  final String periodStart;
  final String periodEnd;
  final String status; // 'Activo', 'Inactivo', etc.

  const ReportSummary({
    required this.totalActivities,
    required this.totalExpenses,
    required this.isReported,
    required this.periodStart,
    required this.periodEnd,
    required this.status,
  });

  factory ReportSummary.fromApi(Map<String, dynamic> data) {
    final totals = data['totals'] as Map<String, dynamic>? ?? {};
    final period = data['period'] as Map<String, dynamic>? ?? {};
    
    final activities = (totals['activities'] as num?)?.toInt() ?? 0;
    final expenses = (totals['expenses'] as num?)?.toDouble() ?? 0.0;
    final usersSubmitted = (totals['usersSubmitted'] as num?)?.toInt() ?? 0;
    final isReported = usersSubmitted > 0;
    
    return ReportSummary(
      totalActivities: activities,
      totalExpenses: expenses,
      isReported: isReported,
      periodStart: period['startDate'] as String? ?? '',
      periodEnd: period['endDate'] as String? ?? '',
      status: period['status'] as String? ?? 'Activo',
    );
  }

  factory ReportSummary.empty() {
    return const ReportSummary(
      totalActivities: 0,
      totalExpenses: 0.0,
      isReported: false,
      periodStart: '',
      periodEnd: '',
      status: 'Activo',
    );
  }
}

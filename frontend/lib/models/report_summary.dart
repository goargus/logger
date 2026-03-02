class ReportSummary {
  final int totalActivities;
  final double totalExpenses;
  final int activityCount;
  final String? lastActivityDate;
  final double? trend;
  final String periodStart;
  final String periodEnd;
  final String status;

  static const _statusLabels = <String, String>{
    'active': 'Activo',
    'locked': 'Bloqueado',
  };

  String get statusLabel => _statusLabels[status.toLowerCase()] ?? status;

  const ReportSummary({
    required this.totalActivities,
    required this.totalExpenses,
    required this.activityCount,
    this.lastActivityDate,
    this.trend,
    required this.periodStart,
    required this.periodEnd,
    required this.status,
  });

  factory ReportSummary.fromApi(Map<String, dynamic> data) {
    final totals = data['totals'] as Map<String, dynamic>? ?? {};
    final period = data['period'] as Map<String, dynamic>? ?? {};

    final activities = (totals['activities'] as num?)?.toInt() ?? 0;
    final expenses = (totals['expenses'] as num?)?.toDouble() ?? 0.0;

    return ReportSummary(
      totalActivities: activities,
      totalExpenses: expenses,
      activityCount: activities,
      lastActivityDate: totals['lastActivityDate'] as String?,
      trend: (totals['trend'] as num?)?.toDouble(),
      periodStart: period['startDate'] as String? ?? '',
      periodEnd: period['endDate'] as String? ?? '',
      status: period['status'] as String? ?? 'active',
    );
  }

  factory ReportSummary.empty() {
    return const ReportSummary(
      totalActivities: 0,
      totalExpenses: 0.0,
      activityCount: 0,
      lastActivityDate: null,
      trend: null,
      periodStart: '',
      periodEnd: '',
      status: 'active',
    );
  }
}

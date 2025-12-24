class ReportBreakdown {
  final String activityTypeName;
  final int count;
  final double totalExpenses;

  const ReportBreakdown({
    required this.activityTypeName,
    required this.count,
    required this.totalExpenses,
  });

  factory ReportBreakdown.fromApi(Map<String, dynamic> data) {
    return ReportBreakdown(
      activityTypeName: data['name'] as String? ?? '',
      count: (data['count'] as num?)?.toInt() ?? 0,
      totalExpenses: (data['expenses'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

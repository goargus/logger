import 'leadership_reports.dart';

class LeadershipDashboardData {
  final TrendsResponse trends;
  final ComparisonResponse comparison;
  final RankingsResponse rankings;
  final ExpensesResponse expenses;

  const LeadershipDashboardData({
    required this.trends,
    required this.comparison,
    required this.rankings,
    required this.expenses,
  });
}

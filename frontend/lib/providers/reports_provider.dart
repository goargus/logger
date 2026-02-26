import 'package:flutter_riverpod/legacy.dart';
import '../models/report_summary.dart';
import '../models/report_breakdown.dart';

class ReportsState {
  final bool isLoading;
  final ReportSummary? summary;
  final List<ReportBreakdown> breakdown;
  final String? error;
  final DateTime periodStart;
  final DateTime periodEnd;

  const ReportsState({
    required this.isLoading,
    this.summary,
    required this.breakdown,
    this.error,
    required this.periodStart,
    required this.periodEnd,
  });

  factory ReportsState.initial() {
    final now = DateTime.now();
    final periodStart = DateTime(now.year, now.month, 1);
    final periodEnd = DateTime(now.year, now.month + 1, 0);

    return ReportsState(
      isLoading: false,
      summary: null,
      breakdown: const [],
      error: null,
      periodStart: periodStart,
      periodEnd: periodEnd,
    );
  }

  ReportsState copyWith({
    bool? isLoading,
    ReportSummary? summary,
    List<ReportBreakdown>? breakdown,
    String? error,
    DateTime? periodStart,
    DateTime? periodEnd,
  }) {
    return ReportsState(
      isLoading: isLoading ?? this.isLoading,
      summary: summary ?? this.summary,
      breakdown: breakdown ?? this.breakdown,
      error: error,
      periodStart: periodStart ?? this.periodStart,
      periodEnd: periodEnd ?? this.periodEnd,
    );
  }
}

final reportsProvider = StateProvider<ReportsState>((ref) {
  return ReportsState.initial();
});

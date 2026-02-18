import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/leadership_reports.dart';
import '../models/report_period_type.dart';
import '../services/reports_service.dart';
import '../core/errors/app_exception.dart';
import 'auth.dart';

/// State for leadership dashboard
class LeadershipDashboardState {
  final bool isLoading;
  final TrendsResponse? trends;
  final ComparisonResponse? comparison;
  final RankingsResponse? rankings;
  final ExpensesResponse? expenses;
  final String? error;
  final String? entityId;
  final String? dateFrom;
  final String? dateTo;
  final ReportPeriodType periodType;
  final int year;
  final int periodIndex;

  const LeadershipDashboardState({
    required this.isLoading,
    this.trends,
    this.comparison,
    this.rankings,
    this.expenses,
    this.error,
    this.entityId,
    this.dateFrom,
    this.dateTo,
    required this.periodType,
    required this.year,
    required this.periodIndex,
  });

  factory LeadershipDashboardState.initial() {
    final now = DateTime.now();
    return LeadershipDashboardState(
      isLoading: false,
      trends: null,
      comparison: null,
      rankings: null,
      expenses: null,
      error: null,
      entityId: null,
      dateFrom: null,
      dateTo: null,
      periodType: ReportPeriodType.monthly,
      year: now.year,
      periodIndex: now.month,
    );
  }

  LeadershipDashboardState copyWith({
    bool? isLoading,
    TrendsResponse? trends,
    ComparisonResponse? comparison,
    RankingsResponse? rankings,
    ExpensesResponse? expenses,
    String? error,
    String? entityId,
    String? dateFrom,
    String? dateTo,
    ReportPeriodType? periodType,
    int? year,
    int? periodIndex,
  }) {
    return LeadershipDashboardState(
      isLoading: isLoading ?? this.isLoading,
      trends: trends ?? this.trends,
      comparison: comparison ?? this.comparison,
      rankings: rankings ?? this.rankings,
      expenses: expenses ?? this.expenses,
      error: error,
      entityId: entityId ?? this.entityId,
      dateFrom: dateFrom ?? this.dateFrom,
      dateTo: dateTo ?? this.dateTo,
      periodType: periodType ?? this.periodType,
      year: year ?? this.year,
      periodIndex: periodIndex ?? this.periodIndex,
    );
  }

  bool get hasData =>
      trends != null ||
      comparison != null ||
      rankings != null ||
      expenses != null;
}

/// Provider for leadership dashboard
final leadershipDashboardProvider = StateNotifierProvider<
    LeadershipDashboardNotifier, LeadershipDashboardState>(
  (ref) {
    final authState = ref.watch(authNotifierProvider);
    Future<String> getAccessToken() async => authState.accessToken ?? '';

    return LeadershipDashboardNotifier(
      reportsService: ReportsService.localhost(getAccessToken),
      ref: ref,
    );
  },
);

class LeadershipDashboardNotifier
    extends StateNotifier<LeadershipDashboardState> {
  LeadershipDashboardNotifier({
    required this.reportsService,
    required this.ref,
  }) : super(LeadershipDashboardState.initial());

  final ReportsService reportsService;
  final Ref ref;

  Map<String, String> _calculatePeriodBounds(
    ReportPeriodType periodType,
    int year,
    int periodIndex,
  ) {
    DateTime start;
    DateTime end;

    switch (periodType) {
      case ReportPeriodType.monthly:
        start = DateTime(year, periodIndex, 1);
        end = DateTime(year, periodIndex + 1, 0, 23, 59, 59);
        break;
      case ReportPeriodType.quarterly:
        final startMonth = (periodIndex - 1) * 3 + 1;
        start = DateTime(year, startMonth, 1);
        end = DateTime(year, startMonth + 3, 0, 23, 59, 59);
        break;
      case ReportPeriodType.biannual:
        final startMonth = (periodIndex - 1) * 6 + 1;
        start = DateTime(year, startMonth, 1);
        end = DateTime(year, startMonth + 6, 0, 23, 59, 59);
        break;
      case ReportPeriodType.annual:
        start = DateTime(year, 1, 1);
        end = DateTime(year, 12, 31, 23, 59, 59);
        break;
    }

    String format(DateTime d) =>
        '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

    return {
      'dateFrom': format(start),
      'dateTo': format(end),
    };
  }

  /// Load all dashboard data
  Future<void> loadDashboard({
    String? entityId,
    String? dateFrom,
    String? dateTo,
    ReportPeriodType? periodType,
    int? year,
    int? periodIndex,
  }) async {
    final effectiveEntityId = entityId ?? state.entityId;
    final effectiveType = periodType ?? state.periodType;
    final effectiveYear = year ?? state.year;
    final effectivePeriodIndex = periodIndex ?? state.periodIndex;

    final bounds = _calculatePeriodBounds(
      effectiveType,
      effectiveYear,
      effectivePeriodIndex,
    );
    final effectiveDateFrom = dateFrom ?? bounds['dateFrom']!;
    final effectiveDateTo = dateTo ?? bounds['dateTo']!;

    state = state.copyWith(
      isLoading: true,
      error: null,
      entityId: effectiveEntityId,
      dateFrom: effectiveDateFrom,
      dateTo: effectiveDateTo,
      periodType: effectiveType,
      year: effectiveYear,
      periodIndex: effectivePeriodIndex,
    );

    // Load each section independently to handle partial failures gracefully
    TrendsResponse? trends;
    ComparisonResponse? comparison;
    RankingsResponse? rankings;
    ExpensesResponse? expenses;
    final List<String> errors = [];

    // Load trends
    try {
      trends = await reportsService.getTrends(
        entityId: effectiveEntityId,
        dateFrom: effectiveDateFrom,
        dateTo: effectiveDateTo,
      );
    } catch (e) {
      // Trends failure is not critical - skip it silently
      debugPrint('Trends load failed: $e');
    }

    // Load comparison
    try {
      comparison = await reportsService.getComparison(
        entityId: effectiveEntityId,
        dateFrom: effectiveDateFrom,
        dateTo: effectiveDateTo,
        periodType: effectiveType,
        year: effectiveYear,
        month: effectiveType == ReportPeriodType.monthly
            ? effectivePeriodIndex
            : null,
        quarter: effectiveType == ReportPeriodType.quarterly
            ? effectivePeriodIndex
            : null,
        half: effectiveType == ReportPeriodType.biannual
            ? effectivePeriodIndex
            : null,
      );
    } catch (e) {
      // Comparison failure is not critical - skip it silently
      debugPrint('Comparison load failed: $e');
    }

    // Load rankings
    try {
      rankings = await reportsService.getRankings(
        entityId: effectiveEntityId,
        dateFrom: effectiveDateFrom,
        dateTo: effectiveDateTo,
      );
    } catch (e) {
      if (e is AuthException &&
          (e.technicalMessage?.contains('403') == true ||
              e.technicalMessage?.contains('Forbidden') == true)) {
        errors.add('Rankings requiere el permiso REPORT_VIEW_HIERARCHY');
      }
      debugPrint('Rankings load failed: $e');
    }

    // Load expenses
    try {
      expenses = await reportsService.getExpenses(
        entityId: effectiveEntityId,
        dateFrom: effectiveDateFrom,
        dateTo: effectiveDateTo,
      );
    } catch (e) {
      errors.add('No se pudieron cargar los gastos');
      debugPrint('Expenses load failed: $e');
    }

    // Update state with whatever data we could load
    if (mounted) {
      final errorMessage = errors.isEmpty ? null : errors.join('\n');
      state = state.copyWith(
        isLoading: false,
        trends: trends,
        comparison: comparison,
        rankings: rankings,
        expenses: expenses,
        error: errorMessage,
      );
    }

    // If we have at least some data, consider it a partial success
    return;
  }

  /// Reload trends only
  Future<void> reloadTrends() async {
    if (state.dateFrom == null || state.dateTo == null) return;

    try {
      final trends = await reportsService.getTrends(
        entityId: state.entityId,
        dateFrom: state.dateFrom!,
        dateTo: state.dateTo!,
      );
      if (mounted) {
        state = state.copyWith(trends: trends);
      }
    } catch (e) {
      if (mounted) {
        state = state.copyWith(
          error: 'Error al cargar tendencias: ${e.toString()}',
        );
      }
    }
  }

  /// Reload comparison only
  Future<void> reloadComparison() async {
    if (state.dateFrom == null || state.dateTo == null) return;

    try {
      final comparison = await reportsService.getComparison(
        entityId: state.entityId,
        dateFrom: state.dateFrom!,
        dateTo: state.dateTo!,
        periodType: state.periodType,
        year: state.year,
        month: state.periodType == ReportPeriodType.monthly
            ? state.periodIndex
            : null,
        quarter: state.periodType == ReportPeriodType.quarterly
            ? state.periodIndex
            : null,
        half: state.periodType == ReportPeriodType.biannual
            ? state.periodIndex
            : null,
      );
      if (mounted) {
        state = state.copyWith(comparison: comparison);
      }
    } catch (e) {
      if (mounted) {
        state = state.copyWith(
          error: 'Error al cargar comparación: ${e.toString()}',
        );
      }
    }
  }

  /// Reload rankings only
  Future<void> reloadRankings() async {
    if (state.dateFrom == null || state.dateTo == null) return;

    try {
      final rankings = await reportsService.getRankings(
        entityId: state.entityId,
        dateFrom: state.dateFrom!,
        dateTo: state.dateTo!,
      );
      if (mounted) {
        state = state.copyWith(rankings: rankings);
      }
    } catch (e) {
      if (mounted) {
        state = state.copyWith(
          error: 'Error al cargar rankings: ${e.toString()}',
        );
      }
    }
  }

  /// Reload expenses only
  Future<void> reloadExpenses() async {
    if (state.dateFrom == null || state.dateTo == null) return;

    try {
      final expenses = await reportsService.getExpenses(
        entityId: state.entityId,
        dateFrom: state.dateFrom!,
        dateTo: state.dateTo!,
      );
      if (mounted) {
        state = state.copyWith(expenses: expenses);
      }
    } catch (e) {
      if (mounted) {
        state = state.copyWith(
          error: 'Error al cargar gastos: ${e.toString()}',
        );
      }
    }
  }

  Future<void> updatePeriodType(ReportPeriodType newType) async {
    final now = DateTime.now();
    int newIndex;
    switch (newType) {
      case ReportPeriodType.monthly:
        newIndex = now.month;
        break;
      case ReportPeriodType.quarterly:
        newIndex = ((now.month - 1) ~/ 3) + 1;
        break;
      case ReportPeriodType.biannual:
        newIndex = now.month <= 6 ? 1 : 2;
        break;
      case ReportPeriodType.annual:
        newIndex = 1;
        break;
    }

    await loadDashboard(
      entityId: state.entityId,
      periodType: newType,
      year: now.year,
      periodIndex: newIndex,
    );
  }

  Future<void> previousPeriod() async {
    int newYear = state.year;
    int newIndex = state.periodIndex;

    if (newIndex > 1) {
      newIndex--;
    } else {
      newYear--;
      newIndex = state.periodType.maxPeriodIndex;
    }

    await loadDashboard(
      entityId: state.entityId,
      periodType: state.periodType,
      year: newYear,
      periodIndex: newIndex,
    );
  }

  Future<void> nextPeriod() async {
    int newYear = state.year;
    int newIndex = state.periodIndex;

    if (newIndex < state.periodType.maxPeriodIndex) {
      newIndex++;
    } else {
      newYear++;
      newIndex = 1;
    }

    await loadDashboard(
      entityId: state.entityId,
      periodType: state.periodType,
      year: newYear,
      periodIndex: newIndex,
    );
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }
}

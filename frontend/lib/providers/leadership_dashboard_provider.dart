import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/leadership_dashboard_data.dart';
import '../models/leadership_reports.dart';
import '../models/report_period_type.dart';
import '../services/reports_service.dart';
import 'auth.dart';

final leadershipDashboardProvider =
    AsyncNotifierProvider<LeadershipDashboardNotifier, LeadershipDashboardData>(
        LeadershipDashboardNotifier.new);

class LeadershipDashboardNotifier
    extends AsyncNotifier<LeadershipDashboardData> {
  late ReportsService reportsService;

  ReportPeriodType _periodType = ReportPeriodType.monthly;
  int _year = DateTime.now().year;
  int _periodIndex = DateTime.now().month;

  ReportPeriodType get periodType => _periodType;
  int get year => _year;
  int get periodIndex => _periodIndex;

  @override
  Future<LeadershipDashboardData> build() async {
    final authState = ref.watch(authNotifierProvider);
    Future<String> getAccessToken() async => authState.accessToken ?? '';
    reportsService = ReportsService.localhost(getAccessToken);

    final primaryEntity =
        authState.user?['primary_entity'] as Map<String, dynamic>?;
    final entityId = primaryEntity?['id'] as String?;

    return _fetchDashboardData(entityId: entityId);
  }

  Map<String, String> _calculatePeriodBounds() {
    DateTime start;
    DateTime end;

    switch (_periodType) {
      case ReportPeriodType.monthly:
        start = DateTime(_year, _periodIndex, 1);
        end = DateTime(_year, _periodIndex + 1, 0, 23, 59, 59);
        break;
      case ReportPeriodType.quarterly:
        final startMonth = (_periodIndex - 1) * 3 + 1;
        start = DateTime(_year, startMonth, 1);
        end = DateTime(_year, startMonth + 3, 0, 23, 59, 59);
        break;
      case ReportPeriodType.biannual:
        final startMonth = (_periodIndex - 1) * 6 + 1;
        start = DateTime(_year, startMonth, 1);
        end = DateTime(_year, startMonth + 6, 0, 23, 59, 59);
        break;
      case ReportPeriodType.annual:
        start = DateTime(_year, 1, 1);
        end = DateTime(_year, 12, 31, 23, 59, 59);
        break;
    }

    String format(DateTime d) =>
        '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

    return {'dateFrom': format(start), 'dateTo': format(end)};
  }

  Future<void> loadDashboard({String? entityId}) async {
    state = const AsyncValue.loading();
    try {
      state = AsyncValue.data(await _fetchDashboardData(entityId: entityId));
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<LeadershipDashboardData> _fetchDashboardData({
    String? entityId,
  }) async {
    final bounds = _calculatePeriodBounds();
    final dateFrom = bounds['dateFrom']!;
    final dateTo = bounds['dateTo']!;

    final results = await Future.wait([
      reportsService.getTrends(
        entityId: entityId,
        dateFrom: dateFrom,
        dateTo: dateTo,
      ),
      reportsService.getComparison(
        entityId: entityId,
        dateFrom: dateFrom,
        dateTo: dateTo,
        periodType: _periodType,
        year: _year,
        month: _periodType == ReportPeriodType.monthly ? _periodIndex : null,
        quarter:
            _periodType == ReportPeriodType.quarterly ? _periodIndex : null,
        half: _periodType == ReportPeriodType.biannual ? _periodIndex : null,
      ),
      reportsService.getRankings(
        entityId: entityId,
        dateFrom: dateFrom,
        dateTo: dateTo,
      ),
      reportsService.getExpenses(
        entityId: entityId,
        dateFrom: dateFrom,
        dateTo: dateTo,
      ),
    ]);

    return LeadershipDashboardData(
      trends: results[0] as TrendsResponse,
      comparison: results[1] as ComparisonResponse,
      rankings: results[2] as RankingsResponse,
      expenses: results[3] as ExpensesResponse,
    );
  }

  Future<void> updatePeriodType(ReportPeriodType newType) async {
    final now = DateTime.now();
    _periodType = newType;
    _year = now.year;
    switch (newType) {
      case ReportPeriodType.monthly:
        _periodIndex = now.month;
        break;
      case ReportPeriodType.quarterly:
        _periodIndex = ((now.month - 1) ~/ 3) + 1;
        break;
      case ReportPeriodType.biannual:
        _periodIndex = now.month <= 6 ? 1 : 2;
        break;
      case ReportPeriodType.annual:
        _periodIndex = 1;
        break;
    }
    await loadDashboard();
  }

  Future<void> previousPeriod({String? entityId}) async {
    if (_periodIndex > 1) {
      _periodIndex--;
    } else {
      _year--;
      _periodIndex = _periodType.maxPeriodIndex;
    }
    await loadDashboard(entityId: entityId);
  }

  Future<void> nextPeriod({String? entityId}) async {
    if (_periodIndex < _periodType.maxPeriodIndex) {
      _periodIndex++;
    } else {
      _year++;
      _periodIndex = 1;
    }
    await loadDashboard(entityId: entityId);
  }
}

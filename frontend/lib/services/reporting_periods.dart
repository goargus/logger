import '../config/api_config.dart';
import '../core/api_client.dart';

class ReportingPeriodsService {
  ReportingPeriodsService({
    required this.apiClient,
  });

  final ApiClient apiClient;

  factory ReportingPeriodsService.localhost(
      AccessTokenProvider getAccessToken) {
    final apiClient = ApiClient(
      baseUrl: ApiConfig.baseUrl,
      getAccessToken: getAccessToken,
    );
    return ReportingPeriodsService(apiClient: apiClient);
  }

  Future<List<LockedDateRange>> getLockedDateRanges() async {
    try {
      final data = await apiClient.get('reporting-periods/locked-dates/ranges');
      final ranges = data['lockedRanges'] as List<dynamic>;
      return ranges
          .map((range) =>
              LockedDateRange.fromJson(range as Map<String, dynamic>))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<ReportingPeriodSummary?> getActiveReportingPeriod() async {
    try {
      final data = await apiClient.get('reporting-periods');
      if (data == null) {
        return null;
      }
      final list = data['data'] as List<dynamic>;
      final periods = list
          .map((item) =>
              ReportingPeriodSummary.fromJson(item as Map<String, dynamic>))
          .toList();

      if (periods.isEmpty) {
        return null;
      }

      final today = DateTime.now();
      for (final period in periods) {
        if (period.isActiveForDate(today)) {
          return period;
        }
      }

      return null;
    } catch (e) {
      rethrow;
    }
  }

  Future<bool> isDateLocked(DateTime date) async {
    final ranges = await getLockedDateRanges();
    final dateStr = _formatDate(date);

    for (final range in ranges) {
      if (dateStr.compareTo(range.startDate) >= 0 &&
          dateStr.compareTo(range.endDate) <= 0) {
        return true;
      }
    }

    return false;
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}

class LockedDateRange {
  final String startDate;
  final String endDate;
  final String periodName;

  LockedDateRange({
    required this.startDate,
    required this.endDate,
    required this.periodName,
  });

  factory LockedDateRange.fromJson(Map<String, dynamic> json) {
    return LockedDateRange(
      startDate: json['startDate'] as String,
      endDate: json['endDate'] as String,
      periodName: json['periodName'] as String,
    );
  }

  bool containsDate(String dateStr) {
    return dateStr.compareTo(startDate) >= 0 && dateStr.compareTo(endDate) <= 0;
  }

  bool containsDateTime(DateTime date) {
    final dateStr =
        '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    return containsDate(dateStr);
  }
}

class ReportingPeriodSummary {
  final String id;
  final String name;
  final String startDate;
  final String endDate;
  final String status;
  final bool isLocked;

  ReportingPeriodSummary({
    required this.id,
    required this.name,
    required this.startDate,
    required this.endDate,
    required this.status,
    required this.isLocked,
  });

  factory ReportingPeriodSummary.fromJson(Map<String, dynamic> json) {
    return ReportingPeriodSummary(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      startDate: json['startDate'] as String,
      endDate: json['endDate'] as String,
      status: json['status'] as String? ?? '',
      isLocked: json['isLocked'] as bool? ?? false,
    );
  }

  bool get isActive => status.toLowerCase() == 'active' && isLocked == false;

  bool containsDate(String dateStr) {
    return dateStr.compareTo(startDate) >= 0 && dateStr.compareTo(endDate) <= 0;
  }

  bool containsDateTime(DateTime date) {
    final dateStr =
        '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    return containsDate(dateStr);
  }

  bool isActiveForDate(DateTime date) => isActive && containsDateTime(date);

  String get label => '$startDate - $endDate';
}

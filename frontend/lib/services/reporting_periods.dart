import '../config/api_config.dart';
import '../core/api_client.dart';

class ReportingPeriodsService {
  ReportingPeriodsService({
    required this.apiClient,
  });

  final ApiClient apiClient;

  factory ReportingPeriodsService.localhost(AccessTokenProvider getAccessToken) {
    final apiClient = ApiClient(
      baseUrl: ApiConfig.baseUrl,
      getAccessToken: getAccessToken,
    );
    return ReportingPeriodsService(apiClient: apiClient);
  }

  Future<List<LockedDateRange>> getLockedDateRanges() async {
    print('[ReportingPeriodsService] Fetching locked date ranges...');
    try {
      final data = await apiClient.get('reporting-periods/locked-dates/ranges');
      print('[ReportingPeriodsService] API response: $data');
      final ranges = data['lockedRanges'] as List<dynamic>;
      print('[ReportingPeriodsService] Parsed ${ranges.length} locked ranges');
      return ranges
          .map((range) => LockedDateRange.fromJson(range as Map<String, dynamic>))
          .toList();
    } catch (e) {
      print('[ReportingPeriodsService] Error fetching locked ranges: $e');
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

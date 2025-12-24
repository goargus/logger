import '../config/api_config.dart';
import '../core/api_client.dart';
import '../models/report_summary.dart';
import '../models/report_breakdown.dart';

class ReportsService {
  ReportsService({
    required this.apiClient,
  });

  final ApiClient apiClient;

  factory ReportsService.localhost(AccessTokenProvider getAccessToken) {
    final apiClient = ApiClient(
      baseUrl: ApiConfig.baseUrl,
      getAccessToken: getAccessToken,
    );
    return ReportsService(apiClient: apiClient);
  }

  Future<ReportSummary> getPersonalSummary({
    required String periodStart,
    required String periodEnd,
  }) async {
    try {
      final data = await apiClient.get(
        'reports/summary',
        queryParameters: {
          'dateFrom': periodStart,
          'dateTo': periodEnd,
        },
      );

      return ReportSummary.fromApi(data as Map<String, dynamic>);
    } catch (e) {
      return ReportSummary.empty();
    }
  }

  Future<List<ReportBreakdown>> getPersonalBreakdown({
    required String periodStart,
    required String periodEnd,
  }) async {
    try {
      final data = await apiClient.get(
        'reports/breakdowns',
        queryParameters: {
          'dateFrom': periodStart,
          'dateTo': periodEnd,
        },
      );

      final items = data['byType'] as List<dynamic>? ?? [];
      return items
          .map((item) => ReportBreakdown.fromApi(item as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }
}

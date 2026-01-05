import '../config/api_config.dart';
import '../core/api_client.dart';

class DashboardStatsService {
  DashboardStatsService({
    required this.apiClient,
  });

  final ApiClient apiClient;

  factory DashboardStatsService.localhost(AccessTokenProvider getAccessToken) {
    final apiClient = ApiClient(
      baseUrl: ApiConfig.baseUrl,
      getAccessToken: getAccessToken,
    );
    return DashboardStatsService(apiClient: apiClient);
  }

  Future<Map<String, dynamic>> getDashboardStats({
    String? periodStart,
    String? periodEnd,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (periodStart != null) queryParams['dateFrom'] = periodStart;
      if (periodEnd != null) queryParams['dateTo'] = periodEnd;

      final summaryData = await apiClient.get(
        'reports/summary',
        queryParameters: queryParams,
      );

      final breakdownData = await apiClient.get(
        'reports/breakdowns',
        queryParameters: queryParams,
      );

      return {
        'summary': summaryData,
        'breakdown': breakdownData,
      };
    } catch (e) {
      return {
        'summary': null,
        'breakdown': null,
        'error': e.toString(),
      };
    }
  }
}

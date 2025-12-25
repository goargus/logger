import '../config/api_config.dart';
import '../core/api_client.dart';
import '../models/report_summary.dart';
import '../models/report_breakdown.dart';
import '../models/report_period_type.dart';

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

  Future<BreakdownsComparisonResponse> getBreakdownWithComparison({
    required ReportPeriodType periodType,
    required int year,
    int? month,
    int? quarter,
    int? half,
  }) async {
    final queryParams = <String, String>{
      'periodType': periodType.apiValue,
      'year': year.toString(),
      'includeComparison': 'true',
    };

    if (month != null) queryParams['month'] = month.toString();
    if (quarter != null) queryParams['quarter'] = quarter.toString();
    if (half != null) queryParams['half'] = half.toString();

    final data = await apiClient.get(
      'reports/breakdowns',
      queryParameters: queryParams,
    );

    return BreakdownsComparisonResponse.fromApi(data as Map<String, dynamic>);
  }
}

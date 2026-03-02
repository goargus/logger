import '../config/api_config.dart';
import '../core/api_client.dart';
import '../models/report_summary.dart';
import '../models/report_breakdown.dart';
import '../models/report_period_type.dart';
import '../models/hierarchy_breakdown.dart';
import '../models/user_activities.dart';
import '../models/engagement_report.dart';
import '../models/users_report.dart';
import '../models/leadership_reports.dart';

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
    final data = await apiClient.get(
      'reports/summary',
      queryParameters: {
        'dateFrom': periodStart,
        'dateTo': periodEnd,
      },
    );

    return ReportSummary.fromApi(data as Map<String, dynamic>);
  }

  Future<List<ReportBreakdown>> getPersonalBreakdown({
    required String periodStart,
    required String periodEnd,
  }) async {
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

  /// Get activity type breakdown for an entity
  Future<List<ReportBreakdown>> getEntityBreakdown({
    String? entityId,
    required String periodStart,
    required String periodEnd,
  }) async {
    final queryParams = <String, String>{
      'dateFrom': periodStart,
      'dateTo': periodEnd,
    };

    if (entityId != null) queryParams['entityId'] = entityId;

    final data = await apiClient.get(
      'reports/breakdowns',
      queryParameters: queryParams,
    );

    final items = data['byType'] as List<dynamic>? ?? [];
    return items
        .map((item) => ReportBreakdown.fromApi(item as Map<String, dynamic>))
        .toList();
  }

  /// Get summary report with optional hierarchy breakdown for entity leaders
  Future<HierarchySummaryResponse> getHierarchySummary({
    String? entityId,
    String? periodStart,
    String? periodEnd,
    bool includeHierarchyBreakdown = true,
  }) async {
    final queryParams = <String, String>{
      'includeHierarchyBreakdown': includeHierarchyBreakdown.toString(),
    };

    if (entityId != null) queryParams['entityId'] = entityId;
    if (periodStart != null) queryParams['dateFrom'] = periodStart;
    if (periodEnd != null) queryParams['dateTo'] = periodEnd;

    final data = await apiClient.get(
      'reports/summary',
      queryParameters: queryParams,
    );

    return HierarchySummaryResponse.fromApi(data as Map<String, dynamic>);
  }

  /// Get activities for a specific user (requires hierarchy access)
  Future<UserActivitiesResponse> getUserActivities({
    required String userId,
    String? periodId,
    String? dateFrom,
    String? dateTo,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };

    if (periodId != null) queryParams['periodId'] = periodId;
    if (dateFrom != null) queryParams['dateFrom'] = dateFrom;
    if (dateTo != null) queryParams['dateTo'] = dateTo;

    final data = await apiClient.get(
      'reports/user/$userId/activities',
      queryParameters: queryParams,
    );

    return UserActivitiesResponse.fromApi(data as Map<String, dynamic>);
  }

  /// Get engagement report (active vs inactive users)
  Future<EngagementResponse> getEngagement({
    String? entityId,
    String? dateFrom,
    String? dateTo,
  }) async {
    final queryParams = <String, String>{};

    if (entityId != null) queryParams['entityId'] = entityId;
    if (dateFrom != null) queryParams['dateFrom'] = dateFrom;
    if (dateTo != null) queryParams['dateTo'] = dateTo;

    final data = await apiClient.get(
      'reports/engagement',
      queryParameters: queryParams,
    );

    return EngagementResponse.fromApi(data as Map<String, dynamic>);
  }

  /// Get paginated users report with activity metrics
  Future<UsersReportResponse> getUsersReport({
    String? entityId,
    String? dateFrom,
    String? dateTo,
    int page = 1,
    int limit = 20,
    String? sortBy,
    String? sortOrder,
    EngagementFilter? engagement,
    String? search,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };

    if (entityId != null) queryParams['entityId'] = entityId;
    if (dateFrom != null) queryParams['dateFrom'] = dateFrom;
    if (dateTo != null) queryParams['dateTo'] = dateTo;
    if (sortBy != null) queryParams['sortBy'] = sortBy;
    if (sortOrder != null) queryParams['sortOrder'] = sortOrder;
    if (engagement != null) queryParams['engagement'] = engagement.apiValue;
    if (search != null && search.isNotEmpty) queryParams['search'] = search;

    final data = await apiClient.get(
      'reports/users',
      queryParameters: queryParams,
    );

    return UsersReportResponse.fromApi(data as Map<String, dynamic>);
  }

  /// Get export URL for downloading reports
  String getExportUrl({
    required String format,
    required String reportType,
    String? entityId,
    String? dateFrom,
    String? dateTo,
    bool includeHierarchy = true,
  }) {
    final queryParams = <String, String>{
      'format': format,
      'reportType': reportType,
      'includeHierarchy': includeHierarchy.toString(),
    };

    if (entityId != null) queryParams['entityId'] = entityId;
    if (dateFrom != null) queryParams['dateFrom'] = dateFrom;
    if (dateTo != null) queryParams['dateTo'] = dateTo;

    final queryString = queryParams.entries
        .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
        .join('&');

    return '${apiClient.baseUrl}/reports/export?$queryString';
  }

  /// Export report and return the data as string
  Future<ExportResponse> exportReport({
    required String format,
    required String reportType,
    String? entityId,
    String? dateFrom,
    String? dateTo,
    bool includeHierarchy = true,
  }) async {
    final queryParams = <String, String>{
      'format': format,
      'reportType': reportType,
      'includeHierarchy': includeHierarchy.toString(),
    };

    if (entityId != null) queryParams['entityId'] = entityId;
    if (dateFrom != null) queryParams['dateFrom'] = dateFrom;
    if (dateTo != null) queryParams['dateTo'] = dateTo;

    final response = await apiClient.getRaw(
      'reports/export',
      queryParameters: queryParams,
    );

    final contentDisposition = response.headers['content-disposition'];
    String filename = 'reporte.$format';
    if (contentDisposition != null) {
      final match =
          RegExp(r'filename="([^"]+)"').firstMatch(contentDisposition);
      if (match != null) {
        filename = match.group(1) ?? filename;
      }
    }

    return ExportResponse(
      data: response.body,
      filename: filename,
      contentType:
          response.headers['content-type'] ?? 'application/octet-stream',
    );
  }

  /// Get activity trends over multiple periods (last 5 periods)
  Future<TrendsResponse> getTrends({
    String? entityId,
    String? dateFrom,
    String? dateTo,
  }) async {
    final queryParams = <String, String>{};

    if (entityId != null) queryParams['entityId'] = entityId;
    if (dateFrom != null) queryParams['dateFrom'] = dateFrom;
    if (dateTo != null) queryParams['dateTo'] = dateTo;

    final data = await apiClient.get(
      'reports/trends',
      queryParameters: queryParams,
    );

    return TrendsResponse.fromApi(data as Map<String, dynamic>);
  }

  /// Compare current period with previous period
  Future<ComparisonResponse> getComparison({
    String? entityId,
    String? dateFrom,
    String? dateTo,
    ReportPeriodType? periodType,
    int? year,
    int? month,
    int? quarter,
    int? half,
  }) async {
    final queryParams = <String, String>{};

    if (entityId != null) queryParams['entityId'] = entityId;
    if (dateFrom != null) queryParams['dateFrom'] = dateFrom;
    if (dateTo != null) queryParams['dateTo'] = dateTo;
    if (periodType != null) queryParams['periodType'] = periodType.apiValue;
    if (year != null) queryParams['year'] = year.toString();
    if (month != null) queryParams['month'] = month.toString();
    if (quarter != null) queryParams['quarter'] = quarter.toString();
    if (half != null) queryParams['half'] = half.toString();

    final data = await apiClient.get(
      'reports/comparison',
      queryParameters: queryParams,
    );

    return ComparisonResponse.fromApi(data as Map<String, dynamic>);
  }

  /// Get rankings: top performers, lowest engagement, inactive users
  /// Requires REPORT_VIEW_HIERARCHY permission
  Future<RankingsResponse> getRankings({
    String? entityId,
    String? dateFrom,
    String? dateTo,
    int topN = 10,
  }) async {
    final queryParams = <String, String>{
      'limit': topN.toString(),
    };

    if (entityId != null) queryParams['entityId'] = entityId;
    if (dateFrom != null) queryParams['dateFrom'] = dateFrom;
    if (dateTo != null) queryParams['dateTo'] = dateTo;

    final data = await apiClient.get(
      'reports/rankings',
      queryParameters: queryParams,
    );

    return RankingsResponse.fromApi(data as Map<String, dynamic>);
  }

  /// Get expense breakdown by type, entity, and user
  Future<ExpensesResponse> getExpenses({
    String? entityId,
    String? dateFrom,
    String? dateTo,
  }) async {
    final queryParams = <String, String>{};

    if (entityId != null) queryParams['entityId'] = entityId;
    if (dateFrom != null) queryParams['dateFrom'] = dateFrom;
    if (dateTo != null) queryParams['dateTo'] = dateTo;

    final data = await apiClient.get(
      'reports/expenses',
      queryParameters: queryParams,
    );

    return ExpensesResponse.fromApi(data as Map<String, dynamic>);
  }
}

/// Response from export endpoint
class ExportResponse {
  final String data;
  final String filename;
  final String contentType;

  const ExportResponse({
    required this.data,
    required this.filename,
    required this.contentType,
  });
}

import '../config/api_config.dart';
import '../core/api_client.dart';

class ActivityService {
  ActivityService({
    required this.apiClient,
  });

  final ApiClient apiClient;

  factory ActivityService.localhost(AccessTokenProvider getAccessToken) {
    final apiClient = ApiClient(
      baseUrl: ApiConfig.baseUrl,
      getAccessToken: getAccessToken,
    );
    return ActivityService(apiClient: apiClient);
  }

  Future<Map<String, dynamic>> createActivity({
    required String typeId,
    required DateTime date,
    String? description,
    bool hasExpense = false,
    String? expenseAmount,
  }) async {
    final iso = date.toUtc().toIso8601String();

    final payload = <String, dynamic>{
      'activityTypeId': typeId,
      'activityDate': iso,
      if (description != null && description.trim().isNotEmpty)
        'description': description.trim(),
      'hasExpense': hasExpense,
      if (hasExpense) 'expenseAmount': (expenseAmount ?? '0').trim(),
    };

    final result = await apiClient.post('activities', body: payload);
    return result as Map<String, dynamic>;
  }

  Future<double> getMonthlyExpenseTotal({
    required int year,
    required int month,
  }) async {
    final data = await apiClient.get(
      'activities/stats/monthly-expenses',
      queryParameters: {
        'year': year.toString(),
        'month': month.toString(),
      },
    );

    return (data['total'] as num).toDouble();
  }

  Future<List<Map<String, dynamic>>> getRecentActivities(
      {int limit = 5}) async {
    final data = await apiClient.get(
      'activities',
      queryParameters: {
        'page': '1',
        'limit': limit.toString(),
      },
    );

    final items = data['items'] as List<dynamic>;
    return items.cast<Map<String, dynamic>>();
  }
}

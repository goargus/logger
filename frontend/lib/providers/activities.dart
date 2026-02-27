import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/activity.dart';
import '../services/activity.dart';
import '../config/api_config.dart';
import '../core/api_client.dart';
import 'auth.dart';

final activityServiceProvider = Provider<ActivityService>((ref) {
  final apiClient = ApiClient(
    baseUrl: ApiConfig.baseUrl,
    getAccessToken: () async {
      final authState = ref.read(authNotifierProvider);
      return authState.accessToken ?? '';
    },
  );
  return ActivityService(apiClient: apiClient);
});

class RecentActivitiesNotifier extends AsyncNotifier<List<Activity>> {
  /// Default limit for dashboard recent activities display.
  /// Balances performance with user experience by showing recent items.
  static const int _dashboardActivityLimit = 5;

  @override
  Future<List<Activity>> build() async {
    return _fetchActivities();
  }

  Future<List<Activity>> _fetchActivities() async {
    final service = ref.read(activityServiceProvider);
    final now = DateTime.now();
    final firstDay = DateTime(now.year, now.month, 1);
    final lastDay = DateTime(now.year, now.month + 1, 0);
    final startDate = _formatDate(firstDay);
    final endDate = _formatDate(lastDay);
    final activitiesData = await service.getRecentActivities(
      limit: _dashboardActivityLimit,
      startDate: startDate,
      endDate: endDate,
    );
    return activitiesData.map((data) => Activity.fromApi(data)).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetchActivities);
  }
}

final recentActivitiesProvider =
    AsyncNotifierProvider<RecentActivitiesNotifier, List<Activity>>(
        RecentActivitiesNotifier.new);

String _formatDate(DateTime date) {
  return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
}

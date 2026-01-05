import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/dashboard_stats.dart';
import '../services/dashboard_stats_service.dart';
import 'auth.dart';

final dashboardStatsServiceProvider = Provider<DashboardStatsService>((ref) {
  return DashboardStatsService.localhost(() async {
    final authNotifier = ref.read(authNotifierProvider.notifier);
    return await authNotifier.getAccessToken() ?? '';
  });
});

class DashboardStatsNotifier extends StateNotifier<AsyncValue<DashboardStats>> {
  DashboardStatsNotifier(this.service) : super(const AsyncValue.loading());

  final DashboardStatsService service;

  Future<void> fetch({String? periodStart, String? periodEnd}) async {
    state = const AsyncValue.loading();
    
    try {
      final data = await service.getDashboardStats(
        periodStart: periodStart,
        periodEnd: periodEnd,
      );
      
      final stats = DashboardStats.fromApi(data);
      state = AsyncValue.data(stats);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  void refresh() {
    fetch();
  }
}

final dashboardStatsProvider =
    StateNotifierProvider<DashboardStatsNotifier, AsyncValue<DashboardStats>>((ref) {
  final service = ref.watch(dashboardStatsServiceProvider);
  return DashboardStatsNotifier(service);
});

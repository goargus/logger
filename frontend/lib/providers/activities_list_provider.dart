import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/activity.dart';
import '../models/activities_filter.dart';
import '../models/activities_list_state.dart';
import 'activities.dart';

export '../models/activities_list_state.dart';

class ActivitiesListNotifier extends AsyncNotifier<ActivitiesListState> {
  @override
  Future<ActivitiesListState> build() async {
    return _fetchActivities(ActivitiesListState.initial());
  }

  Future<ActivitiesListState> _fetchActivities(
      ActivitiesListState currentState) async {
    final service = ref.read(activityServiceProvider);

    final filterParams = currentState.filter;
    final data = await service.getActivitiesPaginated(
      page: currentState.page,
      limit: currentState.limit,
      startDate: filterParams.startDate?.toIso8601String().split('T').first,
      endDate: filterParams.endDate?.toIso8601String().split('T').first,
      activityTypeId: filterParams.activityTypeId,
      hasExpense: filterParams.hasExpense,
      search: filterParams.search,
    );

    final items = (data['data'] as List)
        .map((e) => Activity.fromApi(e as Map<String, dynamic>))
        .toList();
    final pagination = data['pagination'] as Map<String, dynamic>;

    return currentState.copyWith(
      items: items,
      total: pagination['total'] as int,
      page: pagination['page'] as int,
      limit: pagination['limit'] as int,
    );
  }

  Future<void> setFilter(ActivitiesFilter filter, {TimePreset? preset}) async {
    state = const AsyncLoading();
    final currentState = state.value ?? ActivitiesListState.initial();
    final newState = currentState.copyWith(
      filter: filter,
      page: 1,
      selectedPreset: preset,
      clearPreset: preset == null,
    );

    state = await AsyncValue.guard(() => _fetchActivities(newState));
  }

  Future<void> setPage(int page) async {
    if (state.value == null) return;
    state = const AsyncLoading();
    final newState = state.value!.copyWith(page: page);
    state = await AsyncValue.guard(() => _fetchActivities(newState));
  }

  Future<void> nextPage() async {
    if (state.value?.hasNextPage ?? false) {
      await setPage(state.value!.page + 1);
    }
  }

  Future<void> previousPage() async {
    if (state.value?.hasPreviousPage ?? false) {
      await setPage(state.value!.page - 1);
    }
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => _fetchActivities(state.value ?? ActivitiesListState.initial()),
    );
  }
}

final activitiesListProvider =
    AsyncNotifierProvider<ActivitiesListNotifier, ActivitiesListState>(() {
  return ActivitiesListNotifier();
});

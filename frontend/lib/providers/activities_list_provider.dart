import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/activity.dart';
import '../models/activities_filter.dart';
import 'activities.dart';

class ActivitiesListState {
  final List<Activity> items;
  final int page;
  final int limit;
  final int total;
  final ActivitiesFilter filter;
  final TimePreset? selectedPreset;

  const ActivitiesListState({
    required this.items,
    required this.page,
    required this.limit,
    required this.total,
    required this.filter,
    this.selectedPreset,
  });

  factory ActivitiesListState.initial() {
    return const ActivitiesListState(
      items: [],
      page: 1,
      limit: 20,
      total: 0,
      filter: ActivitiesFilter(),
      selectedPreset: null,
    );
  }

  int get totalPages => total == 0 ? 1 : (total / limit).ceil();
  bool get hasNextPage => page < totalPages;
  bool get hasPreviousPage => page > 1;

  ActivitiesListState copyWith({
    List<Activity>? items,
    int? page,
    int? limit,
    int? total,
    ActivitiesFilter? filter,
    TimePreset? selectedPreset,
    bool clearPreset = false,
  }) {
    return ActivitiesListState(
      items: items ?? this.items,
      page: page ?? this.page,
      limit: limit ?? this.limit,
      total: total ?? this.total,
      filter: filter ?? this.filter,
      selectedPreset:
          clearPreset ? null : (selectedPreset ?? this.selectedPreset),
    );
  }
}

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

    final items = (data['items'] as List)
        .map((e) => Activity.fromApi(e as Map<String, dynamic>))
        .toList();

    return currentState.copyWith(
      items: items,
      total: data['total'] as int,
      page: data['page'] as int,
      limit: data['limit'] as int,
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

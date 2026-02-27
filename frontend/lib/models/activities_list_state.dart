import 'activity.dart';
import 'activities_filter.dart';

class ActivitiesListState {
  final List<Activity> items;
  final int page;
  final int limit;
  final int total;
  final ActivitiesFilter filter;
  final TimePreset? selectedPreset;
  final String? sortBy;
  final bool sortAscending;

  const ActivitiesListState({
    required this.items,
    required this.page,
    required this.limit,
    required this.total,
    required this.filter,
    this.selectedPreset,
    this.sortBy,
    this.sortAscending = false,
  });

  factory ActivitiesListState.initial() {
    final range = TimePreset.thisMonth.getRange();
    return ActivitiesListState(
      items: const [],
      page: 1,
      limit: 20,
      total: 0,
      filter: ActivitiesFilter(
        startDate: range.start,
        endDate: range.end,
      ),
      selectedPreset: TimePreset.thisMonth,
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
    String? sortBy,
    bool? sortAscending,
    bool clearSort = false,
  }) {
    return ActivitiesListState(
      items: items ?? this.items,
      page: page ?? this.page,
      limit: limit ?? this.limit,
      total: total ?? this.total,
      filter: filter ?? this.filter,
      selectedPreset:
          clearPreset ? null : (selectedPreset ?? this.selectedPreset),
      sortBy: clearSort ? null : (sortBy ?? this.sortBy),
      sortAscending: sortAscending ?? this.sortAscending,
    );
  }
}

import 'package:flutter_test/flutter_test.dart';
import 'package:logger/models/activities_filter.dart';
import 'package:logger/models/activities_list_state.dart';

void main() {
  group('ActivitiesListState.initial', () {
    test('defaults to thisMonth preset', () {
      final state = ActivitiesListState.initial();
      expect(state.selectedPreset, TimePreset.thisMonth);
    });

    test('sets start date to first of current month', () {
      final state = ActivitiesListState.initial();
      final now = DateTime.now();
      expect(state.filter.startDate, DateTime(now.year, now.month, 1));
    });

    test('sets end date to today', () {
      final state = ActivitiesListState.initial();
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      expect(state.filter.endDate, today);
    });

    test('starts on page 1 with default limit', () {
      final state = ActivitiesListState.initial();
      expect(state.page, 1);
      expect(state.limit, 20);
      expect(state.total, 0);
      expect(state.items, isEmpty);
    });
  });

  group('ActivitiesListState pagination', () {
    test('totalPages is 1 when no results', () {
      final state = ActivitiesListState.initial();
      expect(state.totalPages, 1);
    });

    test('calculates total pages from total and limit', () {
      final state = ActivitiesListState.initial().copyWith(total: 45, limit: 20);
      expect(state.totalPages, 3);
    });

    test('hasNextPage is false on last page', () {
      final state = ActivitiesListState.initial().copyWith(
        page: 2,
        total: 40,
        limit: 20,
      );
      expect(state.hasNextPage, isFalse);
    });

    test('hasPreviousPage is false on first page', () {
      final state = ActivitiesListState.initial();
      expect(state.hasPreviousPage, isFalse);
    });
  });

  group('ActivitiesListState.copyWith', () {
    test('clearPreset removes the selected preset', () {
      final state = ActivitiesListState.initial();
      final cleared = state.copyWith(clearPreset: true);
      expect(cleared.selectedPreset, isNull);
    });

    test('preserves filter when not overridden', () {
      final state = ActivitiesListState.initial();
      final updated = state.copyWith(page: 2);
      expect(updated.filter.startDate, state.filter.startDate);
      expect(updated.filter.endDate, state.filter.endDate);
    });
  });
}
